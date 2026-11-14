const db = require("../config/db");
const {
    getAuthInfo,
    getStaffFacility
} = require("../middlewares/lich-tiem.middleware");
async function saveScreening(req) {
    const lichTiemId = Number(req.body?.lich_tiem_id);
    const ketQua = req.body?.ket_qua;
    const bacSiKham = String(req.body?.bac_si_kham || "").trim();
    const thoiGianKham = req.body?.thoi_gian_kham;
    const ghiChu = String(req.body?.ghi_chu || "").trim();

    if (!Number.isInteger(lichTiemId) || lichTiemId <= 0) {
        return {
            status: 400,
            body: { message: "Mã lịch tiêm không hợp lệ" }
        };
    }

    if (!["DU_DIEU_KIEN", "TAM_HOAN", "CHONG_CHI_DINH"].includes(ketQua)) {
        return {
            status: 400,
            body: { message: "Kết quả khám sàng lọc không hợp lệ" }
        };
    }

    const bacSiRegex = /^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u;

    if (
        bacSiKham.length < 2 ||
        bacSiKham.length > 50 ||
        !bacSiRegex.test(bacSiKham)
    ) {
        return {
            status: 400,
            body: {
                message: "Tên bác sĩ phải từ 2 đến 50 ký tự, không chứa số hoặc ký tự đặc biệt"
            }
        };
    }

    if (
        typeof thoiGianKham !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(thoiGianKham) ||
        !Number.isFinite(new Date(thoiGianKham).getTime()) ||
        new Date(thoiGianKham).getTime() > Date.now()
    ) {
        return {
            status: 400,
            body: { message: "Thời gian khám không hợp lệ hoặc ở tương lai" }
        };
    }

    if (ghiChu.length > 1000) {
        return {
            status: 400,
            body: { message: "Ghi chú không được vượt quá 1000 ký tự" }
        };
    }
    if (
        ["TAM_HOAN", "CHONG_CHI_DINH"].includes(ketQua) &&
        !ghiChu
    ) {
        return {
            status: 400,
            body: {
                message: "Vui lòng nhập lý do tạm hoãn hoặc chống chỉ định tiêm"
            }
        };
    }
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const auth = await getStaffFacility(req, conn);

        if (!auth.ok) {
            await conn.rollback();
            return {
                status: auth.status,
                body: { message: auth.message }
            };
        }

        const [lichRows] = await conn.query(
            `SELECT
        id,
        co_so_id,
        trang_thai,
        DATE_FORMAT(ngay_tiem, '%Y-%m-%d') AS ngay_tiem
     FROM lich_tiem
     WHERE id = ?
     FOR UPDATE`,
            [lichTiemId]
        );

        if (!lichRows.length) {
            await conn.rollback();
            return {
                status: 404,
                body: { message: "Không tìm thấy lịch tiêm" }
            };
        }

        const lich = lichRows[0];

        if (
            auth.currentRole === "NHAN_VIEN_Y_TE" &&
            Number(lich.co_so_id) !== Number(auth.coSoId)
        ) {
            await conn.rollback();
            return {
                status: 403,
                body: { message: "Bạn không có quyền xử lý lịch của cơ sở khác" }
            };
        }

        if (lich.trang_thai !== "DA_DUYET") {
            await conn.rollback();
            return {
                status: 400,
                body: { message: "Chỉ ghi nhận sàng lọc cho lịch đã duyệt" }
            };
        }
        const [dateRows] = await conn.query(
            `SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hom_nay`
        );

        const homNay = dateRows[0].hom_nay;

        if (lich.ngay_tiem !== homNay) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message: "Chỉ được khám sàng lọc đúng ngày tiêm đã đăng ký"
                }
            };
        }

        // Thời gian khám phải đúng ngày tiêm
        const ngayKham = thoiGianKham.slice(0, 10);

        if (ngayKham !== lich.ngay_tiem) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message: "Thời gian khám sàng lọc phải trùng với ngày tiêm đã đăng ký"
                }
            };
        }

        const [existing] = await conn.query(
            `SELECT id FROM kham_sang_loc
             WHERE lich_tiem_id = ?
             FOR UPDATE`,
            [lichTiemId]
        );

        if (existing.length) {
            await conn.rollback();
            return {
                status: 409,
                body: {
                    message: "Lịch này đã có kết quả sàng lọc, không thể ghi đè"
                }
            };
        }

        await conn.query(
            `INSERT INTO kham_sang_loc
             (lich_tiem_id, ket_qua, bac_si_kham,
              thoi_gian_kham, nhan_vien_nhap_id, ghi_chu)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                lichTiemId,
                ketQua,
                bacSiKham,
                thoiGianKham.replace("T", " ") + ":00",
                auth.currentUserId,
                ghiChu || null
            ]
        );

        await conn.commit();

        return {
            status: 201,
            body: { message: "Ghi nhận kết quả khám sàng lọc thành công" }
        };
    } catch (err) {
        await conn.rollback();
        console.error("Lỗi lưu kết quả khám sàng lọc:", err);

        return {
            status: err.code === "ER_DUP_ENTRY" ? 409 : 500,
            body: {
                message: err.code === "ER_DUP_ENTRY"
                    ? "Lịch này đã có kết quả sàng lọc"
                    : "Lỗi server khi lưu kết quả khám sàng lọc"
            }
        };
    } finally {
        conn.release();
    }
}
async function getScreening(req) {
    const lichTiemId = Number(req.params.lichTiemId);

    if (
        !Number.isSafeInteger(lichTiemId) ||
        lichTiemId <= 0
    ) {
        return {
            status: 400,
            body: { message: "Mã lịch tiêm không hợp lệ" }
        };
    }

    try {
        const {
            currentUserId,
            currentRole
        } = getAuthInfo(req);

        if (
            !Number.isSafeInteger(currentUserId) ||
            currentUserId <= 0
        ) {
            return {
                status: 401,
                body: { message: "Bạn chưa đăng nhập" }
            };
        }

        if (
            ![
                "ADMIN",
                "NHAN_VIEN_Y_TE",
                "KHACH_HANG"
            ].includes(currentRole)
        ) {
            return {
                status: 403,
                body: { message: "Bạn không có quyền xem kết quả khám" }
            };
        }

        let auth = null;

        if (currentRole === "KHACH_HANG") {
            const [ownerRows] = await db.query(
                `
                SELECT 1
                FROM ho_so_tiem
                WHERE lich_tiem_id = ?
                  AND nguoi_dung_id = ?
                LIMIT 1
                `,
                [lichTiemId, currentUserId]
            );

            if (ownerRows.length === 0) {
                return {
                    status: 403,
                    body: {
                        message: "Bạn không có quyền xem kết quả khám của lịch tiêm này"
                    }
                };
            }
        } else {

            auth = await getStaffFacility(req);

            if (!auth.ok) {
                return {
                    status: auth.status,
                    body: { message: auth.message }
                };
            }
        }

        const [rows] = await db.query(
            `
            SELECT
                lt.co_so_id,
                ksl.*
            FROM lich_tiem lt
            LEFT JOIN kham_sang_loc ksl
                ON ksl.lich_tiem_id = lt.id
            WHERE lt.id = ?
            LIMIT 1
            `,
            [lichTiemId]
        );

        if (rows.length === 0) {
            return {
                status: 404,
                body: { message: "Không tìm thấy lịch tiêm" }
            };
        }

        if (
            currentRole === "NHAN_VIEN_Y_TE" &&
            Number(rows[0].co_so_id) !== Number(auth.coSoId)
        ) {
            return {
                status: 403,
                body: {
                    message: "Không có quyền xem lịch của cơ sở khác"
                }
            };
        }

        const { co_so_id, ...screening } = rows[0];

        if (!screening.id) {
            return {
                status: 200,
                body: { data: null }
            };
        }
        if (currentRole === "KHACH_HANG") {
            return {
                status: 200,
                body: {
                    data: {
                        ket_qua: screening.ket_qua,
                        bac_si_kham: screening.bac_si_kham,
                        thoi_gian_kham: screening.thoi_gian_kham,
                        ghi_chu: screening.ghi_chu
                    }
                }
            };
        }
        return {
            status: 200,
            body: { data: screening }
        };

    } catch (err) {
        console.error(
            "Lỗi lấy kết quả khám sàng lọc:",
            err
        );

        return {
            status: 500,
            body: { message: "Lỗi server" }
        };
    }
}


async function updateScreening(req) {
    const lichTiemId = Number(req.params.lichTiemId);
    const ketQua = req.body?.ket_qua;
    const bacSiKham = String(req.body?.bac_si_kham || "").trim();
    const thoiGianKham = req.body?.thoi_gian_kham;
    const ghiChu = String(req.body?.ghi_chu || "").trim();
    const lyDo = String(req.body?.ly_do_chinh_sua || "").trim();

    if (!Number.isInteger(lichTiemId) || lichTiemId <= 0) {
        return { status: 400, body: { message: "Mã lịch không hợp lệ" } };
    }

    if (!["DU_DIEU_KIEN", "TAM_HOAN", "CHONG_CHI_DINH"].includes(ketQua)) {
        return { status: 400, body: { message: "Kết quả khám không hợp lệ" } };
    }

    const bacSiRegex = /^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u;

    if (bacSiKham.length < 2 || bacSiKham.length > 50 ||
        !bacSiRegex.test(bacSiKham)) {
        return { status: 400, body: { message: "Tên bác sĩ không hợp lệ" } };
    }

    if (
        typeof thoiGianKham !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(thoiGianKham) ||
        !Number.isFinite(new Date(thoiGianKham).getTime()) ||
        new Date(thoiGianKham).getTime() > Date.now()
    ) {
        return { status: 400, body: { message: "Thời gian khám không hợp lệ" } };
    }

    if (!lyDo || lyDo.length > 500) {
        return {
            status: 400, body: {
                message: "Lý do chỉnh sửa phải có từ 1 đến 500 ký tự"
            }
        };
    }

    if (ghiChu.length > 1000 ||
        (["TAM_HOAN", "CHONG_CHI_DINH"].includes(ketQua) && !ghiChu)) {
        return {
            status: 400, body: {
                message: "Ghi chú không hợp lệ hoặc thiếu lý do hoãn/chống chỉ định"
            }
        };
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const auth = await getStaffFacility(req, conn);

        if (!auth.ok) {
            await conn.rollback();
            return { status: auth.status, body: { message: auth.message } };
        }

        const [lichRows] = await conn.query(
            `SELECT id, co_so_id, trang_thai,
                    DATE_FORMAT(ngay_tiem, '%Y-%m-%d') AS ngay_tiem
             FROM lich_tiem WHERE id = ? FOR UPDATE`,
            [lichTiemId]
        );

        if (!lichRows.length) {
            await conn.rollback();
            return { status: 404, body: { message: "Không tìm thấy lịch tiêm" } };
        }

        const lich = lichRows[0];

        if (auth.currentRole === "NHAN_VIEN_Y_TE" &&
            Number(lich.co_so_id) !== Number(auth.coSoId)) {
            await conn.rollback();
            return { status: 403, body: { message: "Không thuộc cơ sở quản lý" } };
        }

        // DA_TIEM và DA_HUY đều không được chỉnh sửa.
        if (lich.trang_thai !== "DA_DUYET") {
            await conn.rollback();
            return {
                status: 409, body: {
                    message: "Chỉ được điều chỉnh kết quả của lịch đã duyệt, chưa tiêm"
                }
            };
        }
        const [[todayRow]] = await conn.query(
            "SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hom_nay"
        );

        if (lich.ngay_tiem !== todayRow.hom_nay ||
            thoiGianKham.slice(0, 10) !== lich.ngay_tiem) {
            await conn.rollback();
            return {
                status: 409, body: {
                    message: "Chỉ được điều chỉnh trong ngày khám theo lịch hẹn"
                }
            };
        }

        const [rows] = await conn.query(
            `SELECT id, ket_qua, bac_si_kham, thoi_gian_kham, ghi_chu
             FROM kham_sang_loc
             WHERE lich_tiem_id = ? FOR UPDATE`,
            [lichTiemId]
        );

        if (!rows.length) {
            await conn.rollback();
            return {
                status: 404, body: {
                    message: "Chưa có phiếu khám sàng lọc để điều chỉnh"
                }
            };
        }

        const cu = rows[0];
        const thoiGianMoi = thoiGianKham.replace("T", " ") + ":00";

        await conn.query(
            `INSERT INTO lich_su_kham_sang_loc (
                kham_sang_loc_id,
                ket_qua_cu, ket_qua_moi,
                bac_si_kham_cu, bac_si_kham_moi,
                thoi_gian_kham_cu, thoi_gian_kham_moi,
                ghi_chu_cu, ghi_chu_moi,
                nguoi_chinh_sua_id, ly_do_chinh_sua
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                cu.id,
                cu.ket_qua, ketQua,
                cu.bac_si_kham, bacSiKham,
                cu.thoi_gian_kham, thoiGianMoi,
                cu.ghi_chu, ghiChu || null,
                auth.currentUserId, lyDo
            ]
        );

        // Cập nhật kết quả hiện tại.
        await conn.query(
            `UPDATE kham_sang_loc
             SET ket_qua = ?, bac_si_kham = ?,
                 thoi_gian_kham = ?, ghi_chu = ?
             WHERE id = ?`,
            [ketQua, bacSiKham, thoiGianMoi, ghiChu || null, cu.id]
        );

        await conn.commit();

        return {
            status: 200,
            body: { message: "Điều chỉnh khám sàng lọc thành công" }
        };
    } catch (err) {
        await conn.rollback();
        console.error("Lỗi điều chỉnh sàng lọc:", err);
        return {
            status: 500, body: {
                message: "Lỗi server khi điều chỉnh khám sàng lọc"
            }
        };
    } finally {
        conn.release();
    }
}

async function getScreeningHistory(req) {
    const lichTiemId = Number(req.params.lichTiemId);

    if (!Number.isInteger(lichTiemId) || lichTiemId <= 0) {
        return {
            status: 400,
            body: { message: "Mã lịch tiêm không hợp lệ" }
        };
    }

    try {
        const auth = await getStaffFacility(req);

        if (!auth.ok) {
            return {
                status: auth.status,
                body: { message: auth.message }
            };
        }

        if (auth.currentRole !== "ADMIN") {
            return {
                status: 403,
                body: { message: "Chỉ Admin được xem lịch sử chỉnh sửa" }
            };
        }

        // Xác định phiếu khám thuộc lịch tiêm.
        const [lichRows] = await db.query(
            `SELECT lt.id, ksl.id AS kham_sang_loc_id
             FROM lich_tiem lt
             LEFT JOIN kham_sang_loc ksl
                 ON ksl.lich_tiem_id = lt.id
             WHERE lt.id = ?
             LIMIT 1`,
            [lichTiemId]
        );

        if (!lichRows.length) {
            return {
                status: 404,
                body: { message: "Không tìm thấy lịch tiêm" }
            };
        }

        if (!lichRows[0].kham_sang_loc_id) {
            return {
                status: 200,
                body: { data: [] }
            };
        }

        const [rows] = await db.query(
            `SELECT
                id,
                kham_sang_loc_id,
                ket_qua_cu,
                ket_qua_moi,
                bac_si_kham_cu,
                bac_si_kham_moi,
                thoi_gian_kham_cu,
                thoi_gian_kham_moi,
                ghi_chu_cu,
                ghi_chu_moi,
                nguoi_chinh_sua_id,
                ly_do_chinh_sua,
                thoi_gian_chinh_sua
             FROM lich_su_kham_sang_loc
             WHERE kham_sang_loc_id = ?
             ORDER BY thoi_gian_chinh_sua DESC, id DESC`,
            [lichRows[0].kham_sang_loc_id]
        );

        return {
            status: 200,
            body: { data: rows }
        };
    } catch (error) {
        console.error("Lỗi lấy lịch sử khám sàng lọc:", error);

        return {
            status: 500,
            body: { message: "Lỗi server khi lấy lịch sử chỉnh sửa" }
        };
    }
}
module.exports = {
    saveScreening,
    getScreening,
    updateScreening,
    getScreeningHistory
};

