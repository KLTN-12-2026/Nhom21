const express = require("express");
const router = express.Router();

const cosoController = require("../controllers/coso.controller");
const {
    verifyToken,
    requireRole
} = require("../middlewares/jwt.middleware");

const {
    uploadSingleImage
} = require("../middlewares/coso-upload.middleware");

// Lấy danh sách cơ sở tiêm
router.get(
    "/",
    cosoController.getAll
);


// Xem chi tiết cơ sở tiêm
router.get(
    "/:id",
    cosoController.getById
);

// ADMIN thêm cơ sở tiêm
router.post(
    "/",
    verifyToken,
    requireRole("ADMIN"),
    uploadSingleImage,
    cosoController.create
);

// ADMIN cập nhật cơ sở tiêm
router.put(
    "/:id",
    verifyToken,
    requireRole("ADMIN"),
    uploadSingleImage,
    cosoController.update
);

// ADMIN tạm dừng cơ sở tiêm
router.patch(
    "/:id/stop",
    verifyToken,
    requireRole("ADMIN"),
    cosoController.stop
);

// ADMIN kích hoạt lại cơ sở tiêm
router.patch(
    "/:id/activate",
    verifyToken,
    requireRole("ADMIN"),
    cosoController.activate
);

module.exports = router;
