
const db = require("../config/db");
const axios = require("axios");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

require("dotenv").config();

const {
    SALT_ROUNDS,
    usernameRegex,
    passwordRegex,
    phoneRegex,
    fullNameRegex,
    taoOtp,
    forgotOtpStore
} = require("../middlewares/xac-thuc.middleware");

// Hàm trả kết quả cho Controller
function response(status, body) {
    return { status, body };
}

// Cấu hình gửi Gmail
const mailer = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// =====================================================
// 1. ĐĂNG NHẬP
// POST /api/auth/login
// =====================================================

async function login(req) {
    try {
        let { ten_dang_nhap, mat_khau } = req.body;

        ten_dang_nhap = (ten_dang_nhap || "").toString();
        mat_khau = (mat_khau || "").toString();

        // Kiểm tra tài khoản
        if (!ten_dang_nhap.trim()) {
            return response(400, {
                field: "ten_dang_nhap",
                message: "Vui lòng nhập tài khoản"
            });
        }

        if (ten_dang_nhap !== ten_dang_nhap.trim()) {
            return response(400, {
                field: "ten_dang_nhap",
                message: "Tài khoản không được có khoảng trắng ở đầu hoặc cuối"
            });
        }

        if (/\s/.test(ten_dang_nhap)) {
            return response(400, {
                field: "ten_dang_nhap",
                message: "Tài khoản không được chứa khoảng trắng"
            });
        }

        if (!usernameRegex.test(ten_dang_nhap)) {
            return response(400, {
                field: "ten_dang_nhap",
                message: "Tài khoản phải từ 6-30 ký tự, chỉ gồm chữ, số, dấu chấm hoặc dấu gạch dưới, và phải có ít nhất 1 chữ và 1 số"
            });
        }

        // Kiểm tra mật khẩu
        if (!mat_khau.trim()) {
            return response(400, {
                field: "mat_khau",
                message: "Vui lòng nhập mật khẩu"
            });
        }

        if (mat_khau !== mat_khau.trim()) {
            return response(400, {
                field: "mat_khau",
                message: "Mật khẩu không được có khoảng trắng ở đầu hoặc cuối"
            });
        }

        if (/\s/.test(mat_khau)) {
            return response(400, {
                field: "mat_khau",
                message: "Mật khẩu không được chứa khoảng trắng"
            });
        }

        if (!passwordRegex.test(mat_khau)) {
            return response(400, {
                field: "mat_khau",
                message: "Mật khẩu phải từ 8-32 ký tự, không chứa khoảng trắng, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)"
            });
        }

        // Tìm tài khoản
        const [rows] = await db.query(
            `
                SELECT
                    nd.id,
                    nd.ten_dang_nhap,
                    nd.mat_khau,
                    nd.vai_tro,
                    nd.trang_thai,
                    ttcn.ho_ten,
                    ttcn.so_dien_thoai,
                    ttcn.ngay_sinh,
                    ttcn.gioi_tinh,
                    ttcn.dia_chi
                FROM nguoi_dung nd
                LEFT JOIN thong_tin_ca_nhan ttcn
                    ON nd.id = ttcn.nguoi_dung_id
                WHERE nd.ten_dang_nhap = ?
                LIMIT 1
            `,
            [ten_dang_nhap]
        );

        if (rows.length === 0) {
            return response(401, {
                message: "Sai tài khoản hoặc mật khẩu"
            });
        }

        const user = rows[0];

        // Kiểm tra tài khoản bị khóa
        if (user.trang_thai === "BI_KHOA") {
            return response(403, {
                message: "Tài khoản đã bị khóa. Vui lòng liên hệ admin."
            });
        }

        // So sánh mật khẩu bcrypt
        const matKhauHopLe = await bcrypt.compare(
            mat_khau,
            user.mat_khau
        );

        if (!matKhauHopLe) {
            return response(401, {
                message: "Sai tài khoản hoặc mật khẩu"
            });
        }

        return response(200, {
            message: "Đăng nhập thành công",
            user: {
                id: user.id,
                ten_dang_nhap: user.ten_dang_nhap,
                vai_tro: user.vai_tro,
                ho_ten: user.ho_ten || "",
                so_dien_thoai: user.so_dien_thoai || "",
                ngay_sinh: user.ngay_sinh || null,
                gioi_tinh: user.gioi_tinh || "",
                dia_chi: user.dia_chi || ""
            }
        });

    } catch (err) {
        console.error("Lỗi khi đăng nhập:", err);
        return response(500, {
            message: "Lỗi server"
        });
    }
}

// =====================================================
// 2. GỬI OTP ĐĂNG KÝ
// POST /api/auth/send-otp
// =====================================================

async function sendOtp(req) {
    let { so_dien_thoai } = req.body;

    so_dien_thoai = (so_dien_thoai || "")
        .toString()
        .trim();

    // Kiểm tra số điện thoại
    if (!so_dien_thoai) {
        return response(400, {
            field: "so_dien_thoai",
            message: "Thiếu số điện thoại"
        });
    }

    if (!phoneRegex.test(so_dien_thoai)) {
        return response(400, {
            field: "so_dien_thoai",
            message: "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0"
        });
    }

    // Chế độ OTP test
    if (process.env.OTP_REQUIRED !== "true") {
        console.log("🧪 Chế độ test OTP");
        console.log("📱 Số điện thoại:", so_dien_thoai);
        console.log("🔑 OTP test: 123456");

        return response(200, {
            message: "Gửi OTP thành công (OTP test: 123456)",
            otp_test: "123456"
        });
    }

    try {
        // Gọi FastOTP
        const otpResponse = await axios.post(
            "https://otp-gateway.viethomes-jp.workers.dev/v1/partner/otp/request",
            {
                phone: so_dien_thoai
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": process.env.FASTOTP_API_KEY
                }
            }
        );

        const requestId = otpResponse.data?.request_id;

        if (!requestId) {
            console.error(
                "FastOTP không trả về request_id:",
                otpResponse.data
            );

            return response(502, {
                message: "Không nhận được mã yêu cầu OTP từ hệ thống OTP"
            });
        }

        // Lưu yêu cầu OTP
        await db.query(
            `
                INSERT INTO yeu_cau_otp
                (
                    so_dien_thoai,
                    ma_yeu_cau
                )
                VALUES (?, ?)
            `,
            [so_dien_thoai, requestId]
        );

        return response(200, {
            message: "Đã gửi OTP thành công",
            ma_yeu_cau: requestId
        });

    } catch (err) {
        console.error(
            "Lỗi gửi OTP:",
            err.response?.data || err.message
        );

        return response(500, {
            message: "Gửi OTP thất bại"
        });
    }
}

// =====================================================
// 3. ĐĂNG KÝ TÀI KHOẢN
// POST /api/auth/register
// =====================================================

async function register(req) {
    try {
        let {
            ho_ten,
            ten_dang_nhap,
            mat_khau,
            xac_nhan_mat_khau,
            so_dien_thoai,
            otp
        } = req.body;

        ho_ten = (ho_ten || "").toString();
        ten_dang_nhap = (ten_dang_nhap || "").toString();
        mat_khau = (mat_khau || "").toString();
        xac_nhan_mat_khau = (xac_nhan_mat_khau || "").toString();
        so_dien_thoai = (so_dien_thoai || "").toString();
        otp = (otp || "").toString();

        // ===============================
        // KIỂM TRA HỌ TÊN
        // ===============================

        if (!ho_ten.trim()) {
            return response(400, {
                field: "ho_ten",
                message: "Vui lòng nhập họ và tên"
            });
        }

        if (ho_ten !== ho_ten.trim()) {
            return response(400, {
                field: "ho_ten",
                message: "Họ và tên không được có khoảng trắng ở đầu hoặc cuối"
            });
        }

        if (ho_ten.length < 2 || ho_ten.length > 50) {
            return response(400, {
                field: "ho_ten",
                message: "Họ và tên phải từ 2 đến 50 ký tự"
            });
        }

        if (!fullNameRegex.test(ho_ten.trim())) {
            return response(400, {
                field: "ho_ten",
                message: "Họ và tên không được chứa số hoặc ký tự đặc biệt"
            });
        }

        // ===============================
        // KIỂM TRA TÊN ĐĂNG NHẬP
        // ===============================

        if (!ten_dang_nhap.trim()) {
            return response(400, {
                field: "ten_dang_nhap",
                message: "Vui lòng nhập tài khoản"
            });
        }

        if (ten_dang_nhap !== ten_dang_nhap.trim()) {
            return response(400, {
                field: "ten_dang_nhap",
                message: "Tài khoản không được có khoảng trắng ở đầu hoặc cuối"
            });
        }

        if (/\s/.test(ten_dang_nhap)) {
            return response(400, {
                field: "ten_dang_nhap",
                message: "Tài khoản không được chứa khoảng trắng"
            });
        }

        if (!usernameRegex.test(ten_dang_nhap)) {
            return response(400, {
                field: "ten_dang_nhap",
                message: "Tài khoản phải từ 6-30 ký tự, chỉ gồm chữ, số, dấu chấm hoặc dấu gạch dưới, và phải có ít nhất 1 chữ và 1 số"
            });
        }

        // ===============================
        // KIỂM TRA MẬT KHẨU
        // ===============================

        if (!mat_khau.trim()) {
            return response(400, {
                field: "mat_khau",
                message: "Vui lòng nhập mật khẩu"
            });
        }

        if (mat_khau !== mat_khau.trim()) {
            return response(400, {
                field: "mat_khau",
                message: "Mật khẩu không được có khoảng trắng ở đầu hoặc cuối"
            });
        }

        if (/\s/.test(mat_khau)) {
            return response(400, {
                field: "mat_khau",
                message: "Mật khẩu không được chứa khoảng trắng"
            });
        }

        if (!passwordRegex.test(mat_khau)) {
            return response(400, {
                field: "mat_khau",
                message: "Mật khẩu phải từ 8-32 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)"
            });
        }

        // ===============================
        // XÁC NHẬN MẬT KHẨU
        // ===============================

        if (!xac_nhan_mat_khau.trim()) {
            return response(400, {
                field: "xac_nhan_mat_khau",
                message: "Vui lòng nhập lại mật khẩu"
            });
        }

        if (mat_khau !== xac_nhan_mat_khau) {
            return response(400, {
                field: "xac_nhan_mat_khau",
                message: "Mật khẩu nhập lại không khớp"
            });
        }

        // ===============================
        // SỐ ĐIỆN THOẠI
        // ===============================

        if (!so_dien_thoai.trim()) {
            return response(400, {
                field: "so_dien_thoai",
                message: "Vui lòng nhập số điện thoại"
            });
        }

        if (!phoneRegex.test(so_dien_thoai)) {
            return response(400, {
                field: "so_dien_thoai",
                message: "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0"
            });
        }

        // ===============================
        // OTP
        // ===============================

        if (!otp.trim()) {
            return response(400, {
                field: "otp",
                message: "Vui lòng nhập mã OTP"
            });
        }

        if (!/^\d{4,8}$/.test(otp)) {
            return response(400, {
                field: "otp",
                message: "Mã OTP không hợp lệ"
            });
        }

        // ===============================
        // KIỂM TRA TRÙNG TÀI KHOẢN
        // ===============================

        const [usernameRows] = await db.query(
            `
                SELECT id
                FROM nguoi_dung
                WHERE ten_dang_nhap = ?
                LIMIT 1
            `,
            [ten_dang_nhap]
        );

        if (usernameRows.length > 0) {
            return response(409, {
                field: "ten_dang_nhap",
                message: "Tài khoản đã tồn tại"
            });
        }

        // ===============================
        // KIỂM TRA TRÙNG SỐ ĐIỆN THOẠI
        // ===============================

        const [phoneRows] = await db.query(
            `
                SELECT id
                FROM thong_tin_ca_nhan
                WHERE so_dien_thoai = ?
                LIMIT 1
            `,
            [so_dien_thoai]
        );

        if (phoneRows.length > 0) {
            return response(409, {
                field: "so_dien_thoai",
                message: "Số điện thoại đã được sử dụng"
            });
        }

        // ===============================
        // XÁC THỰC OTP
        // ===============================

        const isOtpRequired =
            process.env.OTP_REQUIRED === "true";

        if (isOtpRequired) {
            const [otpRows] = await db.query(
                `
                    SELECT
                        id,
                        so_dien_thoai,
                        ma_yeu_cau,
                        ngay_tao
                    FROM yeu_cau_otp
                    WHERE so_dien_thoai = ?
                    ORDER BY id DESC
                    LIMIT 1
                `,
                [so_dien_thoai]
            );

            if (otpRows.length === 0) {
                return response(400, {
                    field: "otp",
                    message: "Bạn chưa gửi OTP cho số điện thoại này"
                });
            }

            const verifyResponse = await axios.post(
                "https://otp-gateway.viethomes-jp.workers.dev/v1/partner/otp/verify",
                {
                    request_id: otpRows[0].ma_yeu_cau,
                    otp: otp
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-Key": process.env.FASTOTP_API_KEY
                    }
                }
            );

            if (verifyResponse.data?.success !== true) {
                return response(400, {
                    field: "otp",
                    message: "OTP không đúng hoặc đã hết hạn"
                });
            }
        }

        // ===============================
        // HASH MẬT KHẨU
        // ===============================

        const matKhauDaHash = await bcrypt.hash(
            mat_khau,
            SALT_ROUNDS
        );

        // ===============================
        // TẠO TÀI KHOẢN
        // ===============================

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [userResult] = await connection.query(
                `
                    INSERT INTO nguoi_dung
                    (
                        ten_dang_nhap,
                        mat_khau,
                        vai_tro,
                        trang_thai
                    )
                    VALUES (?, ?, ?, ?)
                `,
                [
                    ten_dang_nhap,
                    matKhauDaHash,
                    "KHACH_HANG",
                    "HOAT_DONG"
                ]
            );

            const nguoiDungId = userResult.insertId;

            await connection.query(
                `
                    INSERT INTO thong_tin_ca_nhan
                    (
                        nguoi_dung_id,
                        ho_ten,
                        so_dien_thoai
                    )
                    VALUES (?, ?, ?)
                `,
                [
                    nguoiDungId,
                    ho_ten,
                    so_dien_thoai
                ]
            );

            await connection.commit();

            return response(200, {
                message: "Đăng ký thành công",
                user: {
                    id: nguoiDungId,
                    ten_dang_nhap: ten_dang_nhap,
                    vai_tro: "KHACH_HANG"
                }
            });

        } catch (err) {
            await connection.rollback();
            throw err;

        } finally {
            connection.release();
        }

    } catch (err) {
        console.error("Lỗi khi đăng ký:", err);

        return response(500, {
            message: "Lỗi server"
        });
    }
}

// =====================================================
// 4. GỬI OTP QUÊN MẬT KHẨU
// POST /api/auth/quen-mat-khau/gui-otp
// =====================================================

async function sendForgotPasswordOtp(req) {
    try {
        let { email } = req.body;

        email = (email || "").toString().trim();

        if (!email) {
            return response(400, {
                message: "Vui lòng nhập Gmail"
            });
        }

        // Tìm tài khoản theo Gmail
        const [rows] = await db.query(
            `
                SELECT
                    nd.id,
                    nd.ten_dang_nhap,
                    nd.trang_thai,
                    ttcn.email
                FROM nguoi_dung nd
                LEFT JOIN thong_tin_ca_nhan ttcn
                    ON nd.id = ttcn.nguoi_dung_id
                WHERE ttcn.email = ?
                LIMIT 1
            `,
            [email]
        );

        if (rows.length === 0) {
            return response(404, {
                message: "Gmail chưa được đăng ký"
            });
        }

        if (rows[0].trang_thai === "BI_KHOA") {
            return response(403, {
                message: "Tài khoản đã bị khóa. Vui lòng liên hệ admin."
            });
        }

        // Tạo và lưu OTP 5 phút
        const otp = taoOtp();

        forgotOtpStore[email] = {
            otp: otp,
            userId: rows[0].id,
            expiresAt: Date.now() + 5 * 60 * 1000
        };

        // Gửi Gmail
        await mailer.sendMail({
            from: `"VAX AI" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Mã OTP đặt lại mật khẩu",
            html: `
                <p>Mã OTP của bạn là:</p>
                <h2>${otp}</h2>
            `
        });

        return response(200, {
            message: "Đã gửi mã OTP về Gmail"
        });

    } catch (err) {
        console.error("Lỗi gửi OTP Gmail:", err);

        return response(500, {
            message: "Gửi OTP thất bại"
        });
    }
}

// =====================================================
// 5. ĐẶT LẠI MẬT KHẨU
// POST /api/auth/quen-mat-khau/dat-lai
// =====================================================

async function resetPassword(req) {
    try {
        let {
            email,
            otp,
            mat_khau_moi
        } = req.body;

        email = (email || "").toString().trim();
        otp = (otp || "").toString().trim();
        mat_khau_moi = (mat_khau_moi || "").toString();

        // Kiểm tra dữ liệu
        if (!email || !otp || !mat_khau_moi) {
            return response(400, {
                message: "Vui lòng nhập đầy đủ thông tin"
            });
        }

        if (mat_khau_moi !== mat_khau_moi.trim()) {
            return response(400, {
                message: "Mật khẩu không được có khoảng trắng ở đầu hoặc cuối"
            });
        }

        if (/\s/.test(mat_khau_moi)) {
            return response(400, {
                message: "Mật khẩu không được chứa khoảng trắng"
            });
        }

        if (!passwordRegex.test(mat_khau_moi)) {
            return response(400, {
                message: "Mật khẩu phải từ 8-32 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt"
            });
        }

        // Lấy OTP đã lưu
        const savedOtp = forgotOtpStore[email];

        if (!savedOtp) {
            return response(400, {
                message: "Bạn chưa gửi OTP hoặc OTP đã hết hạn"
            });
        }

        // Kiểm tra hết hạn
        if (Date.now() > savedOtp.expiresAt) {
            delete forgotOtpStore[email];

            return response(400, {
                message: "OTP đã hết hạn"
            });
        }

        // Kiểm tra OTP
        if (savedOtp.otp !== otp) {
            return response(400, {
                message: "OTP không đúng"
            });
        }

        // Tìm tài khoản
        const [rows] = await db.query(
            `
                SELECT
                    id,
                    mat_khau,
                    trang_thai
                FROM nguoi_dung
                WHERE id = ?
                LIMIT 1
            `,
            [savedOtp.userId]
        );

        if (rows.length === 0) {
            delete forgotOtpStore[email];

            return response(404, {
                message: "Không tìm thấy tài khoản"
            });
        }

        // Kiểm tra khóa tài khoản
        if (rows[0].trang_thai === "BI_KHOA") {
            return response(403, {
                message: "Tài khoản đã bị khóa. Vui lòng liên hệ admin."
            });
        }

        // Mật khẩu mới phải khác mật khẩu cũ
        const trungMatKhauCu = await bcrypt.compare(
            mat_khau_moi,
            rows[0].mat_khau
        );

        if (trungMatKhauCu) {
            return response(400, {
                message: "Mật khẩu mới phải khác mật khẩu hiện tại"
            });
        }

        // Hash mật khẩu mới
        const matKhauMoiDaHash = await bcrypt.hash(
            mat_khau_moi,
            SALT_ROUNDS
        );

        // Cập nhật mật khẩu
        await db.query(
            `
                UPDATE nguoi_dung
                SET mat_khau = ?
                WHERE id = ?
            `,
            [
                matKhauMoiDaHash,
                savedOtp.userId
            ]
        );

        // Xóa OTP sau khi sử dụng
        delete forgotOtpStore[email];

        return response(200, {
            message: "Đặt lại mật khẩu thành công"
        });

    } catch (err) {
        console.error("Lỗi đặt lại mật khẩu:", err);

        return response(500, {
            message: "Lỗi server"
        });
    }
}

// =====================================================
// 6. ĐỔI MẬT KHẨU KHI ĐÃ ĐĂNG NHẬP
// PUT /api/auth/change-password
// =====================================================

async function changePassword(req) {
    try {
        const userId = Number(
            req.headers["x-user-id"]
        );

        let {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        // Kiểm tra đăng nhập
        if (!Number.isInteger(userId) || userId <= 0) {
            return response(401, {
                message: "Bạn chưa đăng nhập"
            });
        }

        currentPassword =
            (currentPassword || "").toString();

        newPassword =
            (newPassword || "").toString();

        confirmPassword =
            (confirmPassword || "").toString();

        // Kiểm tra thông tin bắt buộc
        if (!currentPassword) {
            return response(400, {
                field: "currentPassword",
                message: "Vui lòng nhập mật khẩu hiện tại"
            });
        }

        if (!newPassword) {
            return response(400, {
                field: "newPassword",
                message: "Vui lòng nhập mật khẩu mới"
            });
        }

        if (!confirmPassword) {
            return response(400, {
                field: "confirmPassword",
                message: "Vui lòng xác nhận mật khẩu mới"
            });
        }

        // Kiểm tra khoảng trắng đầu và cuối
        if (currentPassword !== currentPassword.trim()) {
            return response(400, {
                field: "currentPassword",
                message: "Mật khẩu hiện tại không được có khoảng trắng ở đầu hoặc cuối"
            });
        }

        if (newPassword !== newPassword.trim()) {
            return response(400, {
                field: "newPassword",
                message: "Mật khẩu mới không được có khoảng trắng ở đầu hoặc cuối"
            });
        }

        if (confirmPassword !== confirmPassword.trim()) {
            return response(400, {
                field: "confirmPassword",
                message: "Xác nhận mật khẩu không được có khoảng trắng ở đầu hoặc cuối"
            });
        }

        // Kiểm tra khoảng trắng bên trong
        if (/\s/.test(currentPassword)) {
            return response(400, {
                field: "currentPassword",
                message: "Mật khẩu hiện tại không được chứa khoảng trắng"
            });
        }

        if (/\s/.test(newPassword)) {
            return response(400, {
                field: "newPassword",
                message: "Mật khẩu mới không được chứa khoảng trắng"
            });
        }

        if (/\s/.test(confirmPassword)) {
            return response(400, {
                field: "confirmPassword",
                message: "Xác nhận mật khẩu không được chứa khoảng trắng"
            });
        }

        // Kiểm tra mật khẩu mới
        if (!passwordRegex.test(newPassword)) {
            return response(400, {
                field: "newPassword",
                message: "Mật khẩu mới phải từ 8-32 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)"
            });
        }

        if (newPassword !== confirmPassword) {
            return response(400, {
                field: "confirmPassword",
                message: "Xác nhận mật khẩu mới không khớp"
            });
        }

        // Tìm tài khoản
        const [rows] = await db.query(
            `
                SELECT
                    id,
                    mat_khau,
                    trang_thai
                FROM nguoi_dung
                WHERE id = ?
                LIMIT 1
            `,
            [userId]
        );

        if (rows.length === 0) {
            return response(404, {
                message: "Không tìm thấy tài khoản"
            });
        }

        const user = rows[0];

        if (user.trang_thai === "BI_KHOA") {
            return response(403, {
                message: "Tài khoản đã bị khóa. Vui lòng liên hệ admin."
            });
        }

        // Kiểm tra mật khẩu hiện tại
        const matKhauHienTaiHopLe = await bcrypt.compare(
            currentPassword,
            user.mat_khau
        );

        if (!matKhauHienTaiHopLe) {
            return response(400, {
                field: "currentPassword",
                message: "Mật khẩu hiện tại không chính xác"
            });
        }

        // Mật khẩu mới phải khác mật khẩu cũ
        const trungMatKhauCu = await bcrypt.compare(
            newPassword,
            user.mat_khau
        );

        if (trungMatKhauCu) {
            return response(400, {
                field: "newPassword",
                message: "Mật khẩu mới phải khác mật khẩu hiện tại"
            });
        }

        // Hash mật khẩu mới
        const matKhauMoiDaHash = await bcrypt.hash(
            newPassword,
            SALT_ROUNDS
        );

        // Cập nhật mật khẩu
        await db.query(
            `
                UPDATE nguoi_dung
                SET mat_khau = ?
                WHERE id = ?
            `,
            [
                matKhauMoiDaHash,
                userId
            ]
        );

        return response(200, {
            message: "Đổi mật khẩu thành công"
        });

    } catch (err) {
        console.error("Lỗi đổi mật khẩu:", err);

        return response(500, {
            message: "Lỗi server khi đổi mật khẩu"
        });
    }
}

// =====================================================
// EXPORT 6 HÀM CHO CONTROLLER
// =====================================================

module.exports = {
    login,
    sendOtp,
    register,
    sendForgotPasswordOtp,
    resetPassword,
    changePassword
};
