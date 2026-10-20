const express = require("express");
const router = express.Router();

const xacThucController = require("../controllers/xac-thuc.controller");

// =====================================================
// 1. ĐĂNG NHẬP
// POST /api/auth/login
// =====================================================
router.post(
    "/login",
    xacThucController.login
);

// =====================================================
// 2. GỬI OTP ĐĂNG KÝ
// POST /api/auth/send-otp
// =====================================================
router.post(
    "/send-otp",
    xacThucController.sendOtp
);

// =====================================================
// 3. ĐĂNG KÝ TÀI KHOẢN
// POST /api/auth/register
// =====================================================
router.post(
    "/register",
    xacThucController.register
);

// =====================================================
// 4. GỬI OTP QUÊN MẬT KHẨU
// POST /api/auth/quen-mat-khau/gui-otp
// =====================================================
router.post(
    "/quen-mat-khau/gui-otp",
    xacThucController.sendForgotPasswordOtp
);

// =====================================================
// 5. ĐẶT LẠI MẬT KHẨU
// POST /api/auth/quen-mat-khau/dat-lai
// =====================================================
router.post(
    "/quen-mat-khau/dat-lai",
    xacThucController.resetPassword
);

// =====================================================
// 6. ĐỔI MẬT KHẨU
// PUT /api/auth/change-password
// =====================================================
router.put(
    "/change-password",
    xacThucController.changePassword
);

module.exports = router;
