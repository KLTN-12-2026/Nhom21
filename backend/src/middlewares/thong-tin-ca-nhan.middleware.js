function getAuthInfo(req) {

    return {
        userId: Number(
            req.user?.id
        ),

        role: String(
            req.user?.vai_tro || ""
        ).trim()
    };
}

function requireLogin(req, res, next) {

    const auth = getAuthInfo(req);

    if (
        !Number.isInteger(auth.userId) ||
        auth.userId <= 0
    ) {
        return res.status(401).json({
            message: "Bạn chưa đăng nhập"
        });
    }

    if (!auth.role) {
        return res.status(401).json({
            message:
                "Không xác định được quyền người dùng"
        });
    }

    req.auth = auth;

    return next();
}

function requireAdmin(req, res, next) {

    const auth = getAuthInfo(req);

    if (
        !Number.isInteger(auth.userId) ||
        auth.userId <= 0
    ) {
        return res.status(401).json({
            message: "Bạn chưa đăng nhập"
        });
    }
    if (auth.role !== "ADMIN") {
        return res.status(403).json({
            message: "Bạn không có quyền ADMIN"
        });
    }

    req.auth = auth;

    return next();
}

function requireSelfOrAdmin(req, res, next) {

    const auth =
        req.auth || getAuthInfo(req);

    const targetUserId = Number(
        req.params.userId
    );

    if (
        !Number.isInteger(targetUserId) ||
        targetUserId <= 0
    ) {
        return res.status(400).json({
            message:
                "ID người dùng không hợp lệ"
        });
    }

    if (auth.role === "ADMIN") {
        return next();
    }

    if (auth.userId !== targetUserId) {
        return res.status(403).json({
            message:
                "Bạn không có quyền truy cập thông tin của người dùng khác"
        });
    }

    return next();
}

module.exports = {
    getAuthInfo,
    requireLogin,
    requireAdmin,
    requireSelfOrAdmin
};
