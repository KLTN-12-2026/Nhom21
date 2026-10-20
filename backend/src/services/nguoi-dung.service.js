
const db = require("../config/db");
const bcrypt = require("bcrypt");

const {
    SALT_ROUNDS
} = require(
    "../middlewares/nguoi-dung.middleware"
);

// ======================================================
// POST /api/users/register
// ĐĂNG KÝ TÀI KHOẢN KHÁCH HÀNG
// ======================================================

async function register(data) {
    let connection;

    try {
        const {
            ho_ten,
            ten_dang_nhap,
            mat_khau,
            so_dien_thoai
        } = data;

        // KIỂM TRA TÀI KHOẢN TRÙNG
        const [exist] = await db.query(
            `
                SELECT id
                FROM nguoi_dung
                WHERE ten_dang_nhap = ?
                LIMIT 1
            `,
            [ten_dang_nhap]
        );

        if (exist.length > 0) {
            return {
                ok: false,
                status: 400,
                message:
                    "Tài khoản đã tồn tại, vui lòng chọn tên khác"
            };
        }

        const vai_tro = "KHACH_HANG";

        const mat_khau_ma_hoa =
            await bcrypt.hash(mat_khau, SALT_ROUNDS);

        connection = await db.getConnection();

        await connection.beginTransaction();

        // TẠO TÀI KHOẢN
        const [result] = await connection.query(
            `
                INSERT INTO nguoi_dung
                (
                    ten_dang_nhap,
                    mat_khau,
                    vai_tro
                )
                VALUES (?, ?, ?)
            `,
            [
                ten_dang_nhap,
                mat_khau_ma_hoa,
                vai_tro
            ]
        );

        const nguoi_dung_id = result.insertId;

        // TẠO THÔNG TIN CÁ NHÂN
        await connection.query(
            `
                INSERT INTO thong_tin_ca_nhan
                (
                    nguoi_dung_id,
                    ho_ten,
                    so_dien_thoai
                )
                VALUES (?, ?, ?)
            `,
            [
                nguoi_dung_id,
                ho_ten,
                so_dien_thoai
            ]
        );

        await connection.commit();

        return {
            ok: true,
            nguoi_dung_id
        };

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }

        throw err;

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// ======================================================
// GET /api/users
// ADMIN XEM DANH SÁCH TÀI KHOẢN
// ======================================================

async function getAll(includeDeleted) {
    const sql = includeDeleted
        ? `
            SELECT
                nd.id,
                nd.ten_dang_nhap,
                nd.vai_tro,
                nd.trang_thai,
                nv.co_so_id,
                cs.ten_co_so
            FROM nguoi_dung nd
            LEFT JOIN nhan_vien_y_te nv
                ON nv.nguoi_dung_id = nd.id
            LEFT JOIN co_so_tiem cs
                ON cs.id = nv.co_so_id
            ORDER BY nd.id DESC
        `
        : `
            SELECT
                nd.id,
                nd.ten_dang_nhap,
                nd.vai_tro,
                nd.trang_thai,
                nv.co_so_id,
                cs.ten_co_so
            FROM nguoi_dung nd
            LEFT JOIN nhan_vien_y_te nv
                ON nv.nguoi_dung_id = nd.id
            LEFT JOIN co_so_tiem cs
                ON cs.id = nv.co_so_id
            WHERE nd.trang_thai = 'HOAT_DONG'
            ORDER BY nd.id DESC
        `;

    const [rows] = await db.query(sql);

    return rows;
}

// ======================================================
// KIỂM TRA TÀI KHOẢN THEO ID
// ======================================================

async function getUserById(id) {
    const [rows] = await db.query(
        `
            SELECT
                id,
                ten_dang_nhap,
                vai_tro,
                trang_thai
            FROM nguoi_dung
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    );

    return rows;
}

// ======================================================
// KIỂM TRA VAI TRÒ TÀI KHOẢN
// ======================================================

async function getUserRoleById(id) {
    const [rows] = await db.query(
        `
            SELECT
                vai_tro
            FROM nguoi_dung
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    );

    return rows;
}

// ======================================================
// KIỂM TRA TÊN ĐĂNG NHẬP TRÙNG
// DÙNG CHO CẬP NHẬT TÀI KHOẢN
// ======================================================

async function checkDuplicateUsername(
    ten_dang_nhap,
    id
) {
    const [rows] = await db.query(
        `
            SELECT id
            FROM nguoi_dung
            WHERE ten_dang_nhap = ?
                AND id <> ?
            LIMIT 1
        `,
        [
            ten_dang_nhap,
            id
        ]
    );

    return rows;
}

// ======================================================
// POST /api/users
// ADMIN THÊM NHÂN VIÊN Y TẾ
// ======================================================

async function create(data) {
    let connection;

    try {
        const {
            ten_dang_nhap,
            mat_khau,
            vai_tro,
            coSoId
        } = data;

        // KIỂM TRA CƠ SỞ
        const [coSoRows] = await db.query(
            `
                SELECT
                    id,
                    ten_co_so,
                    trang_thai
                FROM co_so_tiem
                WHERE id = ?
                LIMIT 1
            `,
            [coSoId]
        );

        if (coSoRows.length === 0) {
            return {
                ok: false,
                status: 404,
                message: "Không tìm thấy cơ sở tiêm"
            };
        }

        if (
            coSoRows[0].trang_thai !== "HOAT_DONG"
        ) {
            return {
                ok: false,
                status: 400,
                message:
                    "Không thể tạo nhân viên cho cơ sở đang tạm dừng"
            };
        }

        // KIỂM TRA TÊN ĐĂNG NHẬP TRÙNG
        const [existRows] = await db.query(
            `
                SELECT id
                FROM nguoi_dung
                WHERE ten_dang_nhap = ?
                LIMIT 1
            `,
            [ten_dang_nhap]
        );

        if (existRows.length > 0) {
            return {
                ok: false,
                status: 409,
                message: "Tên đăng nhập đã tồn tại"
            };
        }

        // MÃ HÓA MẬT KHẨU
        const mat_khau_ma_hoa =
            await bcrypt.hash(mat_khau, SALT_ROUNDS);

        connection = await db.getConnection();

        await connection.beginTransaction();

        // THÊM TÀI KHOẢN
        const [result] = await connection.query(
            `
                INSERT INTO nguoi_dung
                (
                    ten_dang_nhap,
                    mat_khau,
                    vai_tro,
                    trang_thai
                )
                VALUES (?, ?, ?, 'HOAT_DONG')
            `,
            [
                ten_dang_nhap,
                mat_khau_ma_hoa,
                vai_tro
            ]
        );

        const nguoi_dung_id = result.insertId;

        // GẮN NHÂN VIÊN VỚI CƠ SỞ
        await connection.query(
            `
                INSERT INTO nhan_vien_y_te
                (
                    nguoi_dung_id,
                    co_so_id
                )
                VALUES (?, ?)
            `,
            [
                nguoi_dung_id,
                coSoId
            ]
        );

        await connection.commit();

        return {
            ok: true,
            id: nguoi_dung_id,
            ten_co_so: coSoRows[0].ten_co_so
        };

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }

        throw err;

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// ======================================================
// PUT /api/users/:id
// ADMIN CẬP NHẬT NHÂN VIÊN Y TẾ
// ======================================================

async function update(
    id,
    ten_dang_nhap,
    coSoId
) {
    let connection;

    try {
        // KIỂM TRA CƠ SỞ
        const [coSoRows] = await db.query(
            `
                SELECT
                    id,
                    ten_co_so,
                    trang_thai
                FROM co_so_tiem
                WHERE id = ?
                LIMIT 1
            `,
            [coSoId]
        );

        if (coSoRows.length === 0) {
            return {
                ok: false,
                status: 404,
                message: "Không tìm thấy cơ sở tiêm"
            };
        }

        if (
            coSoRows[0].trang_thai !== "HOAT_DONG"
        ) {
            return {
                ok: false,
                status: 400,
                message:
                    "Không thể chuyển nhân viên vào cơ sở đang tạm dừng"
            };
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        // CẬP NHẬT TÊN ĐĂNG NHẬP
        await connection.query(
            `
                UPDATE nguoi_dung
                SET ten_dang_nhap = ?
                WHERE id = ?
            `,
            [
                ten_dang_nhap,
                id
            ]
        );

        // KIỂM TRA QUAN HỆ NHÂN VIÊN
        const [employeeRows] =
            await connection.query(
                `
                    SELECT
                        id,
                        co_so_id
                    FROM nhan_vien_y_te
                    WHERE nguoi_dung_id = ?
                    LIMIT 1
                `,
                [id]
            );

        if (employeeRows.length > 0) {
            // NHÂN VIÊN ĐÃ CÓ CƠ SỞ
            await connection.query(
                `
                    UPDATE nhan_vien_y_te
                    SET co_so_id = ?
                    WHERE nguoi_dung_id = ?
                `,
                [
                    coSoId,
                    id
                ]
            );
        } else {
            // NHÂN VIÊN CHƯA CÓ QUAN HỆ CƠ SỞ
            await connection.query(
                `
                    INSERT INTO nhan_vien_y_te
                    (
                        nguoi_dung_id,
                        co_so_id
                    )
                    VALUES (?, ?)
                `,
                [
                    id,
                    coSoId
                ]
            );
        }

        await connection.commit();

        return {
            ok: true,
            ten_co_so: coSoRows[0].ten_co_so
        };

    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Lỗi rollback:",
                    rollbackError
                );
            }
        }

        throw err;

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// ======================================================
// PATCH /api/users/:id/reset-password
// ADMIN RESET MẬT KHẨU
// ======================================================

async function resetPassword(id, mat_khau) {
    const mat_khau_ma_hoa =
        await bcrypt.hash(
            mat_khau,
            SALT_ROUNDS
        );

    await db.query(
        `
            UPDATE nguoi_dung
            SET mat_khau = ?
            WHERE id = ?
        `,
        [
            mat_khau_ma_hoa,
            id
        ]
    );
}

// ======================================================
// DELETE /api/users/:id
// ADMIN KHÓA TÀI KHOẢN
// ======================================================

async function lock(id) {
    const [result] = await db.query(
        `
            UPDATE nguoi_dung
            SET trang_thai = 'BI_KHOA'
            WHERE id = ?
                AND trang_thai = 'HOAT_DONG'
        `,
        [id]
    );

    return result;
}

// ======================================================
// PATCH /api/users/:id/unlock
// ADMIN MỞ KHÓA TÀI KHOẢN
// ======================================================

async function unlock(id) {
    const [result] = await db.query(
        `
            UPDATE nguoi_dung
            SET trang_thai = 'HOAT_DONG'
            WHERE id = ?
                AND trang_thai = 'BI_KHOA'
        `,
        [id]
    );

    return result;
}

// ======================================================
// EXPORT SERVICE
// ======================================================

module.exports = {
    register,
    getAll,
    getUserById,
    getUserRoleById,
    checkDuplicateUsername,
    create,
    update,
    resetPassword,
    lock,
    unlock
};
