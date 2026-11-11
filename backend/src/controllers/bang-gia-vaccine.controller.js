const priceService = require(
    "../services/bang-gia-vaccine.service"
);
const {
    isValidId,
    validatePricePayload
} = require(
    "../middlewares/bang-gia-vaccine.middleware"
);

// LẤY BẢNG GIÁ MỚI NHẤT CỦA TỪNG VACCINE
async function getAll(req, res) {
    try {

        const rows = await priceService.getAll();

        return res.json(rows);

    } catch (err) {

        console.error(
            "LỖI LẤY DANH SÁCH BẢNG GIÁ:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server khi lấy bảng giá"
        });
    }
}

// XEM TOÀN BỘ LỊCH SỬ GIÁ
// VACCINE NGUNG VẪN ĐƯỢC XEM LỊCH SỬ
async function getHistory(req, res) {
    try {

        const vaccineId = Number(
            req.params.vaccineId
        );

        if (
            !Number.isInteger(vaccineId) ||
            vaccineId <= 0
        ) {
            return res.status(400).json({
                message: "Vaccine không hợp lệ"
            });
        }

        // KIỂM TRA VACCINE TỒN TẠI
        const checkVaccine =
            await priceService.getVaccineById(
                vaccineId
            );

        if (checkVaccine.length === 0) {
            return res.status(404).json({
                message: "Vaccine không tồn tại"
            });
        }

        // LẤY LỊCH SỬ GIÁ
        const rows = await priceService.getHistory(
            vaccineId
        );

        return res.json(rows);

    } catch (err) {

        console.error(
            "LỖI LẤY LỊCH SỬ GIÁ:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server khi lấy lịch sử giá"
        });
    }
}

// THÊM BẢNG GIÁ MỚI
async function create(req, res) {
    try {

        // VALIDATE DỮ LIỆU
        const validated = validatePricePayload(
            req.body
        );

        if (!validated.ok) {
            return res.status(400).json({
                message: validated.message
            });
        }

        // GỌI SERVICE THÊM GIÁ
        const result = await priceService.create(
            validated.data
        );

        // XỬ LÝ KẾT QUẢ NGHIỆP VỤ
        if (!result.ok) {
            return res.status(result.status).json({
                message: result.message
            });
        }

        return res.status(201).json({
            message: "Thêm bảng giá thành công",
            id: result.id
        });

    } catch (err) {

        console.error(
            "LỖI THÊM BẢNG GIÁ:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server khi thêm bảng giá"
        });
    }
}

// ĐỔI GIÁ VACCINE
// KHÔNG UPDATE TRỰC TIẾP GIÁ CŨ
// GIỮ NGUYÊN LỊCH SỬ GIÁ

async function update(req, res) {
    try {

        const id = Number(req.params.id);

        // KIỂM TRA ID BẢNG GIÁ
        if (!isValidId(id)) {
            return res.status(400).json({
                message: "ID bảng giá không hợp lệ"
            });
        }

        // VALIDATE DỮ LIỆU
        const validated = validatePricePayload(
            req.body
        );

        if (!validated.ok) {
            return res.status(400).json({
                message: validated.message
            });
        }

        // GỌI SERVICE ĐỔI GIÁ
        const result = await priceService.update(
            id,
            validated.data
        );


        // XỬ LÝ KẾT QUẢ NGHIỆP VỤ
        if (!result.ok) {
            return res.status(result.status).json({
                message: result.message
            });
        }

        return res.json({
            message: "Đổi giá thành công",
            id: result.id
        });

    } catch (err) {

        console.error(
            "LỖI ĐỔI GIÁ:",
            err
        );

        return res.status(500).json({
            message: "Lỗi server khi đổi giá"
        });
    }
}

module.exports = {
    getAll,
    getHistory,
    create,
    update
};
