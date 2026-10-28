
const profileService = require(
    "../services/thong-tin-ca-nhan.service"
);

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

module.exports = {
    getThongTinCaNhan,
    capNhatThongTinCaNhan,
    getDanhSachThongTinCaNhan
};
