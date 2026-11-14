const service = require("../services/kham-sang-loc.service");

// Ghi nhận kết quả khám sàng lọc lần đầu
async function saveScreening(req, res) {
    const result = await service.saveScreening(req);
    return res.status(result.status).json(result.body);
}

// Lấy kết quả khám sàng lọc
async function getScreening(req, res) {
    const result = await service.getScreening(req);
    return res.status(result.status).json(result.body);
}

// Điều chỉnh kết quả khám sàng lọc trước khi tiêm
async function updateScreening(req, res) {
    const result = await service.updateScreening(req);
    return res.status(result.status).json(result.body);
}

async function getScreeningHistory(req, res) {
    const result = await service.getScreeningHistory(req);
    return res.status(result.status).json(result.body);
}

module.exports = {
    saveScreening,
    getScreening,
    updateScreening,
    getScreeningHistory
};
