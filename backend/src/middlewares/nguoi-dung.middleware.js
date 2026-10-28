
const usernameRegex =
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d._]{6,30}$/;

const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])\S{8,32}$/;

const ALLOWED_ROLES = [
    "ADMIN",
    "NHAN_VIEN_Y_TE",
    "KHACH_HANG"
];

const SALT_ROUNDS = 12;


function isEmpty(value) {
    return !value || value.toString().trim() === "";
}


function requireAdmin(req, res, next) {
    const vai_tro = req.headers["x-role"];

    if (vai_tro !== "ADMIN") {
        return res.status(403).json({
            message: "Bạn không có quyền ADMIN!"
        });
    }

    next();
}

function validateUsername(ten_dang_nhap) {

    if (isEmpty(ten_dang_nhap)) {
        return {
            ok: false,
            status: 400,
            message: "Tên đăng nhập là bắt buộc"
        };
    }

    if (
        ten_dang_nhap !==
        ten_dang_nhap.trim()
    ) {
        return {
            ok: false,
            status: 400,
            message:
                "Tên đăng nhập không được có khoảng trắng ở đầu hoặc cuối"
        };
    }

    if (/\s/.test(ten_dang_nhap)) {
        return {
            ok: false,
            status: 400,
            message:
                "Tên đăng nhập không được chứa khoảng trắng"
        };
    }

    if (!usernameRegex.test(ten_dang_nhap)) {
        return {
            ok: false,
            status: 400,
            message:
                "Tên đăng nhập phải từ 6-30 ký tự, chỉ gồm chữ, số, dấu chấm hoặc dấu gạch dưới, và phải có ít nhất 1 chữ và 1 số"
        };
    }

    return {
        ok: true
    };
}


function validatePassword(
    mat_khau,
    isReset = false
) {

    if (isEmpty(mat_khau)) {
        return {
            ok: false,
            status: 400,
            message: isReset
                ? "Mật khẩu mới là bắt buộc"
                : "Mật khẩu là bắt buộc"
        };
    }

    if (mat_khau !== mat_khau.trim()) {
        return {
            ok: false,
            status: 400,
            message:
                "Mật khẩu không được có khoảng trắng ở đầu hoặc cuối"
        };
    }

    if (/\s/.test(mat_khau)) {
        return {
            ok: false,
            status: 400,
            message:
                "Mật khẩu không được chứa khoảng trắng"
        };
    }

    if (!passwordRegex.test(mat_khau)) {
        return {
            ok: false,
            status: 400,
            message:
                "Mật khẩu phải từ 8-32 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)"
        };
    }

    return {
        ok: true
    };
}


function validateCoSoId(co_so_id) {

    if (
        co_so_id === undefined ||
        co_so_id === null ||
        String(co_so_id).trim() === ""
    ) {
        return {
            ok: false,
            status: 400,
            message:
                "Nhân viên y tế bắt buộc phải chọn cơ sở làm việc"
        };
    }

    const coSoId = Number(co_so_id);

    if (
        !Number.isInteger(coSoId) ||
        coSoId <= 0
    ) {
        return {
            ok: false,
            status: 400,
            message:
                "Cơ sở làm việc không hợp lệ"
        };
    }

    return {
        ok: true,
        coSoId
    };
}


module.exports = {
    usernameRegex,
    passwordRegex,
    ALLOWED_ROLES,
    SALT_ROUNDS,
    isEmpty,
    requireAdmin,
    validateUsername,
    validatePassword,
    validateCoSoId
};
