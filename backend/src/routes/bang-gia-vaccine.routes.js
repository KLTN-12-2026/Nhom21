const express = require("express");
const router = express.Router();
const priceController = require(
    "../controllers/bang-gia-vaccine.controller"
);

const {
    requireAdmin
} = require(
    "../middlewares/bang-gia-vaccine.middleware"
);

const {
    verifyToken,
    requireRole
} = require(
    "../middlewares/jwt.middleware"
);

// LẤY DANH SÁCH BẢNG GIÁ MỚI NHẤT
// TẤT CẢ NGƯỜI DÙNG ĐỀU ĐƯỢC XEM
router.get(
    "/",
    priceController.getAll
);

// XEM LỊCH SỬ GIÁ CỦA VACCINE
// CHỈ ADMIN
router.get(
    "/history/:vaccineId",
    verifyToken,
    requireRole("ADMIN"),
    requireAdmin,
    priceController.getHistory
);

// THÊM BẢNG GIÁ MỚI
// CHỈ ADMIN
router.post(
    "/",
    verifyToken,
    requireRole("ADMIN"),
    requireAdmin,
    priceController.create
);

// ĐỔI GIÁ VACCINE
// CHỈ ADMIN
router.put(
    "/:id",
    verifyToken,
    requireRole("ADMIN"),
    requireAdmin,
    priceController.update
);

module.exports = router;
