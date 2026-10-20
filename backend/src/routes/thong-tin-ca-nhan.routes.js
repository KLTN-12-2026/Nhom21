const express = require("express");
const router = express.Router();
const profileController = require(
    "../controllers/thong-tin-ca-nhan.controller"
);

const {
    requireLogin,
    requireAdmin,
    requireSelfOrAdmin
} = require("../middlewares/thong-tin-ca-nhan.middleware");

// =====================================================
// I. LẤY THÔNG TIN CÁ NHÂN
//
// GET /api/profile/:userId
//
// Người dùng:
// - Chỉ xem thông tin của chính mình.
//
// ADMIN:
// - Có thể xem thông tin người dùng khác.
// =====================================================

router.get(
    "/:userId",
    requireLogin,
    requireSelfOrAdmin,
    profileController.getThongTinCaNhan
);

// =====================================================
// II. CẬP NHẬT THÔNG TIN CÁ NHÂN
//
// PUT /api/profile/:userId
//
// Người dùng:
// - Chỉ cập nhật thông tin của chính mình.
//
// ADMIN:
// - Có thể cập nhật thông tin người dùng khác.
//
// Kiểm tra:
// - Họ tên
// - Ngày sinh
// - Giới tính
// - Số điện thoại
// - Email
// - Địa chỉ
// =====================================================

router.put(
    "/:userId",
    requireLogin,
    requireSelfOrAdmin,
    profileController.capNhatThongTinCaNhan
);

// =====================================================
// III. ADMIN - DANH SÁCH THÔNG TIN CÁ NHÂN
//
// GET /api/profile
//
// Chỉ ADMIN được truy cập.
// =====================================================

router.get(
    "/",
    requireAdmin,
    profileController.getDanhSachThongTinCaNhan
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
