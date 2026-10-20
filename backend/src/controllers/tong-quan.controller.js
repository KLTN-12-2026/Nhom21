
const tongQuanService = require(
    "../services/tong-quan.service"
);

// =====================================================
// 1. API TỔNG QUAN DASHBOARD
//
// GET /api/dashboard/overview
//
// ADMIN:
// - Thống kê toàn hệ thống.
//
// NHAN_VIEN_Y_TE:
// - Thống kê theo cơ sở được phân công.
//
// KHACH_HANG:
// - Thống kê lịch tiêm và hồ sơ cá nhân.
// =====================================================

async function getDashboardOverview(req, res) {

    try {

        // =============================================
        // 1.1. LẤY NGƯỜI DÙNG ĐÃ ĐƯỢC XÁC THỰC
        // =============================================

        const user = req.currentUser;

        let stats;

        // =============================================
        // 1.2. XỬ LÝ THEO VAI TRÒ
        // =============================================

        switch (user.vai_tro) {

            // =========================================
            // ADMIN
            // =========================================

            case "ADMIN":

                stats =
                    await tongQuanService.getAdminOverview();

                break;

            // =========================================
            // NHÂN VIÊN Y TẾ
            // =========================================

            case "NHAN_VIEN_Y_TE":

                stats =
                    await tongQuanService.getStaffOverview(
                        user.id
                    );

                break;

            // =========================================
            // KHÁCH HÀNG
            // =========================================

            case "KHACH_HANG":

                stats =
                    await tongQuanService.getCustomerOverview(
                        user.id
                    );

                break;

            // =========================================
            // VAI TRÒ KHÔNG ĐƯỢC HỖ TRỢ
            // =========================================

            default:

                return res.status(403).json({
                    message:
                        "Vai trò không được hỗ trợ"
                });
        }

        // =============================================
        // 1.3. TRẢ DỮ LIỆU THỐNG KÊ
        // =============================================

        return res.status(200).json(stats);

    } catch (error) {

        console.error(
            "Lỗi Dashboard Overview:",
            error
        );

        return res
            .status(error.status || 500)
            .json({
                message: error.status
                    ? error.message
                    : "Không thể lấy dữ liệu tổng quan"
            });
    }
}

// =====================================================
// 2. XỬ LÝ LỖI TỪ MIDDLEWARE
//
// Middleware sử dụng next(error).
// Hàm này giữ nguyên phản hồi lỗi của Route gốc.
// =====================================================

function handleDashboardError(
    error,
    req,
    res,
    next
) {

    console.error(
        "Lỗi Dashboard Overview:",
        error
    );

    return res
        .status(error.status || 500)
        .json({
            message: error.status
                ? error.message
                : "Không thể lấy dữ liệu tổng quan"
        });
}

// =====================================================
// EXPORT CONTROLLER
// =====================================================

module.exports = {
    getDashboardOverview,
    handleDashboardError
};
