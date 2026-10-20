const express = require("express");

const router = express.Router();

const nguoiDungController = require(
    "../controllers/nguoi-dung.controller"
);

const {
    requireAdmin
} = require(
    "../middlewares/nguoi-dung.middleware"
);

// ======================================================
// POST /api/users/register
// KHÁCH HÀNG TỰ ĐĂNG KÝ TÀI KHOẢN
// ======================================================

router.post(
    "/register",
    nguoiDungController.register
);

// ======================================================
// GET /api/users
// ADMIN XEM DANH SÁCH TÀI KHOẢN
// ======================================================

router.get(
    "/",
    requireAdmin,
    nguoiDungController.getAll
);

// ======================================================
// POST /api/users
// ADMIN THÊM TÀI KHOẢN NHÂN VIÊN Y TẾ
// ======================================================

router.post(
    "/",
    requireAdmin,
    nguoiDungController.create
);

// ======================================================
// PUT /api/users/:id
// ADMIN CẬP NHẬT TÀI KHOẢN NHÂN VIÊN Y TẾ
// ======================================================

router.put(
    "/:id",
    requireAdmin,
    nguoiDungController.update
);

// ======================================================
// PATCH /api/users/:id/reset-password
// ADMIN RESET MẬT KHẨU
// ======================================================

router.patch(
    "/:id/reset-password",
    requireAdmin,
    nguoiDungController.resetPassword
);

// ======================================================
// DELETE /api/users/:id
// ADMIN KHÓA TÀI KHOẢN
// ======================================================

router.delete(
    "/:id",
    requireAdmin,
    nguoiDungController.lock
);

// ======================================================
// PATCH /api/users/:id/unlock
// ADMIN MỞ KHÓA TÀI KHOẢN
// ======================================================

router.patch(
    "/:id/unlock",
    requireAdmin,
    nguoiDungController.unlock
);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;
