
// =====================================================
// PROFILE MIDDLEWARE
// Kiểm tra đăng nhập và phân quyền thông tin cá nhân
// =====================================================

// =====================================================
// 1. LẤY THÔNG TIN XÁC THỰC
// =====================================================

function getAuthInfo(req) {

    return {
        userId: Number(
            req.headers["x-user-id"]
        ),

        role: String(
            req.headers["x-role"] || ""
        ).trim()
    };
}


// =====================================================
// 2. KIỂM TRA ĐĂNG NHẬP
//
// Áp dụng cho:
// GET /api/profile/:userId
// PUT /api/profile/:userId
// =====================================================

function requireLogin(req, res, next) {

    const auth = getAuthInfo(req);

    // Kiểm tra ID người dùng
    if (
        !Number.isInteger(auth.userId) ||
        auth.userId <= 0
    ) {
        return res.status(401).json({
            message: "Bạn chưa đăng nhập"
        });
    }

    // Kiểm tra vai trò
    if (!auth.role) {
        return res.status(401).json({
            message:
                "Không xác định được quyền người dùng"
        });
    }

    // Lưu thông tin đăng nhập vào request
    req.auth = auth;

    return next();
}


// =====================================================
// 3. KIỂM TRA QUYỀN ADMIN
//
// Áp dụng cho:
// GET /api/profile
// =====================================================

function requireAdmin(req, res, next) {

    const auth = getAuthInfo(req);

    // Kiểm tra đăng nhập
    if (
        !Number.isInteger(auth.userId) ||
        auth.userId <= 0
    ) {
        return res.status(401).json({
            message: "Bạn chưa đăng nhập"
        });
    }

    // Kiểm tra quyền ADMIN
    if (auth.role !== "ADMIN") {
        return res.status(403).json({
            message: "Bạn không có quyền ADMIN"
        });
    }

    // Lưu thông tin ADMIN
    req.auth = auth;

    return next();
}


// =====================================================
// 4. KIỂM TRA QUYỀN TRUY CẬP HỒ SƠ
//
// Người dùng:
// - Chỉ được xem/cập nhật hồ sơ của chính mình.
//
// ADMIN:
// - Được xem/cập nhật hồ sơ người dùng khác.
//
// Áp dụng cho:
// GET /api/profile/:userId
// PUT /api/profile/:userId
// =====================================================

function requireSelfOrAdmin(req, res, next) {

    const auth =
        req.auth || getAuthInfo(req);

    const targetUserId = Number(
        req.params.userId
    );

    // =================================================
    // 4.1. KIỂM TRA ID HỒ SƠ
    // =================================================

    if (
        !Number.isInteger(targetUserId) ||
        targetUserId <= 0
    ) {
        return res.status(400).json({
            message:
                "ID người dùng không hợp lệ"
        });
    }

    // =================================================
    // 4.2. ADMIN ĐƯỢC PHÉP TRUY CẬP
    // =================================================

    if (auth.role === "ADMIN") {
        return next();
    }

    // =================================================
    // 4.3. NGƯỜI DÙNG CHỈ TRUY CẬP HỒ SƠ CỦA MÌNH
    // =================================================

    if (auth.userId !== targetUserId) {
        return res.status(403).json({
            message:
                "Bạn không có quyền truy cập thông tin của người dùng khác"
        });
    }

    return next();
}


// =====================================================
// EXPORT MIDDLEWARE
// =====================================================

module.exports = {
    getAuthInfo,
    requireLogin,
    requireAdmin,
    requireSelfOrAdmin
};
