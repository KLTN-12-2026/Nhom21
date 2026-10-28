const express = require("express");

const router = express.Router();

const nguoiDungController = require(
    "../controllers/nguoi-dung.controller"
);

const {
    verifyToken,
    requireRole
} = require("../middlewares/jwt.middleware");


router.post(
    "/register",
    nguoiDungController.register
);

router.get(
    "/",
    verifyToken,
    requireRole("ADMIN"),
    nguoiDungController.getAll
);

router.post(
    "/",
    verifyToken,
    requireRole("ADMIN"),
    nguoiDungController.create
);


router.put(
    "/:id",
    verifyToken,
    requireRole("ADMIN"),
    nguoiDungController.update
);

router.patch(
    "/:id/reset-password",
    verifyToken,
    requireRole("ADMIN"),
    nguoiDungController.resetPassword
);

router.delete(
    "/:id",
    verifyToken,
    requireRole("ADMIN"),
    nguoiDungController.lock
);

router.patch(
    "/:id/unlock",
    verifyToken,
    requireRole("ADMIN"),
    nguoiDungController.unlock
);

module.exports = router;
