
const db = require("../config/db");

// =====================================================
// 1. LẤY THÔNG TIN XÁC THỰC
//
// Giữ nguyên cách lấy thông tin từ Route gốc.
// =====================================================

function getAuthInfo(req) {

    const userId = Number(
        req.headers["x-user-id"]
    );

    const role = String(
        req.headers["x-role"] || ""
    ).trim();

    return {
        userId,
        role
    };
}


// =====================================================
// 2. KIỂM TRA TÀI KHOẢN HIỆN TẠI
//
// Áp dụng cho:
// GET /api/dashboard/overview
//
// Kiểm tra:
// - ID người dùng hợp lệ.
// - Tài khoản tồn tại.
// - Tài khoản đang hoạt động.
// - Vai trò khớp với Database.
// =====================================================

async function requireCurrentUser(req, res, next) {

    try {

        const { userId, role } = getAuthInfo(req);

        // =============================================
        // 2.1. KIỂM TRA ID NGƯỜI DÙNG
        // =============================================

        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {
            return res.status(401).json({
                message: "Bạn chưa đăng nhập"
            });
        }

        // =============================================
        // 2.2. TÌM TÀI KHOẢN TRONG DATABASE
        // =============================================

        const [rows] = await db.query(
            `
            SELECT
                id,
                vai_tro,
                trang_thai

            FROM nguoi_dung

            WHERE id = ?

            LIMIT 1
            `,
            [userId]
        );

        // =============================================
        // 2.3. TÀI KHOẢN KHÔNG TỒN TẠI
        // =============================================

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Tài khoản không tồn tại"
            });
        }

        const user = rows[0];

        // =============================================
        // 2.4. KIỂM TRA TRẠNG THÁI TÀI KHOẢN
        // =============================================

        if (user.trang_thai !== "HOAT_DONG") {
            return res.status(403).json({
                message: "Tài khoản đã bị khóa"
            });
        }

        // =============================================
        // 2.5. KIỂM TRA VAI TRÒ
        // =============================================

        if (user.vai_tro !== role) {
            return res.status(403).json({
                message:
                    "Vai trò người dùng không hợp lệ"
            });
        }

        // =============================================
        // 2.6. LƯU THÔNG TIN CHO CONTROLLER
        // =============================================

        req.currentUser = user;

        return next();

    } catch (error) {

        // Chuyển lỗi sang Controller xử lý tập trung.
        return next(error);
    }
}


// =====================================================
// EXPORT MIDDLEWARE
// =====================================================

module.exports = {
    getAuthInfo,
    requireCurrentUser
};
