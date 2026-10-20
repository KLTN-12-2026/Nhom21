
const db = require("../config/db");

// ======================================================
// 1. REGEX VALIDATE
// ======================================================

const fullNameRegex =
    /^[A-Za-zÀ-ỹ]+(?:\s[A-Za-zÀ-ỹ]+)*$/;

const phoneRegex =
    /^0\d{9}$/;

const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Không cho địa chỉ bắt đầu hoặc kết thúc bằng , . / -
const addressRegex =
    /^[A-Za-zÀ-ỹ0-9](?:[A-Za-zÀ-ỹ0-9\s,./-]{3,98})[A-Za-zÀ-ỹ0-9]$/;


// ======================================================
// 2. HÀM HỖ TRỢ
// ======================================================

function isEmpty(value) {

    return (
        value === undefined ||
        value === null ||
        value.toString().trim() === ""
    );
}


function getAgeFromDate(dateString) {

    const today = new Date();

    const birthDate = new Date(
        `${dateString}T00:00:00`
    );

    if (Number.isNaN(birthDate.getTime())) {
        return null;
    }

    let age =
        today.getFullYear() -
        birthDate.getFullYear();

    const monthDiff =
        today.getMonth() -
        birthDate.getMonth();

    if (
        monthDiff < 0 ||
        (
            monthDiff === 0 &&
            today.getDate() < birthDate.getDate()
        )
    ) {
        age--;
    }

    return age;
}


function isValidDateString(value) {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(
        `${value}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const [year, month, day] =
        value.split("-").map(Number);

    return (
        date.getFullYear() === year &&
        date.getMonth() + 1 === month &&
        date.getDate() === day
    );
}


// ======================================================
// 3. VALIDATE THÔNG TIN CÁ NHÂN
//
// Giữ nguyên thứ tự kiểm tra của Route gốc.
// ======================================================

function validateThongTinCaNhan(input) {

    let {
        ho_ten,
        ngay_sinh,
        gioi_tinh,
        so_dien_thoai,
        dia_chi,
        email
    } = input;

    // ==================================================
    // 3.1. ÉP KIỂU AN TOÀN
    // ==================================================

    ho_ten = (ho_ten || "").toString();

    ngay_sinh = (ngay_sinh || "").toString();

    gioi_tinh = (gioi_tinh || "").toString();

    so_dien_thoai =
        (so_dien_thoai || "").toString();

    dia_chi = (dia_chi || "").toString();

    email = (email || "").toString();

    // ==================================================
    // 3.2. VALIDATION HỌ TÊN
    // ==================================================

    if (isEmpty(ho_ten)) {
        return {
            valid: false,
            message: "Họ tên là bắt buộc"
        };
    }

    if (ho_ten !== ho_ten.trim()) {
        return {
            valid: false,
            message:
                "Họ tên không được có khoảng trắng ở đầu hoặc cuối"
        };
    }

    if (
        ho_ten.length < 2 ||
        ho_ten.length > 50
    ) {
        return {
            valid: false,
            message:
                "Họ tên phải từ 2 đến 50 ký tự"
        };
    }

    if (!fullNameRegex.test(ho_ten)) {
        return {
            valid: false,
            message:
                "Họ tên không được chứa số hoặc ký tự đặc biệt"
        };
    }

    // ==================================================
    // 3.3. VALIDATION NGÀY SINH
    // ==================================================

    if (isEmpty(ngay_sinh)) {
        return {
            valid: false,
            message: "Ngày sinh là bắt buộc"
        };
    }

    if (!isValidDateString(ngay_sinh)) {
        return {
            valid: false,
            message: "Ngày sinh không hợp lệ"
        };
    }

    const today = new Date();

    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    if (ngay_sinh > todayString) {
        return {
            valid: false,
            message:
                "Ngày sinh không được lớn hơn ngày hiện tại"
        };
    }

    const age = getAgeFromDate(ngay_sinh);

    if (
        age === null ||
        age < 0 ||
        age > 120
    ) {
        return {
            valid: false,
            message: "Ngày sinh không hợp lệ"
        };
    }

    // ==================================================
    // 3.4. VALIDATION GIỚI TÍNH
    // ==================================================

    if (isEmpty(gioi_tinh)) {
        return {
            valid: false,
            message: "Giới tính là bắt buộc"
        };
    }

    if (
        !["Nam", "Nữ", "Khác"].includes(
            gioi_tinh
        )
    ) {
        return {
            valid: false,
            message: "Giới tính không hợp lệ"
        };
    }

    // ==================================================
    // 3.5. VALIDATION SỐ ĐIỆN THOẠI
    // ==================================================

    if (isEmpty(so_dien_thoai)) {
        return {
            valid: false,
            message:
                "Số điện thoại là bắt buộc"
        };
    }

    if (
        so_dien_thoai !==
        so_dien_thoai.trim()
    ) {
        return {
            valid: false,
            message:
                "Số điện thoại không được có khoảng trắng ở đầu hoặc cuối"
        };
    }

    if (!phoneRegex.test(so_dien_thoai)) {
        return {
            valid: false,
            message:
                "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0"
        };
    }

    // ==================================================
    // 3.6. VALIDATION EMAIL
    // ==================================================

    if (isEmpty(email)) {
        return {
            valid: false,
            message: "Email là bắt buộc"
        };
    }

    if (email !== email.trim()) {
        return {
            valid: false,
            message:
                "Email không được có khoảng trắng ở đầu hoặc cuối"
        };
    }

    if (email.length > 100) {
        return {
            valid: false,
            message:
                "Email không được vượt quá 100 ký tự"
        };
    }

    if (!emailRegex.test(email)) {
        return {
            valid: false,
            message:
                "Email không đúng định dạng"
        };
    }

    // ==================================================
    // 3.7. VALIDATION ĐỊA CHỈ
    // ==================================================

    if (isEmpty(dia_chi)) {
        return {
            valid: false,
            message: "Địa chỉ là bắt buộc"
        };
    }

    if (dia_chi !== dia_chi.trim()) {
        return {
            valid: false,
            message:
                "Địa chỉ không được có khoảng trắng ở đầu hoặc cuối"
        };
    }

    if (
        dia_chi.length < 5 ||
        dia_chi.length > 100
    ) {
        return {
            valid: false,
            message:
                "Địa chỉ phải từ 5 đến 100 ký tự"
        };
    }

    if (!addressRegex.test(dia_chi)) {
        return {
            valid: false,
            message:
                "Địa chỉ chỉ được chứa chữ, số và các dấu , . / -; không được ở đầu hoặc cuối"
        };
    }

    // ==================================================
    // 3.8. DỮ LIỆU HỢP LỆ
    // ==================================================

    return {
        valid: true,
        data: {
            ho_ten,
            ngay_sinh,
            gioi_tinh,
            so_dien_thoai,
            dia_chi,
            email
        }
    };
}


// ======================================================
// 4. LẤY THÔNG TIN CÁ NHÂN
//
// GET /api/profile/:userId
// ======================================================

async function getThongTinCaNhan(userId) {

    const sql = `
        SELECT
            u.id,
            u.ten_dang_nhap,
            u.vai_tro,
            t.ho_ten,
            t.ngay_sinh,
            t.gioi_tinh,
            t.so_dien_thoai,
            t.dia_chi,
            t.email

        FROM nguoi_dung u

        LEFT JOIN thong_tin_ca_nhan t
            ON u.id = t.nguoi_dung_id

        WHERE u.id = ?

        LIMIT 1
    `;

    const [rows] = await db.query(
        sql,
        [userId]
    );

    if (rows.length === 0) {
        return {
            status: 404,
            body: {
                message:
                    "Không tìm thấy người dùng"
            }
        };
    }

    return {
        status: 200,
        body: rows[0]
    };
}


// ======================================================
// 5. CẬP NHẬT THÔNG TIN CÁ NHÂN
//
// PUT /api/profile/:userId
//
// Chưa có hồ sơ: INSERT.
// Đã có hồ sơ: UPDATE.
// ======================================================

async function capNhatThongTinCaNhan(
    userId,
    data
) {

    const {
        ho_ten,
        ngay_sinh,
        gioi_tinh,
        so_dien_thoai,
        dia_chi,
        email
    } = data;

    // ==================================================
    // 5.1. KIỂM TRA NGƯỜI DÙNG TỒN TẠI
    // ==================================================

    const [userRows] = await db.query(
        `
        SELECT id
        FROM nguoi_dung
        WHERE id = ?
        LIMIT 1
        `,
        [userId]
    );

    if (userRows.length === 0) {
        return {
            status: 404,
            body: {
                message:
                    "Không tìm thấy người dùng"
            }
        };
    }

    // ==================================================
    // 5.2. KIỂM TRA HỒ SƠ ĐÃ TỒN TẠI
    // ==================================================

    const [profileRows] = await db.query(
        `
        SELECT id
        FROM thong_tin_ca_nhan
        WHERE nguoi_dung_id = ?
        LIMIT 1
        `,
        [userId]
    );

    // ==================================================
    // 5.3. CHƯA CÓ HỒ SƠ → INSERT
    // ==================================================

    if (profileRows.length === 0) {

        const insertSql = `
            INSERT INTO thong_tin_ca_nhan
            (
                nguoi_dung_id,
                ho_ten,
                ngay_sinh,
                gioi_tinh,
                so_dien_thoai,
                dia_chi,
                email
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(
            insertSql,
            [
                userId,
                ho_ten,
                ngay_sinh,
                gioi_tinh,
                so_dien_thoai,
                dia_chi,
                email
            ]
        );

    } else {

        // ==================================================
        // 5.4. ĐÃ CÓ HỒ SƠ → UPDATE
        // ==================================================

        const updateSql = `
            UPDATE thong_tin_ca_nhan
            SET
                ho_ten = ?,
                ngay_sinh = ?,
                gioi_tinh = ?,
                so_dien_thoai = ?,
                dia_chi = ?,
                email = ?
            WHERE nguoi_dung_id = ?
        `;

        await db.query(
            updateSql,
            [
                ho_ten,
                ngay_sinh,
                gioi_tinh,
                so_dien_thoai,
                dia_chi,
                email,
                userId
            ]
        );
    }

    return {
        status: 200,
        body: {
            message:
                "Cập nhật thông tin cá nhân thành công"
        }
    };
}


// ======================================================
// 6. ADMIN - DANH SÁCH THÔNG TIN CÁ NHÂN
//
// GET /api/profile
// ======================================================

async function getDanhSachThongTinCaNhan() {

    const sql = `
        SELECT
            u.id,
            u.ten_dang_nhap,
            u.vai_tro,
            t.ho_ten,
            t.ngay_sinh,
            t.gioi_tinh,
            t.so_dien_thoai,
            t.dia_chi,
            t.email

        FROM nguoi_dung u

        INNER JOIN thong_tin_ca_nhan t
            ON u.id = t.nguoi_dung_id

        ORDER BY u.id DESC
    `;

    const [rows] = await db.query(sql);

    return {
        status: 200,
        body: rows
    };
}


// ======================================================
// EXPORT SERVICE
// ======================================================

module.exports = {
    validateThongTinCaNhan,
    getThongTinCaNhan,
    capNhatThongTinCaNhan,
    getDanhSachThongTinCaNhan
};
