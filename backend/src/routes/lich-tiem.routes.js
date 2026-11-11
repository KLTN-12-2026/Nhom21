const express = require("express");
const router = express.Router();
const lichTiemController = require(
    "../controllers/lich-tiem.controller"
);

const {
    verifyToken,
    requireRole
} = require("../middlewares/jwt.middleware");

// I. QUẢN LÝ LỊCH TIÊM - ADMIN / NHÂN VIÊN Y TẾ

router.get(
    "/admin",
    verifyToken,
    requireRole("ADMIN", "NHAN_VIEN_Y_TE"),
    lichTiemController.getAdminSchedules
);

// ADMIN xem toàn bộ lịch sử đặt lịch của một khách hàng
router.get(
    "/admin/customer/:userId/history",
    verifyToken,
    requireRole("ADMIN"),
    lichTiemController.getCustomerAppointmentHistory
);

router.put(
    "/admin/:id/status",
    verifyToken,
    requireRole("ADMIN", "NHAN_VIEN_Y_TE"),
    lichTiemController.updateScheduleStatus
);

router.post(
    "/admin/:id/xac-nhan-tiem",
    verifyToken,
    requireRole("ADMIN", "NHAN_VIEN_Y_TE"),
    lichTiemController.confirmVaccination
);

// XEM CHI TIẾT LỊCH TIÊM
router.get(
    "/detail/:id",
    verifyToken,
    requireRole("ADMIN", "NHAN_VIEN_Y_TE", "KHACH_HANG"),
    lichTiemController.getScheduleDetail
);

// KHÁCH HÀNG QUẢN LÝ LỊCH TIÊM
router.get(
    "/:user_id",
    verifyToken,
    requireRole("KHACH_HANG"),
    lichTiemController.getUserSchedules
);

router.post(
    "/",
    verifyToken,
    requireRole("KHACH_HANG"),
    lichTiemController.createSchedule
);

// DUYỆT / HỦY LỊCH
router.put(
    "/duyet/:id",
    verifyToken,
    requireRole("ADMIN", "NHAN_VIEN_Y_TE"),
    lichTiemController.approveSchedule
);

router.put(
    "/huy/:id",
    verifyToken,
    requireRole("KHACH_HANG"),
    lichTiemController.cancelSchedule
);

module.exports = router;
