const reviewService = require(
    "../services/danh-gia.service"
);
const {
    isValidPositiveInt,
    validateReviewPayload
} = require(
    "../middlewares/danh-gia.middleware"
);

async function getReviewsByCoSo(req, res) {
    const coSoId = Number(req.params.coSoId);

    if (!isValidPositiveInt(coSoId)) {
        return res.status(400).json({
            message: "Cơ sở không hợp lệ"
        });
    }

    try {
        const reviews =
            await reviewService.getReviewsByCoSo(
                coSoId
            );

        const summary =
            await reviewService.getReviewSummary(
                coSoId
            );

        return res.json({
            summary,
            reviews: Array.isArray(reviews)
                ? reviews
                : []
        });

    } catch (err) {
        console.error(
            "Lỗi lấy đánh giá cơ sở:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server khi lấy đánh giá cơ sở"
        });
    }
}

async function createOrUpdateReview(req, res) {
    const userId = Number(req.user?.id);

    if (!isValidPositiveInt(userId)) {
        return res.status(401).json({
            message: "Bạn chưa đăng nhập"
        });
    }

    const validated = validateReviewPayload(
        req.body
    );

    if (!validated.ok) {
        return res.status(400).json({
            message: validated.message
        });
    }

    const {
        co_so_id,
        so_sao,
        nhan_xet
    } = validated.data;

    try {
        const currentUser =
            await reviewService.getUserById(
                userId
            );

        if (!currentUser) {
            return res.status(401).json({
                message: "Tài khoản không tồn tại"
            });
        }

        if (
            currentUser.vai_tro !== "KHACH_HANG"
        ) {
            return res.status(403).json({
                message: "Chỉ khách hàng mới được đánh giá cơ sở"
            });
        }

        const hasVaccinated =
            await reviewService.hasVaccinatedAtCoSo(
                userId,
                co_so_id
            );

        if (!hasVaccinated) {
            return res.status(403).json({
                message: "Bạn chỉ có thể đánh giá cơ sở sau khi đã tiêm tại cơ sở này"
            });
        }

        const existingReview =
            await reviewService.getExistingReview(
                co_so_id,
                userId
            );

        if (existingReview) {
            await reviewService.updateReview(
                co_so_id,
                userId,
                so_sao,
                nhan_xet
            );

            return res.json({
                message: "Cập nhật đánh giá thành công"
            });
        }
        await reviewService.createReview(
            co_so_id,
            userId,
            so_sao,
            nhan_xet
        );

        return res.status(201).json({
            message: "Gửi đánh giá thành công"
        });

    } catch (err) {
        console.error(
            "Lỗi gửi đánh giá:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server khi gửi đánh giá"
        });
    }
}

module.exports = {
    getReviewsByCoSo,
    createOrUpdateReview
};