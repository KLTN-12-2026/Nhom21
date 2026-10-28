const express = require("express");
const router = express.Router();

const xacThucController = require("../controllers/xac-thuc.controller");
const { verifyToken } = require("../middlewares/jwt.middleware");
router.post(
    "/login",
    xacThucController.login
);

router.post(
    "/send-otp",
    xacThucController.sendOtp
);

router.post(
    "/register",
    xacThucController.register
);

router.post(
    "/quen-mat-khau/gui-otp",
    xacThucController.sendForgotPasswordOtp
);


router.post(
    "/quen-mat-khau/dat-lai",
    xacThucController.resetPassword
);

router.put(
    "/change-password",
    verifyToken,
    xacThucController.changePassword
);

router.post(
    "/dang-ky-email/gui-otp",
    xacThucController.sendRegisterEmailOtp
);

router.post(
    "/quen-mat-khau-sdt/gui-otp",
    xacThucController.sendForgotPasswordPhoneOtp
);

router.post(
    "/quen-mat-khau-sdt/dat-lai",
    xacThucController.resetPasswordByPhone
);

module.exports = router;
