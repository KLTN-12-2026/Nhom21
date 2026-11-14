const express = require("express");
const router = express.Router();
const reviewController = require(
    "../controllers/danh-gia.controller"
);

const {
    verifyToken,
    requireRole
} = require("../middlewares/jwt.middleware");

router.get(
    "/coso/:coSoId",
    reviewController.getReviewsByCoSo
);

router.post(
    "/",
    verifyToken,
    requireRole("KHACH_HANG"),
    reviewController.createOrUpdateReview
);

module.exports = router;
