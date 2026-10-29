const db = require("../config/db");
const axios = require("axios");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomInt } = require("node:crypto");

require("dotenv").config();

const {
    SALT_ROUNDS,
    usernameRegex,
    passwordRegex,
    phoneRegex,
    fullNameRegex,
    taoOtp,
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

// ĐĂNG NHẬP

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
        const token = jwt.sign(
            {
                id: user.id,
                vai_tro: user.vai_tro
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "2h",
                algorithm: "HS256"
            }
        );
        return response(200, {
            message: "Đăng nhập thành công",
            token: token,
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

// GỬI OTP ĐĂNG KÝ

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
                     ma_yeu_cau,
                    loai_yeu_cau
                )
                VALUES (?, ?, 'DANG_KY_SDT')
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

// ĐĂNG KÝ TÀI KHOẢN

async function register(req) {
    // Đăng ký bằng Gmail
    if (req.body?.phuong_thuc === "EMAIL") {
        return registerByEmail(req);
    }
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
        // KIỂM TRA HỌ TÊN

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
        // KIỂM TRA TÊN ĐĂNG NHẬP

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

        // KIỂM TRA MẬT KHẨU

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
        // XÁC NHẬN MẬT KHẨU

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

        // SỐ ĐIỆN THOẠI

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
        // OTP

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
        // KIỂM TRA TRÙNG TÀI KHOẢN
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
        // KIỂM TRA TRÙNG SỐ ĐIỆN THOẠI

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

        // XÁC THỰC OTP

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
                    AND loai_yeu_cau = 'DANG_KY_SDT'
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
        // HASH MẬT KHẨU

        const matKhauDaHash = await bcrypt.hash(
            mat_khau,
            SALT_ROUNDS
        );
        // TẠO TÀI KHOẢN

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

// GỬI OTP QUÊN MẬT KHẨU

async function sendForgotPasswordOtp(req) {
    try {
        let { email } = req.body;

        email = (email || "").toString().trim();

        if (!email) {
            return response(400, {
                message: "Vui lòng nhập Gmail"
            });
        }

        // 1. Tìm tài khoản theo Gmail
        const [rows] = await db.query(
            `SELECT
                nd.id,
                nd.ten_dang_nhap,
                nd.trang_thai,
                ttcn.email
             FROM nguoi_dung nd
             INNER JOIN thong_tin_ca_nhan ttcn
                 ON nd.id = ttcn.nguoi_dung_id
             WHERE ttcn.email = ?
             LIMIT 1`,
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

        // 2. Kiểm tra thời gian chờ gửi OTP 60 giây
        const [recentRows] = await db.query(
            `SELECT
                TIMESTAMPDIFF(
                    SECOND,
                    ngay_tao,
                    NOW()
                ) AS so_giay
             FROM yeu_cau_otp
             WHERE email = ?
               AND loai_yeu_cau = 'QUEN_MAT_KHAU_EMAIL'
             ORDER BY id DESC
             LIMIT 1`,
            [email]
        );

        if (
            recentRows.length > 0 &&
            recentRows[0].so_giay < 60
        ) {
            return response(429, {
                message: "Vui lòng chờ 60 giây trước khi gửi OTP mới"
            });
        }

        // 3. Tạo OTP và mã hóa OTP
        const otp = taoOtp();

        const otpHash = await bcrypt.hash(
            otp,
            SALT_ROUNDS
        );

        // 4. Lưu OTP vào MySQL, hiệu lực 5 phút
        const [result] = await db.query(
            `INSERT INTO yeu_cau_otp (
                nguoi_dung_id,
                email,
                ma_otp_hash,
                loai_yeu_cau,
                het_hieu_luc,
                da_su_dung,
                so_lan_thu
             )
             VALUES (
                ?, ?, ?, 'QUEN_MAT_KHAU_EMAIL',
                DATE_ADD(NOW(), INTERVAL 5 MINUTE),
                0, 0
             )`,
            [rows[0].id, email, otpHash]
        );

        // 5. Gửi OTP đến Gmail
        try {
            await mailer.sendMail({
                from: `"VAX AI" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: "Mã OTP đặt lại mật khẩu",
                html: `
                    <p>Mã OTP của bạn là:</p>
                    <h2>${otp}</h2>
                    <p>Mã có hiệu lực trong 5 phút.</p>
                `
            });

        } catch (mailError) {
            // Xóa OTP nếu gửi Gmail thất bại
            await db.query(
                `DELETE FROM yeu_cau_otp
                 WHERE id = ?`,
                [result.insertId]
            );

            throw mailError;
        }

        // 6. Vô hiệu hóa các OTP cũ
        await db.query(
            `UPDATE yeu_cau_otp
             SET da_su_dung = 1
             WHERE email = ?
               AND loai_yeu_cau = 'QUEN_MAT_KHAU_EMAIL'
               AND id <> ?
               AND da_su_dung = 0`,
            [email, result.insertId]
        );

        // 7. Trả kết quả
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


// ĐẶT LẠI MẬT KHẨU

async function resetPassword(req) {
    let connection;

    try {
        let {
            email,
            otp,
            mat_khau_moi
        } = req.body;

        email = (email || "").toString().trim();
        otp = (otp || "").toString().trim();
        mat_khau_moi = (mat_khau_moi || "").toString();

        // 1. Kiểm tra dữ liệu
        if (!email || !otp || !mat_khau_moi) {
            return response(400, {
                message: "Vui lòng nhập đầy đủ thông tin"
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return response(400, {
                message: "Mã OTP phải gồm 6 chữ số"
            });
        }

        if (
            mat_khau_moi !== mat_khau_moi.trim() ||
            /\s/.test(mat_khau_moi)
        ) {
            return response(400, {
                message: "Mật khẩu không được chứa khoảng trắng"
            });
        }

        if (!passwordRegex.test(mat_khau_moi)) {
            return response(400, {
                message: "Mật khẩu phải từ 8-32 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt"
            });
        }

        // 2. Mở transaction và khóa bản ghi OTP
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [otpRows] = await connection.query(
            `SELECT
                id,
                nguoi_dung_id,
                ma_otp_hash,
                het_hieu_luc,
                da_su_dung,
                so_lan_thu,
                NOW() AS thoi_gian_hien_tai
             FROM yeu_cau_otp
             WHERE email = ?
               AND loai_yeu_cau = 'QUEN_MAT_KHAU_EMAIL'
             ORDER BY id DESC
             LIMIT 1
             FOR UPDATE`,
            [email]
        );

        if (otpRows.length === 0) {
            await connection.rollback();

            return response(400, {
                message: "Bạn chưa gửi OTP"
            });
        }

        const savedOtp = otpRows[0];

        // 3. Kiểm tra OTP đã sử dụng
        if (savedOtp.da_su_dung) {
            await connection.rollback();

            return response(400, {
                message: "OTP đã được sử dụng"
            });
        }

        // 4. Kiểm tra OTP hết hạn
        if (
            !savedOtp.het_hieu_luc ||
            new Date(savedOtp.thoi_gian_hien_tai) >
            new Date(savedOtp.het_hieu_luc)
        ) {
            await connection.rollback();

            return response(400, {
                message: "OTP đã hết hạn"
            });
        }

        // 5. Giới hạn 5 lần nhập sai
        if (savedOtp.so_lan_thu >= 5) {
            await connection.rollback();

            return response(429, {
                message: "Bạn đã nhập sai OTP quá 5 lần. Vui lòng gửi mã mới"
            });
        }

        // 6. Xác thực OTP đã băm
        const otpHopLe = savedOtp.ma_otp_hash
            ? await bcrypt.compare(
                otp,
                savedOtp.ma_otp_hash
            )
            : false;

        if (!otpHopLe) {
            await connection.query(
                `UPDATE yeu_cau_otp
                 SET so_lan_thu = so_lan_thu + 1
                 WHERE id = ?`,
                [savedOtp.id]
            );

            await connection.commit();

            return response(400, {
                message: "OTP không đúng"
            });
        }

        // 7. Tìm tài khoản
        const [rows] = await connection.query(
            `SELECT
                id,
                mat_khau,
                trang_thai
             FROM nguoi_dung
             WHERE id = ?
             LIMIT 1
             FOR UPDATE`,
            [savedOtp.nguoi_dung_id]
        );

        if (rows.length === 0) {
            await connection.rollback();

            return response(404, {
                message: "Không tìm thấy tài khoản"
            });
        }

        if (rows[0].trang_thai === "BI_KHOA") {
            await connection.rollback();

            return response(403, {
                message: "Tài khoản đã bị khóa. Vui lòng liên hệ admin."
            });
        }

        // 8. Mật khẩu mới phải khác mật khẩu cũ
        const trungMatKhauCu = await bcrypt.compare(
            mat_khau_moi,
            rows[0].mat_khau
        );

        if (trungMatKhauCu) {
            await connection.rollback();

            return response(400, {
                message: "Mật khẩu mới phải khác mật khẩu hiện tại"
            });
        }

        // 9. Hash mật khẩu mới
        const matKhauMoiDaHash = await bcrypt.hash(
            mat_khau_moi,
            SALT_ROUNDS
        );

        // 10. Cập nhật mật khẩu
        await connection.query(
            `UPDATE nguoi_dung
             SET mat_khau = ?
             WHERE id = ?`,
            [matKhauMoiDaHash, rows[0].id]
        );

        // 11. Đánh dấu OTP đã sử dụng
        await connection.query(
            `UPDATE yeu_cau_otp
             SET da_su_dung = 1
             WHERE id = ?`,
            [savedOtp.id]
        );

        await connection.commit();

        return response(200, {
            message: "Đặt lại mật khẩu thành công"
        });

    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Lỗi rollback:",
                    rollbackError
                );
            }
        }

        console.error(
            "Lỗi đặt lại mật khẩu:",
            err
        );

        return response(500, {
            message: "Lỗi server"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


//ĐỔI MẬT KHẨU KHI ĐÃ ĐĂNG NHẬP
async function changePassword(req) {
    try {
        const userId = Number(req.user.id);

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

async function sendRegisterEmailOtp(req) {
    try {
        const email = String(req.body?.email || "")
            .trim()
            .toLowerCase();

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            email.length > 254 ||
            !email.endsWith("@gmail.com")
        ) {
            return response(400, {
                field: "email",
                message: "Vui lòng nhập địa chỉ Gmail hợp lệ"
            });
        }

        // Kiểm tra Gmail đã được sử dụng
        const [existing] = await db.query(
            `SELECT id
             FROM thong_tin_ca_nhan
             WHERE LOWER(email) = ?
             LIMIT 1`,
            [email]
        );

        if (existing.length > 0) {
            return response(409, {
                field: "email",
                message: "Gmail đã được sử dụng"
            });
        }

        // Giới hạn gửi lại OTP trong 60 giây
        const [recent] = await db.query(
            `SELECT TIMESTAMPDIFF(
                SECOND,
                ngay_tao,
                NOW()
            ) AS seconds_ago
             FROM yeu_cau_otp
             WHERE email = ?
               AND loai_yeu_cau = 'DANG_KY_EMAIL'
             ORDER BY id DESC
             LIMIT 1`,
            [email]
        );

        if (
            recent.length > 0 &&
            recent[0].seconds_ago >= 0 &&
            recent[0].seconds_ago < 60
        ) {
            return response(429, {
                message: "Vui lòng chờ 60 giây trước khi gửi mã mới"
            });
        }

        // Tạo OTP 6 chữ số
        const otp = String(randomInt(100000, 1000000));

        const otpHash = await bcrypt.hash(
            otp,
            SALT_ROUNDS
        );

        // Lưu OTP vào MySQL
        const [result] = await db.query(
            `INSERT INTO yeu_cau_otp (
                email,
                ma_otp_hash,
                loai_yeu_cau,
                het_hieu_luc,
                da_su_dung,
                so_lan_thu
            )
            VALUES (
                ?, ?,
                'DANG_KY_EMAIL',
                DATE_ADD(NOW(), INTERVAL 5 MINUTE),
                0, 0
            )`,
            [email, otpHash]
        );

        // Gửi OTP qua Nodemailer
        try {
            await mailer.sendMail({
                from: `"VAX AI" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: "Mã OTP đăng ký tài khoản",
                text: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`,
                html: `
                    <p>Mã OTP đăng ký tài khoản:</p>
                    <h2>${otp}</h2>
                    <p>Mã có hiệu lực trong 5 phút.</p>
                `
            });

        } catch (mailError) {
            await db.query(
                `DELETE FROM yeu_cau_otp WHERE id = ?`,
                [result.insertId]
            );

            throw mailError;
        }

        // Vô hiệu hóa OTP cũ
        await db.query(
            `UPDATE yeu_cau_otp
             SET da_su_dung = 1
             WHERE email = ?
               AND loai_yeu_cau = 'DANG_KY_EMAIL'
               AND id <> ?
               AND da_su_dung = 0`,
            [email, result.insertId]
        );

        return response(200, {
            message: "Đã gửi mã OTP đăng ký đến Gmail"
        });

    } catch (err) {
        console.error("Lỗi gửi OTP đăng ký Gmail:", err);

        return response(500, {
            message: "Không thể gửi OTP đăng ký Gmail"
        });
    }
}

async function registerByEmail(req) {
    let connection;

    try {
        const {
            ho_ten,
            ten_dang_nhap,
            mat_khau,
            xac_nhan_mat_khau,
            otp
        } = req.body;

        const fullName = String(ho_ten || "");
        const username = String(ten_dang_nhap || "");
        const password = String(mat_khau || "");
        const confirm = String(xac_nhan_mat_khau || "");
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();
        const code = String(otp || "").trim();

        // Kiểm tra họ tên
        if (
            fullName !== fullName.trim() ||
            fullName.length < 2 ||
            fullName.length > 50 ||
            !fullNameRegex.test(fullName)
        ) {
            return response(400, {
                field: "ho_ten",
                message: "Họ tên không hợp lệ"
            });
        }

        // Kiểm tra tên đăng nhập
        if (
            username !== username.trim() ||
            !usernameRegex.test(username)
        ) {
            return response(400, {
                field: "ten_dang_nhap",
                message: "Tài khoản không hợp lệ"
            });
        }

        // Kiểm tra mật khẩu
        if (
            !passwordRegex.test(password) ||
            /\s/.test(password)
        ) {
            return response(400, {
                field: "mat_khau",
                message: "Mật khẩu không hợp lệ"
            });
        }

        if (password !== confirm) {
            return response(400, {
                field: "xac_nhan_mat_khau",
                message: "Mật khẩu nhập lại không khớp"
            });
        }

        // Kiểm tra Gmail
        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            email.length > 254 ||
            !email.endsWith("@gmail.com")
        ) {
            return response(400, {
                field: "email",
                message: "Gmail không hợp lệ"
            });
        }

        // Kiểm tra OTP
        if (!/^\d{6}$/.test(code)) {
            return response(400, {
                field: "otp",
                message: "OTP phải gồm 6 chữ số"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Kiểm tra trùng tên đăng nhập
        const [existingUser] = await connection.query(
            `SELECT id
             FROM nguoi_dung
             WHERE ten_dang_nhap = ?
             LIMIT 1`,
            [username]
        );

        if (existingUser.length > 0) {
            await connection.rollback();

            return response(409, {
                field: "ten_dang_nhap",
                message: "Tài khoản đã tồn tại"
            });
        }

        // Kiểm tra trùng Gmail
        const [existingEmail] = await connection.query(
            `SELECT id
             FROM thong_tin_ca_nhan
             WHERE LOWER(email) = ?
             LIMIT 1`,
            [email]
        );

        if (existingEmail.length > 0) {
            await connection.rollback();

            return response(409, {
                field: "email",
                message: "Gmail đã được sử dụng"
            });
        }

        // Lấy OTP mới nhất và khóa bản ghi
        const [otpRows] = await connection.query(
            `SELECT
                id,
                ma_otp_hash,
                het_hieu_luc,
                da_su_dung,
                so_lan_thu,
                (het_hieu_luc <= NOW()) AS expired
             FROM yeu_cau_otp
             WHERE email = ?
               AND loai_yeu_cau = 'DANG_KY_EMAIL'
             ORDER BY id DESC
             LIMIT 1
             FOR UPDATE`,
            [email]
        );

        if (otpRows.length === 0) {
            await connection.rollback();

            return response(400, {
                field: "otp",
                message: "Bạn chưa gửi OTP đăng ký Gmail"
            });
        }

        const saved = otpRows[0];

        // Kiểm tra OTP hết hạn hoặc đã sử dụng
        if (
            saved.da_su_dung ||
            saved.expired ||
            !saved.het_hieu_luc
        ) {
            await connection.rollback();

            return response(400, {
                field: "otp",
                message: "OTP đã sử dụng hoặc hết hạn"
            });
        }

        // Giới hạn 5 lần nhập sai
        if (saved.so_lan_thu >= 5) {
            await connection.rollback();

            return response(429, {
                field: "otp",
                message: "Bạn đã nhập sai OTP 5 lần, vui lòng gửi mã mới"
            });
        }

        // So sánh OTP với mã đã hash
        const valid = saved.ma_otp_hash
            ? await bcrypt.compare(
                code,
                saved.ma_otp_hash
            )
            : false;

        if (!valid) {
            await connection.query(
                `UPDATE yeu_cau_otp
                 SET so_lan_thu = so_lan_thu + 1
                 WHERE id = ?`,
                [saved.id]
            );

            await connection.commit();

            return response(400, {
                field: "otp",
                message: "OTP không đúng"
            });
        }

        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(
            password,
            SALT_ROUNDS
        );

        // Tạo tài khoản
        const [userResult] = await connection.query(
            `INSERT INTO nguoi_dung (
                ten_dang_nhap,
                mat_khau,
                vai_tro,
                trang_thai
            )
            VALUES (?, ?, 'KHACH_HANG', 'HOAT_DONG')`,
            [username, hashedPassword]
        );

        // Lưu hồ sơ khách hàng
        await connection.query(
            `INSERT INTO thong_tin_ca_nhan (
                nguoi_dung_id,
                ho_ten,
                email
            )
            VALUES (?, ?, ?)`,
            [
                userResult.insertId,
                fullName,
                email
            ]
        );

        // Đánh dấu OTP đã dùng
        await connection.query(
            `UPDATE yeu_cau_otp
             SET da_su_dung = 1
             WHERE id = ?`,
            [saved.id]
        );

        await connection.commit();

        return response(200, {
            message: "Đăng ký bằng Gmail thành công",
            user: {
                id: userResult.insertId,
                ten_dang_nhap: username,
                vai_tro: "KHACH_HANG"
            }
        });

    } catch (err) {
        if (connection) {
            await connection.rollback().catch(() => { });
        }

        console.error("Lỗi đăng ký Gmail:", err);

        if (err.code === "ER_DUP_ENTRY") {
            return response(409, {
                message: "Tên đăng nhập hoặc Gmail đã tồn tại"
            });
        }

        return response(500, {
            message: "Lỗi server khi đăng ký Gmail"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function sendForgotPasswordPhoneOtp(req) {
    try {
        const so_dien_thoai = String(
            req.body?.so_dien_thoai || ""
        ).trim();

        if (!phoneRegex.test(so_dien_thoai)) {
            return response(400, {
                message: "Số điện thoại không hợp lệ"
            });
        }

        const [users] = await db.query(
            `SELECT nd.id, nd.trang_thai
             FROM nguoi_dung nd
             INNER JOIN thong_tin_ca_nhan ttcn
                 ON ttcn.nguoi_dung_id = nd.id
             WHERE ttcn.so_dien_thoai = ?
             LIMIT 1`,
            [so_dien_thoai]
        );

        if (users.length === 0) {
            return response(404, {
                message: "Số điện thoại chưa được đăng ký"
            });
        }

        if (users[0].trang_thai === "BI_KHOA") {
            return response(403, {
                message: "Tài khoản đã bị khóa. Vui lòng liên hệ admin."
            });
        }

        const [recent] = await db.query(
            `SELECT TIMESTAMPDIFF(
                SECOND, ngay_tao, NOW()
             ) AS so_giay
             FROM yeu_cau_otp
             WHERE so_dien_thoai = ?
               AND loai_yeu_cau = 'QUEN_MAT_KHAU_SDT'
             ORDER BY id DESC
             LIMIT 1`,
            [so_dien_thoai]
        );

        if (
            recent.length > 0 &&
            recent[0].so_giay >= 0 &&
            recent[0].so_giay < 60
        ) {
            return response(429, {
                message: "Vui lòng chờ 60 giây trước khi gửi OTP mới"
            });
        }

        if (
            process.env.OTP_REQUIRED !== "true" ||
            !process.env.FASTOTP_API_KEY
        ) {
            return response(503, {
                message: "Dịch vụ OTP số điện thoại chưa được cấu hình"
            });
        }

        const otpResponse = await axios.post(
            "https://otp-gateway.viethomes-jp.workers.dev/v1/partner/otp/request",
            { phone: so_dien_thoai },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": process.env.FASTOTP_API_KEY
                }
            }
        );

        const requestId = otpResponse.data?.request_id;

        if (!requestId) {
            return response(502, {
                message: "FastOTP không trả về mã yêu cầu"
            });
        }

        const [result] = await db.query(
            `INSERT INTO yeu_cau_otp (
                nguoi_dung_id,
                so_dien_thoai,
                ma_yeu_cau,
                loai_yeu_cau,
                het_hieu_luc,
                da_su_dung,
                so_lan_thu
            ) VALUES (
                ?, ?, ?, 'QUEN_MAT_KHAU_SDT',
                DATE_ADD(NOW(), INTERVAL 5 MINUTE),
                0, 0
            )`,
            [users[0].id, so_dien_thoai, requestId]
        );

        await db.query(
            `UPDATE yeu_cau_otp
             SET da_su_dung = 1
             WHERE so_dien_thoai = ?
               AND loai_yeu_cau = 'QUEN_MAT_KHAU_SDT'
               AND id <> ?
               AND da_su_dung = 0`,
            [so_dien_thoai, result.insertId]
        );

        return response(200, {
            message: "Đã gửi OTP đến số điện thoại",
            ma_yeu_cau: requestId
        });

    } catch (err) {
        console.error(
            "Lỗi gửi OTP quên mật khẩu SĐT:",
            err.response?.data || err.message
        );

        return response(500, {
            message: "Gửi OTP số điện thoại thất bại"
        });
    }
}

async function resetPasswordByPhone(req) {
    let connection;

    try {
        const so_dien_thoai = String(
            req.body?.so_dien_thoai || ""
        ).trim();

        const ma_yeu_cau = String(
            req.body?.ma_yeu_cau || ""
        ).trim();

        const otp = String(req.body?.otp || "").trim();

        const mat_khau_moi = String(
            req.body?.mat_khau_moi || ""
        );

        if (!phoneRegex.test(so_dien_thoai)) {
            return response(400, {
                message: "Số điện thoại không hợp lệ"
            });
        }

        if (!ma_yeu_cau || !/^\d{6}$/.test(otp)) {
            return response(400, {
                message: "Thông tin OTP không hợp lệ"
            });
        }

        if (
            !passwordRegex.test(mat_khau_moi) ||
            /\s/.test(mat_khau_moi)
        ) {
            return response(400, {
                message: "Mật khẩu mới không đúng định dạng"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [otpRows] = await connection.query(
            `SELECT id, nguoi_dung_id, ma_yeu_cau,
                    da_su_dung, so_lan_thu,
                    (het_hieu_luc <= NOW()) AS het_han
             FROM yeu_cau_otp
             WHERE so_dien_thoai = ?
               AND ma_yeu_cau = ?
               AND loai_yeu_cau = 'QUEN_MAT_KHAU_SDT'
             ORDER BY id DESC
             LIMIT 1
             FOR UPDATE`,
            [so_dien_thoai, ma_yeu_cau]
        );

        if (otpRows.length === 0) {
            await connection.rollback();

            return response(400, {
                message: "Không tìm thấy yêu cầu OTP"
            });
        }

        const saved = otpRows[0];

        if (saved.da_su_dung || saved.het_han === 1) {
            await connection.rollback();

            return response(400, {
                message: "OTP đã sử dụng hoặc hết hạn"
            });
        }

        if (saved.so_lan_thu >= 5) {
            await connection.rollback();

            return response(429, {
                message: "Bạn đã nhập sai OTP quá 5 lần"
            });
        }

        const [users] = await connection.query(
            `SELECT nd.id, nd.mat_khau, nd.trang_thai
             FROM nguoi_dung nd
             INNER JOIN thong_tin_ca_nhan ttcn
                 ON ttcn.nguoi_dung_id = nd.id
             WHERE nd.id = ?
               AND ttcn.so_dien_thoai = ?
             LIMIT 1
             FOR UPDATE`,
            [saved.nguoi_dung_id, so_dien_thoai]
        );

        if (users.length === 0) {
            await connection.rollback();

            return response(404, {
                message: "Không tìm thấy tài khoản"
            });
        }

        if (users[0].trang_thai === "BI_KHOA") {
            await connection.rollback();

            return response(403, {
                message: "Tài khoản đã bị khóa"
            });
        }

        // Kiểm tra mật khẩu trước khi xác thực OTP
        const trungMatKhauCu = await bcrypt.compare(
            mat_khau_moi,
            users[0].mat_khau
        );

        if (trungMatKhauCu) {
            await connection.rollback();

            return response(400, {
                message: "Mật khẩu mới phải khác mật khẩu hiện tại"
            });
        }

        let verifyResponse;

        try {
            verifyResponse = await axios.post(
                "https://otp-gateway.viethomes-jp.workers.dev/v1/partner/otp/verify",
                {
                    request_id: ma_yeu_cau,
                    otp
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-Key": process.env.FASTOTP_API_KEY
                    }
                }
            );

        } catch (verifyError) {
            console.error(
                "Lỗi xác thực FastOTP:",
                verifyError.response?.data || verifyError.message
            );

            await connection.rollback();

            return response(502, {
                message: "Không thể xác thực OTP. Vui lòng thử lại"
            });
        }

        if (verifyResponse.data?.success !== true) {
            await connection.query(
                `UPDATE yeu_cau_otp
                 SET so_lan_thu = so_lan_thu + 1
                 WHERE id = ?`,
                [saved.id]
            );

            await connection.commit();

            return response(400, {
                message: "OTP không đúng hoặc đã hết hạn"
            });
        }

        const hashedPassword = await bcrypt.hash(
            mat_khau_moi,
            SALT_ROUNDS
        );

        await connection.query(
            `UPDATE nguoi_dung
             SET mat_khau = ?
             WHERE id = ?`,
            [hashedPassword, users[0].id]
        );

        await connection.query(
            `UPDATE yeu_cau_otp
             SET da_su_dung = 1
             WHERE id = ?`,
            [saved.id]
        );

        await connection.commit();

        return response(200, {
            message: "Đặt lại mật khẩu thành công"
        });

    } catch (err) {
        if (connection) {
            await connection.rollback().catch(() => { });
        }

        console.error("Lỗi đặt lại mật khẩu SĐT:", err);

        return response(500, {
            message: "Lỗi server khi đặt lại mật khẩu"
        });

    } finally {
        if (connection) {
            connection.release();
        }
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
