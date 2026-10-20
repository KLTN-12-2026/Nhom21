const express = require("express");
const router = express.Router();

// =====================================================
// IMPORT CONTROLLER
// =====================================================

const tongQuanController = require(
    "../controllers/tong-quan.controller"
);

// =====================================================
// IMPORT MIDDLEWARE
// =====================================================

const {
    requireCurrentUser
} = require(
    "../middlewares/tong-quan.middleware"
);

// =====================================================
// 1. API TỔNG QUAN DASHBOARD
//
// GET /api/dashboard/overview
//
// ADMIN:
// - Tổng tài khoản
// - Tổng vaccine
// - Tổng cơ sở tiêm
// - Tổng lịch tiêm
// - Hoàn tiền chờ xử lý
//
// NHAN_VIEN_Y_TE:
// - Lịch tiêm hôm nay
// - Lịch chờ xử lý
// - Lịch hoàn thành
// - Lịch cần nhắc
//
// KHACH_HANG:
// - Lịch tiêm sắp tới
// - Mũi đã tiêm
// - Tổng lịch sử tiêm
// =====================================================

router.get(
    "/overview",
    requireCurrentUser,
    tongQuanController.getDashboardOverview
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
