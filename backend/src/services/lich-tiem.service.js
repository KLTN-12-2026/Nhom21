const db = require("../config/db");
const {
    fullNameRegex,
    isEmpty,
    isValidDateFormat,
    isValidTimeFormat,
    isWithinWorkingHours,
    getTodayString,
    addDays,
    getAuthInfo,
    getStaffFacility
} = require("../middlewares/lich-tiem.middleware");

// LẤY DANH SÁCH LỊCH TIÊM
async function getAdminSchedules(req) {
    const { status = "ALL", date } = req.query;

    const allowedStatus = [
        "ALL",
        "CHO_DUYET",
        "DA_DUYET",
        "DA_HUY",
        "DA_TIEM"
    ];

    if (!allowedStatus.includes(status)) {
        return {
            status: 400,
            body: {
                message: "Trạng thái lọc không hợp lệ"
            }
        };
    }

    if (date && !isValidDateFormat(date)) {
        return {
            status: 400,
            body: {
                message: "Ngày lọc không đúng định dạng YYYY-MM-DD"
            }
        };
    }

    try {
        const auth = await getStaffFacility(req);

        if (!auth.ok) {
            return {
                status: auth.status,
                body: {
                    message: auth.message
                }
            };
        }

        let sql = `
            SELECT
                lt.id,  
                 lt.nguoi_dung_id,
                lt.nguoi_dung_id AS user_id,
                lt.ho_ten,

                DATE_FORMAT(
                    lt.ngay_sinh_nguoi_tiem,
                    '%Y-%m-%d'
                ) AS ngay_sinh_nguoi_tiem,

                lt.gioi_tinh_nguoi_tiem,
                lt.so_dien_thoai,
                lt.email_nguoi_tiem,
                lt.moi_quan_he,
                lt.vaccine_id,
                v.ten_vaccine AS vaccine,

                DATE_FORMAT(
                    lt.ngay_tiem,
                    '%Y-%m-%d'
                ) AS ngay_tiem,

                TIME_FORMAT(
                    lt.gio_tiem,
                    '%H:%i'
                ) AS gio_tiem,

                lt.co_so_id,
                cs.ten_co_so,
                cs.dia_chi AS dia_chi_co_so,
                lt.trang_thai,
lt.ly_do_huy,

tt.trang_thai AS trang_thai_thanh_toan,
tt.phuong_thuc AS phuong_thuc_thanh_toan,
tt.so_tien AS so_tien_thanh_toan,

(
    SELECT ht.trang_thai
    FROM hoan_tien ht
    WHERE ht.lich_tiem_id = lt.id
    ORDER BY ht.id DESC
    LIMIT 1
) AS trang_thai_hoan_tien,

(
    SELECT ht.ly_do
    FROM hoan_tien ht
    WHERE ht.lich_tiem_id = lt.id
    ORDER BY ht.id DESC
    LIMIT 1
) AS ly_do_hoan_tien,

(
    SELECT nd.vai_tro
    FROM hoan_tien ht
    LEFT JOIN nguoi_dung nd
        ON nd.id = ht.nguoi_yeu_cau_id
    WHERE ht.lich_tiem_id = lt.id
    ORDER BY ht.id DESC
    LIMIT 1
) AS vai_tro_nguoi_yeu_cau,

(
    SELECT nd.ten_dang_nhap
    FROM hoan_tien ht
    LEFT JOIN nguoi_dung nd
        ON nd.id = ht.nguoi_yeu_cau_id
    WHERE ht.lich_tiem_id = lt.id
    ORDER BY ht.id DESC
    LIMIT 1
) AS ten_nguoi_yeu_cau,

ksl.ket_qua AS ket_qua_sang_loc,
lt.ghi_chu,
u.ten_dang_nhap AS username

            FROM lich_tiem lt

            LEFT JOIN vaccine v
            ON lt.vaccine_id = v.id

            LEFT JOIN nguoi_dung u
            ON lt.nguoi_dung_id = u.id 

            LEFT JOIN co_so_tiem cs
                ON lt.co_so_id = cs.id

            LEFT JOIN thanh_toan tt
                ON tt.lich_tiem_id = lt.id

            LEFT JOIN kham_sang_loc ksl
                ON ksl.lich_tiem_id = lt.id

            WHERE 1 = 1
            `;

        const params = [];

        // Nhân viên y tế chỉ xem lịch của cơ sở mình.
        // ADMIN không bị giới hạn theo cơ sở.

        if (auth.currentRole === "NHAN_VIEN_Y_TE") {
            sql += " AND lt.co_so_id = ?";
            params.push(auth.coSoId);
        }

        // Lọc theo trạng thái

        if (status !== "ALL") {
            sql += " AND lt.trang_thai = ?";
            params.push(status);
        }

        // Lọc theo ngày tiêm

        if (date) {
            sql +=
                " AND DATE_FORMAT(lt.ngay_tiem, '%Y-%m-%d') = ?";

            params.push(date);
        }

        // Sắp xếp lịch tiêm

        sql +=
            " ORDER BY lt.ngay_tiem DESC, lt.gio_tiem ASC";

        const [rows] = await db.query(sql, params);

        return {
            status: 200,
            body: rows
        };

    } catch (err) {
        console.error(
            "Lỗi lấy danh sách lịch tiêm:",
            err
        );

        return {
            status: 500,
            body: {
                message: "Lỗi server"
            }
        };
    }
}

//ADMIN - XEM LỊCH SỬ ĐẶT LỊCH CỦA KHÁCH HÀNG
async function getCustomerAppointmentHistory(req) {
    const userId = Number(req.params.userId);

    // 1. Kiểm tra ID khách hàng
    if (!Number.isSafeInteger(userId) || userId <= 0) {
        return {
            status: 400,
            body: {
                message: "ID khách hàng không hợp lệ"
            }
        };
    }

    // Chỉ ADMIN được tra cứu lịch sử
    const { currentRole } = getAuthInfo(req);

    if (currentRole !== "ADMIN") {
        return {
            status: 403,
            body: {
                message: "Bạn không có quyền xem lịch sử đặt lịch"
            }
        };
    }

    try {
        // Kiểm tra tài khoản khách hàng tồn tại
        const [customerRows] = await db.query(
            `
            SELECT id
            FROM nguoi_dung
            WHERE id = ?
              AND vai_tro = 'KHACH_HANG'
            LIMIT 1
            `,
            [userId]
        );

        if (customerRows.length === 0) {
            return {
                status: 404,
                body: {
                    message: "Không tìm thấy khách hàng"
                }
            };
        }

        // Lấy toàn bộ lịch đã đặt của khách hàng
        const [rows] = await db.query(
            `
            SELECT
                lt.id,
                lt.nguoi_dung_id,
                lt.ho_ten,
                lt.moi_quan_he,

                v.ten_vaccine AS ten_vaccine,

                DATE_FORMAT(
                    lt.ngay_tiem,
                    '%Y-%m-%d'
                ) AS ngay_tiem,

                TIME_FORMAT(
                    lt.gio_tiem,
                    '%H:%i'
                ) AS gio_tiem,

                cs.ten_co_so,

                lt.trang_thai,
                lt.ly_do_huy,

                tt.trang_thai AS trang_thai_thanh_toan,
                tt.phuong_thuc AS phuong_thuc_thanh_toan,

                (
                    SELECT ht.trang_thai
                    FROM hoan_tien ht
                    WHERE ht.lich_tiem_id = lt.id
                    ORDER BY ht.id DESC
                    LIMIT 1
                ) AS trang_thai_hoan_tien,

                (
                    SELECT ht.ly_do
                    FROM hoan_tien ht
                    WHERE ht.lich_tiem_id = lt.id
                    ORDER BY ht.id DESC
                    LIMIT 1
                ) AS ly_do_hoan_tien

            FROM lich_tiem lt

            LEFT JOIN vaccine v
                ON v.id = lt.vaccine_id

            LEFT JOIN co_so_tiem cs
                ON cs.id = lt.co_so_id

            LEFT JOIN thanh_toan tt
                ON tt.id = (
                    SELECT tt2.id
                    FROM thanh_toan tt2
                    WHERE tt2.lich_tiem_id = lt.id
                    ORDER BY tt2.id DESC
                    LIMIT 1
                )

            WHERE lt.nguoi_dung_id = ?

            ORDER BY
                lt.ngay_tiem DESC,
                lt.gio_tiem DESC,
                lt.id DESC
            `,
            [userId]
        );

        // Trả về danh sách, kể cả khi rỗng
        return {
            status: 200,
            body: rows
        };

    } catch (err) {
        console.error(
            "Lỗi lấy lịch sử đặt lịch của khách hàng:",
            err
        );

        return {
            status: 500,
            body: {
                message: "Lỗi server khi lấy lịch sử đặt lịch"
            }
        };
    }
}


// DUYỆT / HỦY LỊCH TIÊM
async function updateScheduleStatus(req) {
    const id = Number(req.params.id);
    const { trang_thai, ly_do } = req.body;

    const ALLOWED = [
        "CHO_DUYET",
        "DA_DUYET",
        "DA_HUY"
    ];

    if (!Number.isInteger(id) || id <= 0) {
        return {
            status: 400,
            body: {
                message: "Mã lịch tiêm không hợp lệ"
            }
        };
    }

    if (!ALLOWED.includes(trang_thai)) {
        return {
            status: 400,
            body: {
                message: "Trạng thái không hợp lệ"
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

        // ==========================================
        // LẤY LỊCH TIÊM VÀ THÔNG TIN THANH TOÁN
        const [lichRows] = await conn.query(
            `
                SELECT
                    lt.id,
                    lt.nguoi_dung_id,
                    lt.co_so_id,
                    lt.ngay_tiem,
                    lt.trang_thai,

                    tt.id AS thanh_toan_id,
                    tt.so_tien,
                    tt.phuong_thuc,
                    tt.trang_thai AS trang_thai_thanh_toan

                FROM lich_tiem lt

                LEFT JOIN thanh_toan tt
                    ON tt.lich_tiem_id = lt.id

                WHERE lt.id = ?

                LIMIT 1
                FOR UPDATE
            `,
            [id]
        );

        if (lichRows.length === 0) {
            await conn.rollback();

            return {
                status: 404,
                body: {
                    message: "Không tìm thấy lịch tiêm"
                }
            };
        }

        const lich = lichRows[0];

        // KIỂM TRA CƠ SỞ CỦA NHÂN VIÊN Y TẾ
        if (
            auth.currentRole === "NHAN_VIEN_Y_TE" &&
            Number(lich.co_so_id) !== auth.coSoId
        ) {
            await conn.rollback();

            return {
                status: 403,
                body: {
                    message:
                        "Bạn không có quyền xử lý lịch tiêm của cơ sở khác"
                }
            };
        }

        // Không cho thay đổi lịch đã tiêm hoặc đã hủy
        if (lich.trang_thai === "DA_TIEM" ||
            lich.trang_thai === "DA_HUY") {

            await conn.rollback();

            return {
                status: 409,
                body: {
                    message:
                        "Lịch đã tiêm hoặc đã hủy không thể thay đổi trạng thái"
                }
            };
        }

        // CHẶN THAY ĐỔI KHI ĐANG CHỜ HOÀN TIỀN
        const [refundPendingRows] = await conn.query(
            `
        SELECT id
        FROM hoan_tien
        WHERE lich_tiem_id = ?
          AND trang_thai = 'CHO_XU_LY'
        LIMIT 1
    `,
            [id]
        );

        if (refundPendingRows.length > 0) {
            await conn.rollback();

            return {
                status: 409,
                body: {
                    message:
                        "Lịch tiêm đang có yêu cầu hoàn tiền chờ ADMIN xử lý. Không thể tiếp tục thay đổi trạng thái lịch."
                }
            };
        }
        // CẬP NHẬT TRẠNG THÁI KHÔNG PHẢI HỦY

        if (trang_thai !== "DA_HUY") {
            if (
                trang_thai !== "DA_DUYET" ||
                lich.trang_thai !== "CHO_DUYET"
            ) {
                await conn.rollback();

                return {
                    status: 409,
                    body: {
                        message: "Chỉ được duyệt lịch đang ở trạng thái chờ duyệt"
                    }
                };
            }
            const [result] = await conn.query(
                `
                    UPDATE lich_tiem
                    SET trang_thai = ?
                    WHERE id = ?
                `,
                [trang_thai, id]
            );

            if (result.affectedRows === 0) {
                await conn.rollback();

                return {
                    status: 404,
                    body: {
                        message: "Không tìm thấy lịch tiêm"
                    }
                };
            }

            await conn.commit();

            return {
                status: 200,
                body: {
                    message:
                        "Cập nhật trạng thái lịch tiêm thành công"
                }
            };
        }
        // NGHIỆP VỤ HỦY LỊCH

        if (lich.trang_thai === "DA_HUY") {
            await conn.rollback();

            return {
                status: 409,
                body: {
                    message: "Lịch tiêm này đã được hủy"
                }
            };
        }
        // Kiểm tra lý do hủy cho mọi trường hợp hủy lịch
        const lyDo = String(ly_do ?? "").trim();

        if (!lyDo || lyDo.length > 500) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message: "Lý do hủy phải có từ 1 đến 500 ký tự"
                }
            };
        }

        // KIỂM TRA THANH TOÁN
        const daThanhToan =
            lich.thanh_toan_id &&
            lich.trang_thai_thanh_toan === "DA_THANH_TOAN";

        // CHƯA THANH TOÁN: HỦY TRỰC TIẾP
        if (!daThanhToan) {
            const [updateResult] = await conn.query(
                `
            UPDATE lich_tiem
            SET trang_thai = 'DA_HUY',
                ly_do_huy = ?
            WHERE id = ?
              AND trang_thai IN ('CHO_DUYET', 'DA_DUYET')
        `,
                [lyDo, id]
            );

            if (updateResult.affectedRows !== 1) {
                await conn.rollback();

                return {
                    status: 409,
                    body: {
                        message: "Không thể hủy lịch ở trạng thái hiện tại"
                    }
                };
            }

            await conn.commit();

            return {
                status: 200,
                body: {
                    message: "Hủy lịch thành công",
                    loai_xu_ly: "HUY_TRUC_TIEP",
                    trang_thai: "DA_HUY"
                }
            };
        }

        // ĐÃ THANH TOÁN: YÊU CẦU HOÀN TIỀN
        // Chỉ hỗ trợ yêu cầu hoàn tiền trực tuyến cho VNPAY
        if (lich.phuong_thuc !== "VNPAY") {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Lịch tiêm đã được thanh toán bằng tiền mặt. Vui lòng kiểm tra và xử lý khoản thanh toán trước khi hủy lịch."
                }
            };
        }
        // KIỂM TRA YÊU CẦU HOÀN TIỀN ĐÃ TỒN TẠI

        const [hoanTienRows] = await conn.query(
            `
                SELECT
                    id,
                    trang_thai
                FROM hoan_tien
                WHERE thanh_toan_id = ?
                LIMIT 1
                FOR UPDATE
            `,
            [lich.thanh_toan_id]
        );

        if (hoanTienRows.length > 0) {
            const yeuCau = hoanTienRows[0];

            await conn.rollback();

            if (yeuCau.trang_thai === "CHO_XU_LY") {
                return {
                    status: 409,
                    body: {
                        message:
                            "Lịch tiêm này đã có yêu cầu hoàn tiền đang chờ ADMIN xử lý"
                    }
                };
            }

            if (yeuCau.trang_thai === "DA_HOAN_TIEN") {
                return {
                    status: 409,
                    body: {
                        message:
                            "Giao dịch này đã được hoàn tiền"
                    }
                };
            }

            return {
                status: 409,
                body: {
                    message:
                        "Yêu cầu hoàn tiền của giao dịch này đã được xử lý trước đó"
                }
            };
        }
        // TẠO YÊU CẦU HOÀN TIỀN

        await conn.query(
            `
                INSERT INTO hoan_tien
                (
                    lich_tiem_id,
                    thanh_toan_id,
                    so_tien,
                    ly_do,
                    nguoi_yeu_cau_id,
                    trang_thai
                )
                VALUES (?, ?, ?, ?, ?, 'CHO_XU_LY')
            `,
            [
                id,
                lich.thanh_toan_id,
                lich.so_tien,
                lyDo,
                auth.currentUserId
            ]
        );

        await conn.commit();

        return {
            status: 201,
            body: {
                message:
                    "Đã gửi yêu cầu hủy và hoàn tiền. Vui lòng chờ ADMIN xử lý.",
                loai_xu_ly: "YEU_CAU_HOAN_TIEN",
                trang_thai_hoan_tien: "CHO_XU_LY"
            }
        };

    } catch (err) {
        await conn.rollback();

        console.error(
            "Lỗi cập nhật trạng thái lịch:",
            err
        );

        return {
            status: 500,
            body: {
                message: "Lỗi server"
            }
        };

    } finally {
        conn.release();
    }
}
// XÁC NHẬN ĐÃ TIÊM

async function confirmVaccination(req) {
    const id = Number(req.params.id);

    // 1. KIỂM TRA ID LỊCH TIÊM
    if (!Number.isInteger(id) || id <= 0) {
        return {
            status: 400,
            body: {
                message: "Mã lịch tiêm không hợp lệ"
            }
        };
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // KIỂM TRA QUYỀN NHÂN VIÊN / ADMIN
        const auth = await getStaffFacility(req, conn);

        if (!auth.ok) {
            await conn.rollback();

            return {
                status: auth.status,
                body: {
                    message: auth.message
                }
            };
        }

        // LẤY LỊCH TIÊM VÀ KHÓA BẢN GHI
        const [lichRows] = await conn.query(
            `
                SELECT
                    lt.*,
                    tt.trang_thai AS trang_thai_thanh_toan,
                    t.dia_chi

                FROM lich_tiem lt

                LEFT JOIN thanh_toan tt
                    ON tt.lich_tiem_id = lt.id

                LEFT JOIN thong_tin_ca_nhan t
                    ON t.nguoi_dung_id = lt.nguoi_dung_id

                WHERE lt.id = ?
                LIMIT 1
                FOR UPDATE
            `,
            [id]
        );

        if (lichRows.length === 0) {
            await conn.rollback();

            return {
                status: 404,
                body: {
                    message: "Không tìm thấy lịch tiêm"
                }
            };
        }

        const lich = lichRows[0];

        //NHÂN VIÊN CHỈ XÁC NHẬN TẠI CƠ SỞ MÌNH
        if (
            auth.currentRole === "NHAN_VIEN_Y_TE" &&
            Number(lich.co_so_id) !== auth.coSoId
        ) {
            await conn.rollback();

            return {
                status: 403,
                body: {
                    message:
                        "Bạn không có quyền xác nhận lịch tiêm của cơ sở khác"
                }
            };
        }

        // 5. KIỂM TRA TRẠNG THÁI LỊCH
        if (lich.trang_thai === "DA_TIEM") {
            await conn.rollback();

            return {
                status: 409,
                body: {
                    message:
                        "Lịch tiêm này đã được xác nhận đã tiêm"
                }
            };
        }

        if (lich.trang_thai !== "DA_DUYET") {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Chỉ xác nhận tiêm cho lịch đã duyệt"
                }
            };
        }
        // KIỂM TRA KẾT QUẢ KHÁM SÀNG LỌC

        const [sangLocRows] = await conn.query(
            `
    SELECT
    ket_qua,
    DATE_FORMAT(thoi_gian_kham, '%Y-%m-%d') AS ngay_kham
FROM kham_sang_loc
WHERE lich_tiem_id = ?
LIMIT 1
FOR UPDATE
    `,
            [id]
        );

        // Chưa khám sàng lọc
        if (sangLocRows.length === 0) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message: "Lịch tiêm chưa có kết quả khám sàng lọc"
                }
            };
        }

        if (sangLocRows[0].ket_qua !== "DU_DIEU_KIEN") {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message: "Khách hàng không đủ điều kiện tiêm vaccine"
                }
            };
        }
        // Ngày khám sàng lọc phải trùng ngày tiêm đã đăng ký
        const [ngayTiemRows] = await conn.query(
            `SELECT DATE_FORMAT(?, '%Y-%m-%d') AS ngay_tiem`,
            [lich.ngay_tiem]
        );

        if (sangLocRows[0].ngay_kham !== ngayTiemRows[0].ngay_tiem) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message: "Ngày khám sàng lọc không trùng ngày tiêm đã đăng ký."
                }
            };
        }
        // KHÔNG CHO TIÊM KHI ĐANG CÓ YÊU CẦU HOÀN TIỀN

        const [hoanTienRows] = await conn.query(
            `SELECT id
     FROM hoan_tien
     WHERE lich_tiem_id = ?
       AND trang_thai = 'CHO_XU_LY'
     LIMIT 1
     FOR UPDATE`,
            [id]
        );

        if (hoanTienRows.length > 0) {
            await conn.rollback();

            return {
                status: 409,
                body: {
                    message: "Lịch tiêm đang có yêu cầu hủy và hoàn tiền chờ ADMIN xử lý. Không thể xác nhận đã tiêm."
                }
            };
        }

        // KIỂM TRA THANH TOÁN
        if (
            lich.trang_thai_thanh_toan !==
            "DA_THANH_TOAN"
        ) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Lịch chưa thanh toán, không thể xác nhận tiêm"
                }
            };
        }

        // KIỂM TRA ĐÃ ĐẾN NGÀY TIÊM CHƯA
        // Dùng ngày của MySQL, không so sánh giờ.
        const [dateCheckRows] = await conn.query(
            `
                SELECT
                    CASE
                        WHEN DATE(?) = CURDATE()
                        THEN 1
                        ELSE 0
                    END AS da_den_ngay_tiem
            `,
            [lich.ngay_tiem]
        );

        const daDenNgayTiem =
            Number(
                dateCheckRows[0]?.da_den_ngay_tiem
            ) === 1;

        if (!daDenNgayTiem) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Chỉ được xác nhận đã tiêm đúng ngày đã đăng ký."
                }
            };
        }

        // KIỂM TRA THÔNG TIN NGƯỜI ĐƯỢC TIÊM
        const hoTen = String(
            lich.ho_ten || ""
        ).trim();

        const moiQuanHe = String(
            lich.moi_quan_he || "Bản thân"
        ).trim();

        const ngaySinh =
            lich.ngay_sinh_nguoi_tiem;

        if (
            !hoTen ||
            !moiQuanHe ||
            !ngaySinh
        ) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Thông tin người được tiêm trong lịch không đầy đủ"
                }
            };
        }
        const [vaccineRows] = await conn.query(
            `
        SELECT
            id,
            ten_vaccine,
            trang_thai
        FROM vaccine
        WHERE id = ?
        LIMIT 1
    `,
            [lich.vaccine_id]
        );

        if (vaccineRows.length === 0) {
            await conn.rollback();

            return {
                status: 404,
                body: {
                    message:
                        "Không tìm thấy vaccine của lịch tiêm"
                }
            };
        }

        const vaccineInfo = vaccineRows[0];

        if (vaccineInfo.trang_thai === "NGUNG") {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Vaccine của lịch tiêm hiện đã ngừng sử dụng"
                }
            };
        }

        // CHỌN LÔ VACCINE THEO 
        // Ưu tiên lô hết hạn sớm nhất.
        // Chỉ chọn lô còn hàng, chưa hết hạn,
        // đúng vaccine và đúng cơ sở.
        const [loRows] = await conn.query(
            `
                SELECT
                    id,
                    vaccine_id,
                    co_so_id,
                    ma_lo,
                    so_luong_con,
                    han_su_dung,
                    trang_thai

                FROM lo_vaccine

                WHERE vaccine_id = ?
                    AND co_so_id = ?
                    AND trang_thai = 'DANG_SU_DUNG'
                    AND so_luong_con > 0
                    AND han_su_dung >= CURDATE()

                ORDER BY
                    han_su_dung ASC,
                    id ASC

                LIMIT 1
                FOR UPDATE
            `,
            [
                vaccineInfo.id,
                lich.co_so_id
            ]
        );

        if (loRows.length === 0) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Cơ sở hiện không còn lô vaccine hợp lệ để xác nhận tiêm"
                }
            };
        }

        const loVaccine = loRows[0];

        // KIỂM TRA HỒ SƠ TIÊM ĐÃ TỒN TẠI
        const [existRows] = await conn.query(
            `
        SELECT id
        FROM ho_so_tiem
        WHERE lich_tiem_id = ?
        LIMIT 1
    `,
            [id]
        );
        if (existRows.length > 0) {
            await conn.rollback();

            return {
                status: 409,
                body: {
                    message:
                        "Lần tiêm này đã có trong hồ sơ tiêm chủng"
                }
            };
        }

        // TÍNH MŨI SỐ
        // Không cộng lẫn mũi của người thân khác.
        const [muiRows] = await conn.query(
            `
                SELECT
                    COALESCE(MAX(mui_so), 0) + 1
                        AS mui_so

                FROM ho_so_tiem

                WHERE nguoi_dung_id = ?
                    AND ho_ten = ?
                    AND moi_quan_he = ?
                    AND ngay_sinh = ?
                    AND ten_vaccine = ?
            `,
            [
                lich.nguoi_dung_id,
                hoTen,
                moiQuanHe,
                ngaySinh,
                vaccineInfo.ten_vaccine
            ]
        );

        const muiSo =
            Number(muiRows[0]?.mui_so) || 1;

        await conn.query(
            `
        INSERT INTO ho_so_tiem
        (
            lich_tiem_id,
            nguoi_dung_id,
            ho_ten,
            moi_quan_he,
            ngay_sinh,
            gioi_tinh,
            so_dien_thoai,
            dia_chi,
            ten_vaccine,
            mui_so,
            ngay_tiem,
            ghi_chu,
            co_so_id,
            lo_vaccine_id
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
        )
    `,
            [
                id,
                lich.nguoi_dung_id,
                hoTen,
                moiQuanHe,
                ngaySinh,
                lich.gioi_tinh_nguoi_tiem,
                lich.so_dien_thoai || "",
                lich.dia_chi || "",
                vaccineInfo.ten_vaccine,
                muiSo,
                lich.ngay_tiem,
                lich.ghi_chu || null,
                lich.co_so_id,
                loVaccine.id
            ]
        );

        // TRỪ MỘT LIỀU VACCINE TRONG LÔ
        const [updateLoResult] = await conn.query(
            `
                UPDATE lo_vaccine
                SET so_luong_con = so_luong_con - 1
                WHERE id = ?
                    AND so_luong_con > 0
            `,
            [loVaccine.id]
        );

        if (updateLoResult.affectedRows !== 1) {
            throw new Error(
                "Không thể cập nhật tồn kho lô vaccine"
            );
        }
        // 15. GHI LỊCH SỬ BIẾN ĐỘNG KHO KHI XÁC NHẬN TIÊM

        await conn.query(
            `
                INSERT INTO lich_su_bien_dong_kho (
                    lo_vaccine_id,
                    loai_bien_dong,
                    so_luong,
                    thoi_gian,
                    tham_chieu,
                    ghi_chu
                )
                VALUES (?, 'TIEM', 1, NOW(), ?, ?)
            `,
            [
                loVaccine.id,
                `LICH_TIEM:${id}`,
                "Xuất 1 liều vaccine để tiêm"
            ]
        );

        // NẾU LÔ HẾT HÀNG, ĐỔI TRẠNG THÁI
        await conn.query(
            `
                UPDATE lo_vaccine
                SET trang_thai = 'HET_HANG'
                WHERE id = ?
                    AND so_luong_con = 0
            `,
            [loVaccine.id]
        );

        // CẬP NHẬT LỊCH THÀNH ĐÃ TIÊM
        const [updateLichResult] = await conn.query(
            `
                UPDATE lich_tiem
                SET trang_thai = 'DA_TIEM'
                WHERE id = ?
                    AND trang_thai = 'DA_DUYET'
            `,
            [id]
        );

        if (updateLichResult.affectedRows !== 1) {
            throw new Error(
                "Không thể cập nhật trạng thái lịch tiêm"
            );
        }

        // LƯU TOÀN BỘ THAY ĐỔI
        await conn.commit();

        return {
            status: 200,
            body: {
                message:
                    "Xác nhận đã tiêm và tạo hồ sơ tiêm thành công",
                mui_so: muiSo,
                lo_vaccine_id: loVaccine.id,
                ma_lo: loVaccine.ma_lo || null
            }
        };

    } catch (err) {
        await conn.rollback();

        console.error(
            "Lỗi xác nhận đã tiêm:",
            err
        );

        return {
            status: 500,
            body: {
                message:
                    "Lỗi server khi xác nhận đã tiêm"
            }
        };

    } finally {
        conn.release();
    }
}

// 4. LẤY CHI TIẾT LỊCH TIÊM
async function getScheduleDetail(req) {
    try {
        const id = Number(req.params.id);

        // 1. KIỂM TRA ID LỊCH TIÊM
        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return {
                status: 400,
                body: {
                    message: "Mã lịch tiêm không hợp lệ"
                }
            };
        }

        // LẤY THÔNG TIN ĐĂNG NHẬP
        const {
            currentUserId,
            currentRole
        } = getAuthInfo(req);

        if (
            !Number.isInteger(currentUserId) ||
            currentUserId <= 0
        ) {
            return {
                status: 401,
                body: {
                    message: "Bạn chưa đăng nhập"
                }
            };
        }

        // KIỂM TRA VAI TRÒ
        if (
            ![
                "ADMIN",
                "NHAN_VIEN_Y_TE",
                "KHACH_HANG"
            ].includes(currentRole)
        ) {
            return {
                status: 403,
                body: {
                    message:
                        "Bạn không có quyền xem lịch tiêm"
                }
            };
        }

        // TRUY VẤN CHI TIẾT LỊCH TIÊM
        const [rows] = await db.query(
            `
                SELECT
                    lt.id,
                    lt.nguoi_dung_id AS user_id,
                    lt.ho_ten,

                    DATE_FORMAT(
                        lt.ngay_sinh_nguoi_tiem,
                        '%Y-%m-%d'
                    ) AS ngay_sinh_nguoi_tiem,

                    lt.gioi_tinh_nguoi_tiem,
                    lt.email_nguoi_tiem,
                    lt.moi_quan_he,
                    lt.vaccine_id,
                    v.ten_vaccine AS vaccine,

                    DATE_FORMAT(
                        lt.ngay_tiem,
                        '%Y-%m-%d'
                    ) AS ngay_tiem,

                    TIME_FORMAT(
                        lt.gio_tiem,
                        '%H:%i'
                    ) AS gio_tiem,

                    lt.co_so_id,
                    cs.ten_co_so,
                    cs.dia_chi AS dia_chi_co_so,
                    lt.trang_thai,
                    lt.ly_do_huy,
                    lt.ghi_chu,

                    vp.gia_ban AS gia_tien,

                    tt.id AS thanh_toan_id,
                    tt.trang_thai AS trang_thai_thanh_toan,
                    tt.so_tien,
                    tt.phuong_thuc,
                    tt.ma_giao_dich,
                    tt.ngay_thanh_toan

                FROM lich_tiem lt

                LEFT JOIN co_so_tiem cs
                    ON lt.co_so_id = cs.id

                LEFT JOIN vaccine v
                ON lt.vaccine_id = v.id

                LEFT JOIN bang_gia_vaccine vp
                ON vp.vaccine_id = v.id

                LEFT JOIN thanh_toan tt
                    ON tt.lich_tiem_id = lt.id

                WHERE lt.id = ?

                LIMIT 1
            `,
            [id]
        );

        // 5. KIỂM TRA LỊCH TIÊM TỒN TẠI
        if (rows.length === 0) {
            return {
                status: 404,
                body: {
                    message: "Không tìm thấy lịch tiêm"
                }
            };
        }

        const lich = rows[0];

        // KHÁCH HÀNG CHỈ XEM LỊCH CỦA MÌNH
        if (
            currentRole === "KHACH_HANG" &&
            Number(lich.user_id) !== currentUserId
        ) {
            return {
                status: 403,
                body: {
                    message:
                        "Bạn không có quyền xem lịch tiêm này"
                }
            };
        }

        // NHÂN VIÊN Y TẾ CHỈ XEM LỊCH
        // THUỘC CƠ SỞ ĐƯỢC PHÂN CÔNG
        if (currentRole === "NHAN_VIEN_Y_TE") {
            const auth = await getStaffFacility(req);

            if (!auth.ok) {
                return {
                    status: auth.status,
                    body: {
                        message: auth.message
                    }
                };
            }

            if (
                Number(lich.co_so_id) !== auth.coSoId
            ) {
                return {
                    status: 403,
                    body: {
                        message:
                            "Bạn không có quyền xem lịch tiêm của cơ sở khác"
                    }
                };
            }
        }

        // TRẢ VỀ CHI TIẾT LỊCH TIÊM
        return {
            status: 200,
            body: lich
        };

    } catch (err) {
        console.error(
            "Lỗi lấy chi tiết lịch tiêm:",
            err
        );

        return {
            status: 500,
            body: {
                message: "Lỗi server"
            }
        };
    }
}

// LẤY DANH SÁCH LỊCH TIÊM CỦA KHÁCH HÀNG
async function getUserSchedules(req) {
    try {
        const userId = Number(req.params.user_id);

        const {
            currentUserId,
            currentRole
        } = getAuthInfo(req);

        // 1. KIỂM TRA ĐĂNG NHẬP
        if (
            !Number.isInteger(currentUserId) ||
            currentUserId <= 0
        ) {
            return {
                status: 401,
                body: {
                    message: "Bạn chưa đăng nhập"
                }
            };
        }

        // CHỈ KHÁCH HÀNG ĐƯỢC SỬ DỤNG
        if (currentRole !== "KHACH_HANG") {
            return {
                status: 403,
                body: {
                    message:
                        "Chức năng này chỉ dành cho khách hàng"
                }
            };
        }

        // KIỂM TRA ID NGƯỜI DÙNG
        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {
            return {
                status: 400,
                body: {
                    message: "Người dùng không hợp lệ"
                }
            };
        }

        // KHÔNG CHO XEM LỊCH TÀI KHOẢN KHÁC
        if (userId !== currentUserId) {
            return {
                status: 403,
                body: {
                    message:
                        "Bạn không có quyền xem lịch tiêm của tài khoản khác"
                }
            };
        }

        // 5. LẤY DANH SÁCH LỊCH TIÊM
        const [rows] = await db.query(
            `
                SELECT
                    lt.id,
                    lt.nguoi_dung_id,

                    lt.ho_ten,
                    lt.moi_quan_he,

                    DATE_FORMAT(
                        lt.ngay_sinh_nguoi_tiem,
                        '%Y-%m-%d'
                    ) AS ngay_sinh_nguoi_tiem,

                    lt.gioi_tinh_nguoi_tiem,
                    lt.so_dien_thoai,
                   lt.email_nguoi_tiem,

                    lt.vaccine_id,
                    v.ten_vaccine AS vaccine,

                    DATE_FORMAT(
                        lt.ngay_tiem,
                        '%Y-%m-%d'
                    ) AS ngay_tiem,

                    TIME_FORMAT(
                        lt.gio_tiem,
                        '%H:%i'
                    ) AS gio_tiem,

                    lt.co_so_id,
                    cs.ten_co_so,
                    cs.dia_chi AS dia_chi_co_so,

                    lt.trang_thai,
                    lt.ly_do_huy,

                (
                    SELECT ht.trang_thai
                    FROM hoan_tien ht
                    WHERE ht.lich_tiem_id = lt.id
                    ORDER BY ht.id DESC
                    LIMIT 1
                    ) AS trang_thai_hoan_tien,

                    (
                    SELECT ht.ly_do
                    FROM hoan_tien ht
                    WHERE ht.lich_tiem_id = lt.id
                    ORDER BY ht.id DESC
                    LIMIT 1
                    ) AS ly_do_hoan_tien,

                lt.ghi_chu,
                    tt.id AS thanh_toan_id,
                    tt.phuong_thuc AS phuong_thuc_thanh_toan,
                    tt.trang_thai AS trang_thai_thanh_toan,
                    tt.so_tien AS so_tien_thanh_toan,
                    tt.ma_giao_dich,
                    tt.ngay_thanh_toan

                FROM lich_tiem lt

                    LEFT JOIN vaccine v
                    ON lt.vaccine_id = v.id

                LEFT JOIN co_so_tiem cs
                    ON lt.co_so_id = cs.id
                LEFT JOIN thanh_toan tt
                    ON tt.lich_tiem_id = lt.id

                WHERE lt.nguoi_dung_id = ?

                ORDER BY
                    lt.ngay_tiem ASC,
                    lt.gio_tiem ASC
            `,
            [userId]
        );

        // TRẢ DANH SÁCH LỊCH TIÊM
        return {
            status: 200,
            body: rows
        };

    } catch (err) {
        console.error(
            "Lỗi lấy lịch của user:",
            err
        );

        return {
            status: 500,
            body: {
                message: "Lỗi server"
            }
        };
    }
}

async function createSchedule(req) {
    let {
        nguoi_dung_id,
        ho_ten,
        so_dien_thoai,
        ngay_sinh_nguoi_tiem,
        gioi_tinh_nguoi_tiem,
        email_nguoi_tiem,
        vaccine_id,
        moi_quan_he,
        ngay_tiem,
        gio_tiem,
        co_so_id,
        ghi_chu
    } = req.body;

    // XÁC THỰC NGƯỜI ĐẶT LỊCH BẰNG JWT

    const currentUserId = Number(req.user?.id);

    const currentRole = req.user?.vai_tro;

    nguoi_dung_id = Number(nguoi_dung_id);

    if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
        return { status: 401, body: { message: "Bạn chưa đăng nhập" } };
    }

    if (currentRole !== "KHACH_HANG") {
        return {
            status: 403,
            body: { message: "Chức năng đặt lịch chỉ dành cho khách hàng" }
        };
    }

    if (
        !Number.isInteger(nguoi_dung_id) ||
        nguoi_dung_id <= 0 ||
        nguoi_dung_id !== currentUserId
    ) {
        return {
            status: 403,
            body: { message: "Thông tin người đặt lịch không hợp lệ" }
        };
    }

    // CHUẨN HÓA DỮ LIỆU
    ho_ten = (ho_ten || "").toString();
    so_dien_thoai = (so_dien_thoai || "").toString();
    ngay_sinh_nguoi_tiem = (ngay_sinh_nguoi_tiem || "").toString();
    gioi_tinh_nguoi_tiem = (gioi_tinh_nguoi_tiem || "").toString();
    email_nguoi_tiem = (email_nguoi_tiem || "").toString().trim();
    moi_quan_he = (moi_quan_he || "").toString();
    ngay_tiem = (ngay_tiem || "").toString();
    gio_tiem = (gio_tiem || "").toString();

    ghi_chu = isEmpty(ghi_chu) ? null : ghi_chu.toString();
    vaccine_id = isEmpty(vaccine_id) ? null : Number(vaccine_id);
    co_so_id = isEmpty(co_so_id) ? null : Number(co_so_id);

    // VALIDATE ID
    if (!Number.isInteger(co_so_id) || co_so_id <= 0) {
        return { status: 400, body: { message: "Cơ sở tiêm không hợp lệ" } };
    }

    if (!Number.isInteger(vaccine_id) || vaccine_id <= 0) {
        return { status: 400, body: { message: "Vaccine không hợp lệ" } };
    }

    // VALIDATE HỌ TÊN
    if (isEmpty(ho_ten)) {
        return { status: 400, body: { message: "Họ tên là bắt buộc" } };
    }

    if (ho_ten !== ho_ten.trim()) {
        return {
            status: 400,
            body: { message: "Họ tên không được có khoảng trắng ở đầu hoặc cuối" }
        };
    }

    if (ho_ten.trim().length < 2 || ho_ten.trim().length > 50) {
        return {
            status: 400,
            body: { message: "Họ tên phải từ 2 đến 50 ký tự" }
        };
    }

    if (!fullNameRegex.test(ho_ten.trim())) {
        return {
            status: 400,
            body: { message: "Họ tên không được chứa số hoặc ký tự đặc biệt" }
        };
    }

    // VALIDATE SỐ ĐIỆN THOẠI
    if (isEmpty(so_dien_thoai)) {
        return {
            status: 400,
            body: { message: "Số điện thoại liên hệ là bắt buộc" }
        };
    }

    if (!/^0\d{9}$/.test(so_dien_thoai.trim())) {
        return {
            status: 400,
            body: { message: "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0" }
        };
    }

    // VALIDATE NGÀY SINH
    if (isEmpty(ngay_sinh_nguoi_tiem)) {
        return {
            status: 400,
            body: { message: "Ngày sinh người được tiêm là bắt buộc" }
        };
    }

    if (!isValidDateFormat(ngay_sinh_nguoi_tiem)) {
        return {
            status: 400,
            body: { message: "Ngày sinh không đúng định dạng YYYY-MM-DD" }
        };
    }

    if (ngay_sinh_nguoi_tiem > getTodayString()) {
        return {
            status: 400,
            body: { message: "Ngày sinh không được lớn hơn ngày hiện tại" }
        };
    }
    // GIỚI HẠN TUỔI NGƯỜI ĐƯỢC TIÊM: 0–100 TUỔI
    const [birthYear, birthMonth, birthDay] =
        ngay_sinh_nguoi_tiem.split("-").map(Number);

    const now = new Date();

    let age = now.getFullYear() - birthYear;

    if (
        now.getMonth() + 1 < birthMonth ||
        (
            now.getMonth() + 1 === birthMonth &&
            now.getDate() < birthDay
        )
    ) {
        age--;
    }

    if (age > 100) {
        return {
            status: 400,
            body: {
                message: "Tuổi người được tiêm không được vượt quá 100 tuổi"
            }
        };
    }
    // VALIDATE GIỚI TÍNH
    if (!["Nam", "Nữ"].includes(gioi_tinh_nguoi_tiem)) {
        return {
            status: 400,
            body: { message: "Giới tính người được tiêm không hợp lệ" }
        };
    }

    // VALIDATE EMAIL
    if (
        email_nguoi_tiem &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_nguoi_tiem)
    ) {
        return {
            status: 400,
            body: { message: "Email không đúng định dạng" }
        };
    }

    // VALIDATE MỐI QUAN HỆ
    const allowedRelationships = [
        "Bản thân", "Con", "Anh", "Chị", "Em",
        "Cha", "Mẹ", "Vợ", "Chồng"
    ];

    if (!allowedRelationships.includes(moi_quan_he)) {
        return {
            status: 400,
            body: { message: "Mối quan hệ không hợp lệ" }
        };
    }

    // VALIDATE NGÀY TIÊM
    if (!isValidDateFormat(ngay_tiem)) {
        return {
            status: 400,
            body: { message: "Ngày tiêm không đúng định dạng YYYY-MM-DD" }
        };
    }

    const today = getTodayString();
    const maxBookingDate = addDays(today, 30);

    if (ngay_tiem <= today) {
        return {
            status: 400,
            body: {
                message: "Vui lòng đặt lịch tiêm trước ít nhất 1 ngày. Không thể đặt lịch trong ngày hiện tại."
            }
        };
    }

    if (ngay_tiem > maxBookingDate) {
        return {
            status: 400,
            body: { message: "Chỉ được đặt lịch trong vòng 30 ngày tới" }
        };
    }

    // VALIDATE GIỜ TIÊM
    if (!isValidTimeFormat(gio_tiem)) {
        return {
            status: 400,
            body: { message: "Giờ tiêm không đúng định dạng HH:mm" }
        };
    }

    if (!isWithinWorkingHours(gio_tiem)) {
        return {
            status: 400,
            body: {
                message: "Chỉ được đặt lịch từ 07:00–11:00 hoặc 13:00–16:30"
            }
        };
    }
    // VALIDATE GHI CHÚ
    if (ghi_chu !== null && ghi_chu !== ghi_chu.trim()) {
        return {
            status: 400,
            body: { message: "Ghi chú không được có khoảng trắng ở đầu hoặc cuối" }
        };
    }

    if (ghi_chu !== null && ghi_chu.length > 200) {
        return {
            status: 400,
            body: { message: "Ghi chú không được vượt quá 200 ký tự" }
        };
    }

    try {
        // KIỂM TRA TÀI KHOẢN
        const [userRows] = await db.query(
            `
        SELECT id, vai_tro, trang_thai
        FROM nguoi_dung
        WHERE id = ?
        LIMIT 1
      `,
            [nguoi_dung_id]
        );

        if (userRows.length === 0) {
            return {
                status: 404,
                body: { message: "Không tìm thấy người dùng" }
            };
        }

        const nguoiDung = userRows[0];

        if (nguoiDung.vai_tro !== "KHACH_HANG") {
            return {
                status: 403,
                body: { message: "Chức năng đặt lịch chỉ dành cho khách hàng" }
            };
        }

        if (nguoiDung.trang_thai !== "HOAT_DONG") {
            return {
                status: 403,
                body: { message: "Tài khoản hiện không hoạt động" }
            };
        }

        // KIỂM TRA CƠ SỞ
        const [coSoRows] = await db.query(
            `
        SELECT id, trang_thai
        FROM co_so_tiem
        WHERE id = ?
        LIMIT 1
      `,
            [co_so_id]
        );

        if (coSoRows.length === 0) {
            return {
                status: 404,
                body: { message: "Không tìm thấy cơ sở tiêm" }
            };
        }

        if (coSoRows[0].trang_thai !== "HOAT_DONG") {
            return {
                status: 400,
                body: { message: "Cơ sở tiêm hiện đang tạm dừng hoạt động" }
            };
        }

        // KIỂM TRA VACCINE TẠI CƠ SỞ
        const [vaccineRows] = await db.query(
            `
        SELECT v.id, v.ten_vaccine
        FROM vaccine v
        WHERE v.id = ?
          AND v.trang_thai <> 'NGUNG'
          AND EXISTS (
            SELECT 1
            FROM lo_vaccine lv
            WHERE lv.vaccine_id = v.id
              AND lv.co_so_id = ?
              AND lv.trang_thai = 'DANG_SU_DUNG'
              AND lv.so_luong_con > 0
              AND lv.han_su_dung >= CURDATE()
          )
        LIMIT 1
      `,
            [vaccine_id, co_so_id]
        );

        if (vaccineRows.length === 0) {
            return {
                status: 400,
                body: {
                    message: "Vaccine này hiện không có tại cơ sở đã chọn hoặc đã hết hàng"
                }
            };
        }

        // KIỂM TRA TRÙNG LỊCH
        const [duplicateRows] = await db.query(
            `
        SELECT id
        FROM lich_tiem
        WHERE nguoi_dung_id = ?
          AND ho_ten = ?
          AND moi_quan_he = ?
          AND DATE_FORMAT(ngay_sinh_nguoi_tiem, '%Y-%m-%d') = ?
          AND DATE_FORMAT(ngay_tiem, '%Y-%m-%d') = ?
          AND TIME_FORMAT(gio_tiem, '%H:%i') = ?
          AND trang_thai IN ('CHO_DUYET', 'DA_DUYET')
        LIMIT 1
      `,
            [
                nguoi_dung_id,
                ho_ten.trim(),
                moi_quan_he,
                ngay_sinh_nguoi_tiem,
                ngay_tiem,
                gio_tiem
            ]
        );

        if (duplicateRows.length > 0) {
            return {
                status: 409,
                body: {
                    message: "Người được tiêm này đã có lịch tiêm vào ngày và giờ đã chọn"
                }
            };
        }

        // TẠO LỊCH TIÊM
        await db.query(
            `
        INSERT INTO lich_tiem
        (
          nguoi_dung_id,
          ho_ten,
          vaccine_id,
          moi_quan_he,
          ngay_sinh_nguoi_tiem,
          gioi_tinh_nguoi_tiem,
          so_dien_thoai,
          email_nguoi_tiem,
          ngay_tiem,
          gio_tiem,
          trang_thai,
          ghi_chu,
          co_so_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                nguoi_dung_id,
                ho_ten.trim(),
                vaccine_id,
                moi_quan_he,
                ngay_sinh_nguoi_tiem,
                gioi_tinh_nguoi_tiem,
                so_dien_thoai.trim(),
                email_nguoi_tiem || null,
                ngay_tiem,
                gio_tiem,
                "CHO_DUYET",
                ghi_chu,
                co_so_id
            ]
        );

        return {
            status: 201,
            body: {
                message: "Đặt lịch thành công! Vui lòng chờ duyệt."
            }
        };

    } catch (err) {
        console.error("Lỗi đặt lịch tiêm:", err);

        return {
            status: 500,
            body: { message: "Lỗi server" }
        };
    }
}

//DUYỆT LỊCH TIÊM
async function approveSchedule(req) {
    return updateScheduleStatus({
        ...req,
        body: {
            ...req.body,
            trang_thai: "DA_DUYET"
        }
    });
}

// KHÁCH HÀNG HỦY LỊCH TIÊM
async function cancelSchedule(req) {
    const id = Number(req.params.id);

    const {
        currentUserId,
        currentRole
    } = getAuthInfo(req);

    const lyDo = String(
        req.body?.ly_do || ""
    ).trim();
    if (!lyDo || lyDo.length > 500) {
        return {
            status: 400,
            body: {
                message: "Lý do hủy phải có từ 1 đến 500 ký tự"
            }
        };
    }
    // KIỂM TRA ID
    if (!Number.isInteger(id) || id <= 0) {
        return {
            status: 400,
            body: {
                message: "Mã lịch tiêm không hợp lệ"
            }
        };
    }

    // KIỂM TRA ĐĂNG NHẬP
    if (
        !Number.isInteger(currentUserId) ||
        currentUserId <= 0
    ) {
        return {
            status: 401,
            body: {
                message: "Bạn chưa đăng nhập"
            }
        };
    }

    // CHỈ KHÁCH HÀNG ĐƯỢC TỰ HỦY
    if (currentRole !== "KHACH_HANG") {
        return {
            status: 403,
            body: {
                message:
                    "Chức năng này chỉ dành cho khách hàng"
            }
        };
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 4. LẤY LỊCH VÀ THÔNG TIN THANH TOÁN
        const [lichRows] = await conn.query(
            `
                SELECT
                    lt.id,
                    lt.nguoi_dung_id,

                    DATE_FORMAT(
                        lt.ngay_tiem,
                        '%Y-%m-%d'
                    ) AS ngay_tiem,

                    lt.trang_thai,

                    tt.id AS thanh_toan_id,
                    tt.so_tien,
                    tt.phuong_thuc,
                    tt.trang_thai AS trang_thai_thanh_toan

                FROM lich_tiem lt

                LEFT JOIN thanh_toan tt
                    ON tt.lich_tiem_id = lt.id

                WHERE lt.id = ?

                LIMIT 1
                FOR UPDATE
            `,
            [id]
        );

        if (lichRows.length === 0) {
            await conn.rollback();

            return {
                status: 404,
                body: {
                    message: "Không tìm thấy lịch tiêm"
                }
            };
        }

        const lich = lichRows[0];

        // CHỈ ĐƯỢC HỦY LỊCH CỦA MÌNH
        if (
            Number(lich.nguoi_dung_id) !==
            currentUserId
        ) {
            await conn.rollback();

            return {
                status: 403,
                body: {
                    message:
                        "Bạn không có quyền hủy lịch tiêm này"
                }
            };
        }

        // KHÔNG HỦY LỊCH ĐÃ HỦY
        if (lich.trang_thai === "DA_HUY") {
            await conn.rollback();

            return {
                status: 409,
                body: {
                    message:
                        "Lịch tiêm này đã được hủy"
                }
            };
        }

        // KHÔNG HỦY LỊCH ĐÃ TIÊM
        if (lich.trang_thai === "DA_TIEM") {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Lịch tiêm đã hoàn thành, không thể hủy"
                }
            };
        }

        // CHỈ TỰ HỦY TRƯỚC NGÀY TIÊM
        const today = getTodayString();

        if (lich.ngay_tiem <= today) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Chỉ được tự hủy lịch trước ngày tiêm. Vui lòng liên hệ cơ sở tiêm để được hỗ trợ."
                }
            };
        }

        // KIỂM TRA TRẠNG THÁI LỊCH
        if (
            ![
                "CHO_DUYET",
                "DA_DUYET"
            ].includes(lich.trang_thai)
        ) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Trạng thái lịch hiện tại không thể hủy"
                }
            };
        }

        // KIỂM TRA THANH TOÁN
        const daThanhToan =
            lich.thanh_toan_id &&
            lich.trang_thai_thanh_toan ===
            "DA_THANH_TOAN";

        // ĐÃ THANH TOÁN TIỀN MẶT
        // Khách phải liên hệ cơ sở để xử lý.
        if (
            daThanhToan &&
            lich.phuong_thuc === "TIEN_MAT"
        ) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Lịch này đã được thanh toán tiền mặt tại cơ sở. Vui lòng liên hệ nhân viên y tế để được hỗ trợ."
                }
            };
        }

        // CHƯA THANH TOÁN
        // Không có tiền cần hoàn nên hủy trực tiếp.
        if (!daThanhToan) {
            const [updateResult] =
                await conn.query(
                    `
                       UPDATE lich_tiem
                        SET trang_thai = 'DA_HUY',
                            ly_do_huy = ?
                        WHERE id = ?
                        AND nguoi_dung_id = ?
                        AND trang_thai IN ('CHO_DUYET', 'DA_DUYET')
                    `,
                    [

                        lyDo,
                        id,
                        currentUserId
                    ]
                );

            if (updateResult.affectedRows !== 1) {
                throw new Error(
                    "Không thể cập nhật trạng thái lịch tiêm"
                );
            }

            await conn.commit();

            return {
                status: 200,
                body: {
                    message: "Hủy lịch thành công",
                    loai_xu_ly: "HUY_TRUC_TIEP",
                    trang_thai: "DA_HUY"
                }
            };
        }

        // HOÀN TIỀN TRỰC TUYẾN CHỈ ÁP DỤNG VNPAY
        if (lich.phuong_thuc !== "VNPAY") {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Phương thức thanh toán này không hỗ trợ yêu cầu hoàn tiền trực tuyến."
                }
            };
        }

        // KIỂM TRA LÝ DO HỦY
        if (!lyDo) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Vui lòng nhập lý do yêu cầu hủy"
                }
            };
        }

        if (lyDo.length > 500) {
            await conn.rollback();

            return {
                status: 400,
                body: {
                    message:
                        "Lý do hủy không được vượt quá 500 ký tự"
                }
            };
        }

        // KIỂM TRA YÊU CẦU HOÀN TIỀN ĐÃ TỒN TẠI
        const [hoanTienRows] = await conn.query(
            `
                SELECT
                    id,
                    trang_thai
                FROM hoan_tien
                WHERE thanh_toan_id = ?
                LIMIT 1
                FOR UPDATE
            `,
            [lich.thanh_toan_id]
        );

        if (hoanTienRows.length > 0) {
            const yeuCau = hoanTienRows[0];

            await conn.rollback();

            if (yeuCau.trang_thai === "CHO_XU_LY") {
                return {
                    status: 409,
                    body: {
                        message:
                            "Yêu cầu hủy và hoàn tiền đang chờ ADMIN xử lý"
                    }
                };
            }

            if (yeuCau.trang_thai === "DA_HOAN_TIEN") {
                return {
                    status: 409,
                    body: {
                        message:
                            "Giao dịch này đã được hoàn tiền"
                    }
                };
            }

            return {
                status: 409,
                body: {
                    message:
                        "Yêu cầu hoàn tiền trước đó đã được ADMIN xử lý"
                }
            };
        }

        // TẠO YÊU CẦU HOÀN TIỀN
        // Chưa chuyển lịch thành DA_HUY.
        // ADMIN sẽ xử lý sau khi hoàn tiền.
        await conn.query(
            `
                INSERT INTO hoan_tien
                (
                    lich_tiem_id,
                    thanh_toan_id,
                    so_tien,
                    ly_do,
                    nguoi_yeu_cau_id,
                    trang_thai
                )
                VALUES (
                    ?, ?, ?, ?, ?, 'CHO_XU_LY'
                )
            `,
            [
                id,
                lich.thanh_toan_id,
                lich.so_tien,
                lyDo,
                currentUserId
            ]
        );

        await conn.commit();

        return {
            status: 201,
            body: {
                message:
                    "Đã gửi yêu cầu hủy và hoàn tiền. Vui lòng chờ ADMIN xử lý.",
                loai_xu_ly: "YEU_CAU_HOAN_TIEN",
                trang_thai_hoan_tien: "CHO_XU_LY"
            }
        };

    } catch (err) {
        await conn.rollback();

        console.error(
            "Lỗi khách hàng hủy lịch:",
            err
        );

        return {
            status: 500,
            body: {
                message:
                    "Lỗi server khi xử lý yêu cầu hủy lịch"
            }
        };

    } finally {
        conn.release();
    }
}

module.exports = {
    getAdminSchedules,
    getCustomerAppointmentHistory,
    updateScheduleStatus,
    confirmVaccination,
    getScheduleDetail,
    getUserSchedules,
    createSchedule,
    approveSchedule,
    cancelSchedule
};