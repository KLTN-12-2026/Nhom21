
const xacThucService = require("../services/xac-thuc.service");

// =====================================================
// 1. ĐĂNG NHẬP
// POST /api/auth/login
// =====================================================
async function login(req, res) {
    try {
        const result = await xacThucService.login(req);

        return res.status(result.status || 200).json(result.body);
    } catch (err) {
        console.error("Lỗi khi đăng nhập:", err);

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

// =====================================================
// 2. GỬI OTP ĐĂNG KÝ
// POST /api/auth/send-otp
// =====================================================
async function sendOtp(req, res) {
    try {
        const result = await xacThucService.sendOtp(req);

        return res.status(result.status || 200).json(result.body);
    } catch (err) {
        console.error("Lỗi gửi OTP:", err);

        return res.status(500).json({
            message: "Gửi OTP thất bại"
        });
    }
}

// =====================================================
// 3. ĐĂNG KÝ TÀI KHOẢN
// POST /api/auth/register
// =====================================================
async function register(req, res) {
    try {
        const result = await xacThucService.register(req);

        return res.status(result.status || 200).json(result.body);
    } catch (err) {
        console.error("Lỗi khi đăng ký:", err);

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

// =====================================================
// 4. GỬI OTP QUÊN MẬT KHẨU
// POST /api/auth/quen-mat-khau/gui-otp
// =====================================================
async function sendForgotPasswordOtp(req, res) {
    try {
        const result =
            await xacThucService.sendForgotPasswordOtp(req);

        return res.status(result.status || 200).json(result.body);
    } catch (err) {
        console.error("Lỗi gửi OTP Gmail:", err);

        return res.status(500).json({
            message: "Gửi OTP thất bại"
        });
    }
}

// =====================================================
// 5. ĐẶT LẠI MẬT KHẨU
// POST /api/auth/quen-mat-khau/dat-lai
// =====================================================
async function resetPassword(req, res) {
    try {
        const result = await xacThucService.resetPassword(req);

        return res.status(result.status || 200).json(result.body);
    } catch (err) {
        console.error("Lỗi đặt lại mật khẩu:", err);

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

// =====================================================
// 6. ĐỔI MẬT KHẨU
// PUT /api/auth/change-password
// =====================================================
async function changePassword(req, res) {
    try {
        const result = await xacThucService.changePassword(req);

        return res.status(result.status || 200).json(result.body);
    } catch (err) {
        console.error("Lỗi đổi mật khẩu:", err);

        return res.status(500).json({
            message: "Lỗi server khi đổi mật khẩu"
        });
    }
}

// =====================================================
// EXPORT CONTROLLER
// =====================================================
module.exports = {
    login,
    sendOtp,
    register,
    sendForgotPasswordOtp,
    resetPassword,
    changePassword
};
