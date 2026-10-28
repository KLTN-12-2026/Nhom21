const express = require("express");
const router = express.Router();

const tongQuanController = require(
    "../controllers/tong-quan.controller"
);

const {
    verifyToken
} = require(
    "../middlewares/jwt.middleware"
);

router.get(
    "/overview",
    verifyToken,
    tongQuanController.getDashboardOverview
);


module.exports = router;
