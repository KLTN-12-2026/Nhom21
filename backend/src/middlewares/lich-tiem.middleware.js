const lichTiemService = require(
    "../services/lich-tiem.service"
);

function sendResult(res, result) {
    const status = result.status || 200;

    return res.status(status).json(result.body);
}
// ADMIN / NHÂN VIÊN Y TẾ
// LẤY DANH SÁCH LỊCH TIÊM

async function getAdminSchedules(req, res) {
    try {
        const result =
            await lichTiemService.getAdminSchedules(
                req
            );

        return sendResult(res, result);

    } catch (err) {
        console.error(
            "Lỗi lấy danh sách lịch tiêm:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}
//ADMIN - XEM LỊCH SỬ ĐẶT LỊCH CỦA KHÁCH HÀNG


async function getCustomerAppointmentHistory(req, res) {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: "ID khách hàng không hợp lệ"
            });
        }

        const result =
            await lichTiemService.getCustomerAppointmentHistory(
                req
            );

        return sendResult(res, result);

    } catch (err) {
        console.error(
            "Lỗi lấy lịch sử đặt lịch của khách hàng:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server khi lấy lịch sử đặt lịch"
        });
    }
}
// DUYỆT / HỦY LỊCH TIÊM

async function updateScheduleStatus(req, res) {
    try {
        const result =
            await lichTiemService.updateScheduleStatus(
                req
            );

        return sendResult(res, result);

    } catch (err) {
        console.error(
            "Lỗi cập nhật trạng thái lịch:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}
// XÁC NHẬN ĐÃ TIÊM

async function confirmVaccination(req, res) {
    try {
        const result =
            await lichTiemService.confirmVaccination(
                req
            );

        return sendResult(res, result);

    } catch (err) {
        console.error(
            "Lỗi xác nhận đã tiêm:",
            err
        );

        return res.status(500).json({
            message:
                "Lỗi server khi xác nhận đã tiêm"
        });
    }
}

async function getScheduleDetail(req, res) {
    try {
        const result =
            await lichTiemService.getScheduleDetail(
                req
            );

        return sendResult(res, result);

    } catch (err) {
        console.error(
            "Lỗi lấy chi tiết lịch tiêm:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

// KHÁCH HÀNG
// XEM LỊCH TIÊM CỦA TÀI KHOẢN

async function getUserSchedules(req, res) {
    try {
        const result =
            await lichTiemService.getUserSchedules(
                req
            );

        return sendResult(res, result);

    } catch (err) {
        console.error(
            "Lỗi lấy lịch của user:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

async function createSchedule(req, res) {
    try {
        const result =
            await lichTiemService.createSchedule(
                req
            );

        return sendResult(res, result);

    } catch (err) {
        console.error(
            "Lỗi đặt lịch tiêm:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

async function approveSchedule(req, res) {
    try {
        const result =
            await lichTiemService.approveSchedule(
                req
            );

        return sendResult(res, result);

    } catch (err) {
        console.error(
            "Lỗi duyệt lịch:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}

async function cancelSchedule(req, res) {
    try {
        const result =
            await lichTiemService.cancelSchedule(
                req
            );

        return sendResult(res, result);

    } catch (err) {
        console.error(
            "Lỗi hủy lịch:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server"
        });
    }
}


module.exports = {
    getAdminSchedules,
    getCustomerAppointmentHistory,
    updateScheduleStatus,
    confirmVaccination,
    getScheduleDetail,
    getUserSchedules,
    createSchedule,
    approveSchedule,
    cancelSchedule
};