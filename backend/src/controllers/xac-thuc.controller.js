const xacThucService = require("../services/xac-thuc.service");

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

async function sendRegisterEmailOtp(req, res) {
    try {
        const result =
            await xacThucService.sendRegisterEmailOtp(req);

        return res
            .status(result.status || 200)
            .json(result.body);

    } catch (err) {
        console.error("Lỗi gửi OTP đăng ký Gmail:", err);

        return res.status(500).json({
            message: "Không thể gửi OTP đăng ký Gmail"
        });
    }
}

async function sendForgotPasswordPhoneOtp(req, res) {
    try {
        const result =
            await xacThucService.sendForgotPasswordPhoneOtp(req);

        return res.status(result.status || 200).json(result.body);
    } catch (err) {
        console.error("Lỗi gửi OTP quên mật khẩu SĐT:", err);

        return res.status(500).json({
            message: "Gửi OTP thất bại"
        });
    }
}

async function resetPasswordByPhone(req, res) {
    try {
        const result =
            await xacThucService.resetPasswordByPhone(req);

        return res.status(result.status || 200).json(result.body);
    } catch (err) {
        console.error("Lỗi đặt lại mật khẩu bằng SĐT:", err);

        return res.status(500).json({
            message: "Lỗi server khi đặt lại mật khẩu"
        });
    }
}

module.exports = {
    login,
    sendOtp,
    register,
    sendForgotPasswordOtp,
    resetPassword,
    changePassword,
    sendRegisterEmailOtp,
    sendForgotPasswordPhoneOtp,
    resetPasswordByPhone
};