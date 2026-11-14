
const express = require("express");
const router = express.Router();
const khamSangLocController = require(
    "../controllers/kham-sang-loc.controller"
);

const {
    verifyToken,
    requireRole
} = require("../middlewares/jwt.middleware");

router.post(
    "/",
    verifyToken,
    requireRole("ADMIN", "NHAN_VIEN_Y_TE"),
    khamSangLocController.saveScreening
);

router.get(
    "/:lichTiemId",
    verifyToken,
    requireRole("ADMIN", "NHAN_VIEN_Y_TE", "KHACH_HANG"),
    khamSangLocController.getScreening
);

router.patch(
    "/:lichTiemId",
    verifyToken,
    requireRole("NHAN_VIEN_Y_TE"),
    khamSangLocController.updateScreening
);

router.get(
    "/:lichTiemId/lich-su",
    verifyToken,
    requireRole("ADMIN"),
    khamSangLocController.getScreeningHistory
);

module.exports = router;
