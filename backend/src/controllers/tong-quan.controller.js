
const tongQuanService = require(
    "../services/tong-quan.service"
);

async function getDashboardOverview(req, res) {

    try {
        const user = req.user;

        let stats;

        switch (user.vai_tro) {


            case "ADMIN":

                stats =
                    await tongQuanService.getAdminOverview();

                break;

            case "NHAN_VIEN_Y_TE":

                stats =
                    await tongQuanService.getStaffOverview(
                        user.id
                    );

                break;

            case "KHACH_HANG":

                stats =
                    await tongQuanService.getCustomerOverview(
                        user.id
                    );

                break;

            default:

                return res.status(403).json({
                    message:
                        "Vai trò không được hỗ trợ"
                });
        }

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


module.exports = {
    getDashboardOverview,
    handleDashboardError
};
