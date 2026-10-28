const express = require("express");
const router = express.Router();
const profileController = require(
    "../controllers/thong-tin-ca-nhan.controller"
);
const { verifyToken } = require("../middlewares/jwt.middleware");

const {
    requireLogin,
    requireAdmin,
    requireSelfOrAdmin
} = require("../middlewares/thong-tin-ca-nhan.middleware");

router.get(
    "/:userId",
    verifyToken,
    requireLogin,
    requireSelfOrAdmin,
    profileController.getThongTinCaNhan
);

router.put(
    "/:userId",
    verifyToken,
    requireLogin,
    requireSelfOrAdmin,
    profileController.capNhatThongTinCaNhan
);

router.get(
    "/",
    verifyToken,
    requireAdmin,
    profileController.getDanhSachThongTinCaNhan
);

module.exports = router;
