const jwt = require("jsonwebtoken");
const db = require("../config/db");

async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Bạn chưa đăng nhập hoặc thiếu token"
            });
        }

        const token = authHeader.slice(7).trim();

        if (!token) {
            return res.status(401).json({
                message: "Token không hợp lệ"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        const userId = Number(decoded.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                message: "Thông tin token không hợp lệ"
            });
        }

        // Kiểm tra tài khoản hiện tại trong MySQL
        const [rows] = await db.query(
            `SELECT id, vai_tro, trang_thai
             FROM nguoi_dung
             WHERE id = ?
             LIMIT 1`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Tài khoản không tồn tại"
            });
        }

        const user = rows[0];

        if (user.trang_thai !== "HOAT_DONG") {
            return res.status(403).json({
                message: "Tài khoản không được phép truy cập"
            });
        }

        // Danh tính và vai trò lấy từ Backend
        req.user = {
            id: user.id,
            vai_tro: user.vai_tro
        };

        next();

    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Phiên đăng nhập đã hết hạn"
            });
        }

        if (err.name === "JsonWebTokenError" ||
            err.name === "NotBeforeError") {
            return res.status(401).json({
                message: "Token không hợp lệ"
            });
        }

        console.error("Lỗi xác thực JWT:", err);

        return res.status(500).json({
            message: "Lỗi server khi xác thực"
        });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Bạn chưa được xác thực"
            });
        }

        if (!roles.includes(req.user.vai_tro)) {
            return res.status(403).json({
                message: "Bạn không có quyền truy cập"
            });
        }

        next();
    };
}

module.exports = {
    verifyToken,
    requireRole
};
