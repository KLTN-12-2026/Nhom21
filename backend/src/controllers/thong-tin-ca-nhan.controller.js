
const profileService = require(
    "../services/thong-tin-ca-nhan.service"
);

// ======================================================
// 1. LẤY THÔNG TIN CÁ NHÂN
//
// GET /api/profile/:userId
//
// Quyền truy cập đã được kiểm tra tại Middleware:
// - Người dùng xem hồ sơ của mình.
// - ADMIN có thể xem hồ sơ người khác.
// ======================================================

async function getThongTinCaNhan(req, res) {

    const userId = Number(req.params.userId);

    try {

        const result =
            await profileService.getThongTinCaNhan(
                userId
            );

        return res
            .status(result.status || 200)
            .json(result.body);

    } catch (err) {

        console.error(
            "Lỗi truy vấn thông tin cá nhân:",
            err
        );

        return res.status(500).json({
            message:
                "Lỗi server khi lấy thông tin cá nhân"
        });
    }
}


// ======================================================
// 2. CẬP NHẬT THÔNG TIN CÁ NHÂN
//
// PUT /api/profile/:userId
//
// Service xử lý:
// - Ép kiểu dữ liệu.
// - Kiểm tra họ tên.
// - Kiểm tra ngày sinh.
// - Kiểm tra giới tính.
// - Kiểm tra số điện thoại.
// - Kiểm tra email.
// - Kiểm tra địa chỉ.
// - INSERT hoặc UPDATE vào MySQL.
// ======================================================

async function capNhatThongTinCaNhan(req, res) {

    const userId = Number(req.params.userId);

    const {
        ho_ten,
        ngay_sinh,
        gioi_tinh,
        so_dien_thoai,
        dia_chi,
        email
    } = req.body;

    // ==================================================
    // 2.1. KIỂM TRA DỮ LIỆU
    //
    // Trong code gốc, validation nằm trước try/catch
    // truy vấn Database.
    // ==================================================

    const validationResult =
        profileService.validateThongTinCaNhan({
            ho_ten,
            ngay_sinh,
            gioi_tinh,
            so_dien_thoai,
            dia_chi,
            email
        });

    if (!validationResult.valid) {

        return res.status(400).json({
            message: validationResult.message
        });
    }

    // ==================================================
    // 2.2. LƯU THÔNG TIN VÀO DATABASE
    // ==================================================

    try {

        const result =
            await profileService.capNhatThongTinCaNhan(
                userId,
                validationResult.data
            );

        return res
            .status(result.status || 200)
            .json(result.body);

    } catch (err) {

        console.error(
            "Lỗi cập nhật thông tin cá nhân:",
            err
        );

        return res.status(500).json({
            message:
                "Lỗi server khi cập nhật thông tin cá nhân"
        });
    }
}


// ======================================================
// 3. ADMIN - DANH SÁCH THÔNG TIN CÁ NHÂN
//
// GET /api/profile
//
// Middleware requireAdmin đã kiểm tra quyền.
// ======================================================

async function getDanhSachThongTinCaNhan(req, res) {

    try {

        const result =
            await profileService.getDanhSachThongTinCaNhan();

        return res
            .status(result.status || 200)
            .json(result.body);

    } catch (err) {

        console.error(
            "Lỗi lấy danh sách thông tin cá nhân:",
            err
        );

        return res.status(500).json({
            message:
                "Lỗi server khi lấy danh sách thông tin cá nhân"
        });
    }
}


// ======================================================
// EXPORT CONTROLLER
// ======================================================

module.exports = {
    getThongTinCaNhan,
    capNhatThongTinCaNhan,
    getDanhSachThongTinCaNhan
};
