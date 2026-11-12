const loVaccineService = require("../services/lo-vaccine.service");
async function getLots(req, res) {
    try {
        const vaccineId = req.query.vaccine_id;
        const coSoId = req.query.co_so_id;

        const lots = await loVaccineService.getLots(
            vaccineId,
            coSoId
        );

        return res.json(lots);

    } catch (error) {
        console.error(
            "Lỗi GET /api/lo-vaccine:",
            error
        );

        return res.status(500).json({
            message: "Không thể tải danh sách lô vaccine."
        });
    }
}

async function createLot(req, res) {
    try {
        const data = req.validatedLot;

        const result = await loVaccineService.createLot(data);
        // VACCINE KHÔNG TỒN TẠI

        if (result.status === "VACCINE_NOT_FOUND") {
            return res.status(404).json({
                message: "Không tìm thấy vaccine."
            });
        }
        // VACCINE ĐÃ NGỪNG SỬ DỤNG

        if (result.status === "VACCINE_STOPPED") {
            return res.status(400).json({
                message:
                    "Vaccine này đã ngừng sử dụng. " +
                    "Không thể nhập thêm lô mới."
            });
        }
        // CƠ SỞ TIÊM KHÔNG TỒN TẠI
        if (result.status === "FACILITY_NOT_FOUND") {
            return res.status(404).json({
                message: "Không tìm thấy cơ sở tiêm."
            });
        }
        // CƠ SỞ TIÊM KHÔNG HOẠT ĐỘNG
        if (result.status === "FACILITY_INACTIVE") {
            return res.status(400).json({
                message:
                    "Cơ sở tiêm này đang tạm dừng. " +
                    "Không thể nhập lô vaccine mới."
            });
        }
        // TRÙNG MÃ LÔ
        if (result.status === "DUPLICATE") {
            return res.status(409).json({
                message:
                    "Mã lô vaccine này đã tồn tại đối với vaccine đã chọn."
            });
        }
        return res.status(201).json({
            message: "Thêm lô vaccine thành công.",
            data: result.data
        });

    } catch (error) {
        console.error(
            "Lỗi POST /api/lo-vaccine:",
            error
        );

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message:
                    "Mã lô vaccine này đã tồn tại đối với vaccine đã chọn."
            });
        }

        return res.status(500).json({
            message: "Không thể thêm lô vaccine."
        });
    }
}

async function stopLot(req, res) {
    try {
        const { id } = req.params;

        const result = await loVaccineService.stopLot(id);

        // KHÔNG TÌM THẤY LÔ
        if (result.status === "NOT_FOUND") {
            return res.status(404).json({
                message: "Không tìm thấy lô vaccine."
            });
        }
        // LÔ ĐÃ NGỪNG
        if (result.status === "ALREADY_STOPPED") {
            return res.status(400).json({
                message: "Lô vaccine này đã ngừng sử dụng."
            });
        }
        // LÔ ĐÃ HẾT HÀNG
        if (result.status === "OUT_OF_STOCK") {
            return res.status(400).json({
                message: "Lô vaccine này đã hết hàng."
            });
        }
        // LÔ ĐÃ HẾT HẠN

        if (result.status === "EXPIRED") {
            return res.status(400).json({
                message: "Lô vaccine này đã hết hạn."
            });
        }

        // LÔ KHÔNG Ở TRẠNG THÁI ĐANG SỬ DỤNG

        if (result.status === "INVALID_STATUS") {
            return res.status(400).json({
                message:
                    "Lô vaccine này không còn ở trạng thái đang sử dụng."
            });
        }
        // NGỪNG LÔ THÀNH CÔNG
        return res.json({
            message: "Ngừng sử dụng lô vaccine thành công."
        });

    } catch (error) {
        console.error(
            "Lỗi PATCH /api/lo-vaccine/:id/stop:",
            error
        );

        return res.status(500).json({
            message: "Không thể ngừng sử dụng lô vaccine."
        });
    }
}

module.exports = {
    getLots,
    createLot,
    stopLot
};
