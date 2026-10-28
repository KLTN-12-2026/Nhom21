require("dotenv").config();

const SALT_ROUNDS = 12;
const usernameRegex =
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d._]{6,30}$/;

// Mật khẩu:
const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])\S{8,32}$/;

// Số điện thoại:
const phoneRegex =
    /^0\d{9}$/;

// Họ và tên:

const fullNameRegex =
    /^[A-Za-zÀ-ỹ]+(?:\s[A-Za-zÀ-ỹ]+)*$/;

const crypto = require("node:crypto");

function taoOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}
// 4. LƯU OTP QUÊN MẬT KHẨU

const forgotOtpStore = {};


module.exports = {
    SALT_ROUNDS,
    usernameRegex,
    passwordRegex,
    phoneRegex,
    fullNameRegex,
    taoOtp,
    forgotOtpStore
};
