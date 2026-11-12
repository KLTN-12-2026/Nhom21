const express = require("express");
const router = express.Router();
const loVaccineController = require("../controllers/lo-vaccine.controller");

const {
    verifyToken,
    requireRole
} = require("../middlewares/jwt.middleware");

const {
    validateLotId,
    validateCreateLot,
    validateLotFilters
} = require("../middlewares/lo-vaccine.middleware");

// Lấy danh sách lô vaccine.
router.get(
    "/",
    validateLotFilters,
    loVaccineController.getLots
);

// ADMIN thêm lô vaccine mới.
router.post(
    "/",
    verifyToken,
    requireRole("ADMIN"),
    validateCreateLot,
    loVaccineController.createLot
);


// ADMIN ngừng sử dụng lô vaccine.
router.patch(
    "/:id/stop",
    verifyToken,
    requireRole("ADMIN"),
    validateLotId,
    loVaccineController.stopLot
);

module.exports = router;
