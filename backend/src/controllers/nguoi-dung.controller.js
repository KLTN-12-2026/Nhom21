
const nguoiDungService = require(
    "../services/nguoi-dung.service"
);

const {
    validateUsername,
    validatePassword,
    validateCoSoId,
    isEmpty
} = require(
    "../middlewares/nguoi-dung.middleware"
);

async function register(req, res) {
    try {
        let {
            ho_ten,
            ten_dang_nhap,
            mat_khau,
            so_dien_thoai,
            otp
        } = req.body;

        ho_ten = (ho_ten || "").toString();
        ten_dang_nhap = (ten_dang_nhap || "").toString();
        mat_khau = (mat_khau || "").toString();
        so_dien_thoai = (so_dien_thoai || "").toString();

        if (
            !ho_ten ||
            !ten_dang_nhap ||
            !mat_khau ||
            !so_dien_thoai
        ) {
            return res.status(400).json({
                message: "Thiếu thông tin bắt buộc"
            });
        }

        const result = await nguoiDungService.register({
            ho_ten,
            ten_dang_nhap,
            mat_khau,
            so_dien_thoai
        });

        if (!result.ok) {
            return res.status(result.status).json({
                message: result.message
            });
        }

        return res.json({
            message: "Đăng ký thành công!",
            nguoi_dung_id: result.nguoi_dung_id
        });

    } catch (err) {
        console.error("REGISTER ERROR:", err);

        return res.status(500).json({
            message: "Lỗi server khi đăng ký"
        });
    }
}

async function getAll(req, res) {
    try {
        const includeDeleted =
            String(req.query.includeDeleted || "0") === "1";

        const rows = await nguoiDungService.getAll(
            includeDeleted
        );

        return res.json(rows);

    } catch (err) {
        console.error(
            "Lỗi lấy danh sách users:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

async function create(req, res) {
    try {
        let {
            ten_dang_nhap,
            mat_khau,
            vai_tro,
            co_so_id
        } = req.body;

        ten_dang_nhap =
            (ten_dang_nhap || "").toString();

        mat_khau =
            (mat_khau || "").toString();

        vai_tro =
            (vai_tro || "").toString();

        const usernameCheck =
            validateUsername(ten_dang_nhap);

        if (!usernameCheck.ok) {
            return res.status(usernameCheck.status).json({
                message: usernameCheck.message
            });
        }

        const passwordCheck =
            validatePassword(mat_khau);

        if (!passwordCheck.ok) {
            return res.status(passwordCheck.status).json({
                message: passwordCheck.message
            });
        }


        if (isEmpty(vai_tro)) {
            return res.status(400).json({
                message: "Vai trò là bắt buộc"
            });
        }

        if (vai_tro !== "NHAN_VIEN_Y_TE") {
            return res.status(403).json({
                message:
                    "Admin chỉ được tạo tài khoản NHÂN VIÊN Y TẾ"
            });
        }

        const coSoCheck =
            validateCoSoId(co_so_id);

        if (!coSoCheck.ok) {
            return res.status(coSoCheck.status).json({
                message: coSoCheck.message
            });
        }

        const result = await nguoiDungService.create({
            ten_dang_nhap,
            mat_khau,
            vai_tro,
            coSoId: coSoCheck.coSoId
        });

        if (!result.ok) {
            return res.status(result.status).json({
                message: result.message
            });
        }

        return res.json({
            message:
                "Thêm tài khoản nhân viên y tế thành công",
            id: result.id,
            ten_dang_nhap,
            vai_tro,
            co_so_id: coSoCheck.coSoId,
            ten_co_so: result.ten_co_so
        });

    } catch (err) {
        console.error(
            "Lỗi thêm user:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

async function update(req, res) {
    const { id } = req.params;

    try {
        let {
            ten_dang_nhap,
            vai_tro,
            co_so_id
        } = req.body;

        ten_dang_nhap =
            (ten_dang_nhap || "").toString();

        vai_tro =
            (vai_tro || "").toString();

        const userRows =
            await nguoiDungService.getUserById(id);

        if (userRows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy tài khoản"
            });
        }

        const targetUser = userRows[0];


        if (targetUser.vai_tro === "KHACH_HANG") {
            return res.status(403).json({
                message:
                    "Không được chỉnh sửa tài khoản khách hàng"
            });
        }


        if (targetUser.vai_tro === "ADMIN") {
            return res.status(403).json({
                message:
                    "Không chỉnh sửa tài khoản ADMIN tại chức năng này"
            });
        }


        if (targetUser.vai_tro !== "NHAN_VIEN_Y_TE") {
            return res.status(403).json({
                message:
                    "Chỉ được chỉnh sửa tài khoản nhân viên y tế"
            });
        }

        if (vai_tro !== targetUser.vai_tro) {
            return res.status(403).json({
                message:
                    "Không được phép thay đổi vai trò của tài khoản"
            });
        }


        const usernameCheck =
            validateUsername(ten_dang_nhap);

        if (!usernameCheck.ok) {
            return res.status(usernameCheck.status).json({
                message: usernameCheck.message
            });
        }


        const duplicateRows =
            await nguoiDungService.checkDuplicateUsername(
                ten_dang_nhap,
                id
            );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                message: "Tên đăng nhập đã tồn tại"
            });
        }

        const coSoCheck =
            validateCoSoId(co_so_id);

        if (!coSoCheck.ok) {
            return res.status(coSoCheck.status).json({
                message: coSoCheck.message
            });
        }

        const result = await nguoiDungService.update(
            id,
            ten_dang_nhap,
            coSoCheck.coSoId
        );

        if (!result.ok) {
            return res.status(result.status).json({
                message: result.message
            });
        }

        return res.json({
            message:
                "Cập nhật tài khoản nhân viên y tế thành công",
            id: Number(id),
            ten_dang_nhap,
            vai_tro: targetUser.vai_tro,
            trang_thai: targetUser.trang_thai,
            co_so_id: coSoCheck.coSoId,
            ten_co_so: result.ten_co_so
        });

    } catch (err) {
        console.error(
            "Lỗi cập nhật user:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

async function resetPassword(req, res) {
    const { id } = req.params;

    try {
        let { mat_khau } = req.body;

        mat_khau =
            (mat_khau || "").toString();

        const userRows =
            await nguoiDungService.getUserById(id);

        if (userRows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy tài khoản"
            });
        }

        const targetUser = userRows[0];

        const currentUserId = req.user.id;

        if (
            currentUserId &&
            String(currentUserId) ===
            String(targetUser.id)
        ) {
            return res.status(400).json({
                message:
                    "Không thể reset mật khẩu của chính tài khoản đang đăng nhập"
            });
        }

        const passwordCheck =
            validatePassword(mat_khau, true);

        if (!passwordCheck.ok) {
            return res.status(passwordCheck.status).json({
                message: passwordCheck.message
            });
        }

        await nguoiDungService.resetPassword(
            id,
            mat_khau
        );

        return res.json({
            message:
                `Reset mật khẩu cho tài khoản "${targetUser.ten_dang_nhap}" thành công`
        });

    } catch (err) {
        console.error(
            "Lỗi reset mật khẩu:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

async function lock(req, res) {
    const { id } = req.params;

    try {

        const myUserId = req.user.id;

        if (
            myUserId &&
            String(myUserId) === String(id)
        ) {
            return res.status(400).json({
                message:
                    "Không thể khóa chính tài khoản đang đăng nhập"
            });
        }

        const rows =
            await nguoiDungService.getUserRoleById(id);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy tài khoản"
            });
        }

        if (rows[0].vai_tro === "ADMIN") {
            return res.status(403).json({
                message:
                    "Không được phép khóa tài khoản ADMIN"
            });
        }

        const result =
            await nguoiDungService.lock(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    "Không tìm thấy tài khoản hoặc đã bị khóa"
            });
        }

        return res.json({
            message: "Đã khóa tài khoản thành công"
        });

    } catch (err) {
        console.error(
            "Lỗi khóa user:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

async function unlock(req, res) {
    const { id } = req.params;

    try {
        const result =
            await nguoiDungService.unlock(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    "Không tìm thấy tài khoản hoặc tài khoản đang hoạt động"
            });
        }

        return res.json({
            message: "Mở khóa tài khoản thành công"
        });

    } catch (err) {
        console.error(
            "Lỗi mở khóa user:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

module.exports = {
    register,
    getAll,
    create,
    update,
    resetPassword,
    lock,
    unlock
};
