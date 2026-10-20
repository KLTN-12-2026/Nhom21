
require("dotenv").config();

// =====================================================
// 1. CẤU HÌNH BCRYPT
// =====================================================

const SALT_ROUNDS = 12;

// =====================================================
// 2. REGEX DÙNG CHUNG
// =====================================================

// Tên đăng nhập:
// 6-30 ký tự, có ít nhất 1 chữ và 1 số.
// Cho phép chữ, số, dấu chấm và dấu gạch dưới.
const usernameRegex =
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d._]{6,30}$/;

// Mật khẩu:
// 8-32 ký tự, có chữ thường, chữ hoa,
// chữ số và ký tự đặc biệt.
// Không chứa khoảng trắng.
const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])\S{8,32}$/;

// Số điện thoại:
// Gồm 10 chữ số, bắt đầu bằng số 0.
const phoneRegex =
    /^0\d{9}$/;

// Họ và tên:
// Chỉ gồm chữ cái và khoảng trắng giữa các từ.
const fullNameRegex =
    /^[A-Za-zÀ-ỹ]+(?:\s[A-Za-zÀ-ỹ]+)*$/;

// =====================================================
// 3. TẠO OTP QUÊN MẬT KHẨU
// =====================================================

function taoOtp() {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
}

// =====================================================
// 4. LƯU OTP QUÊN MẬT KHẨU
// =====================================================

// Giữ nguyên cơ chế lưu OTP trong bộ nhớ
// của file xac-thuc.routes.js ban đầu.
//
// Dữ liệu sẽ mất khi Backend khởi động lại.

const forgotOtpStore = {};

// =====================================================
// 5. EXPORT
// =====================================================

module.exports = {
    SALT_ROUNDS,
    usernameRegex,
    passwordRegex,
    phoneRegex,
    fullNameRegex,
    taoOtp,
    forgotOtpStore
};
