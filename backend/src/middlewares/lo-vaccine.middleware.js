function getAuthInfo(req) {
    return {
        userId: req.user?.id,
        role: req.user?.vai_tro
    };
}
// KIỂM TRA QUYỀN ADMIN
function requireAdmin(req, res, next) {
    const auth = getAuthInfo(req);

    if (!auth.userId || !auth.role) {
        return res.status(401).json({
            message: "Bạn chưa đăng nhập."
        });
    }

    if (auth.role !== "ADMIN") {
        return res.status(403).json({
            message: "Bạn không có quyền thực hiện chức năng này."
        });
    }

    next();
}

// KIỂM TRA SỐ NGUYÊN DƯƠNG
function isPositiveInteger(value) {
    const number = Number(value);

    return Number.isInteger(number) && number > 0;
}

// KIỂM TRA NGÀY YYYY-MM-DD
function isValidDateString(value) {
    if (typeof value !== "string") {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value
        .split("-")
        .map(Number);

    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

// LẤY NGÀY HÔM NAY
function getTodayString() {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function validateLotFilters(req, res, next) {
    const vaccineId = req.query.vaccine_id;
    const coSoId = req.query.co_so_id;

    if (
        vaccineId !== undefined &&
        vaccineId !== "" &&
        !isPositiveInteger(vaccineId)
    ) {
        return res.status(400).json({
            message: "vaccine_id không hợp lệ."
        });
    }

    if (
        coSoId !== undefined &&
        coSoId !== "" &&
        !isPositiveInteger(coSoId)
    ) {
        return res.status(400).json({
            message: "co_so_id không hợp lệ."
        });
    }

    next();
}

function validateLotId(req, res, next) {
    const lotId = req.params.id;

    if (!isPositiveInteger(lotId)) {
        return res.status(400).json({
            message: "ID lô vaccine không hợp lệ."
        });
    }

    next();
}

function validateCreateLot(req, res, next) {
    const {
        vaccine_id,
        co_so_id,
        ma_lo,
        so_luong_nhap,
        han_su_dung
    } = req.body;

    // ==========================================
    // VALIDATE VACCINE
    if (!isPositiveInteger(vaccine_id)) {
        return res.status(400).json({
            message: "Vaccine không hợp lệ."
        });
    }

    // VALIDATE CƠ SỞ TIÊM
    if (!isPositiveInteger(co_so_id)) {
        return res.status(400).json({
            message: "Cơ sở tiêm không hợp lệ."
        });
    }

    // VALIDATE MÃ LÔ
    if (
        typeof ma_lo !== "string" ||
        !ma_lo.trim()
    ) {
        return res.status(400).json({
            message: "Vui lòng nhập mã lô vaccine."
        });
    }

    const cleanMaLo = ma_lo.trim();

    if (cleanMaLo.length > 50) {
        return res.status(400).json({
            message: "Mã lô vaccine không được vượt quá 50 ký tự."
        });
    }

    if (!/^[A-Za-z0-9_-]+$/.test(cleanMaLo)) {
        return res.status(400).json({
            message:
                "Mã lô vaccine chỉ được chứa chữ không dấu, số, dấu - và _."
        });
    }

    // VALIDATE SỐ LƯỢNG NHẬP
    if (!isPositiveInteger(so_luong_nhap)) {
        return res.status(400).json({
            message: "Số lượng nhập phải là số nguyên lớn hơn 0."
        });
    }

    // VALIDATE HẠN SỬ DỤNG
    if (!isValidDateString(han_su_dung)) {
        return res.status(400).json({
            message: "Hạn sử dụng không hợp lệ."
        });
    }

    if (han_su_dung <= getTodayString()) {
        return res.status(400).json({
            message: "Hạn sử dụng phải lớn hơn ngày hiện tại."
        });
    }
    // DỮ LIỆU ĐÃ VALIDATE
    req.validatedLot = {
        vaccine_id: Number(vaccine_id),
        co_so_id: Number(co_so_id),
        ma_lo: cleanMaLo,
        so_luong_nhap: Number(so_luong_nhap),
        han_su_dung
    };

    next();
}

module.exports = {
    getAuthInfo,
    requireAdmin,
    isPositiveInteger,
    isValidDateString,
    getTodayString,
    validateLotFilters,
    validateLotId,
    validateCreateLot
};
