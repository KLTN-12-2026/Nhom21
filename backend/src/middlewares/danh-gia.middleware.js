function getAuthInfo(req) {
    const userId = Number(req.user?.id);
    return { userId };
}

function isEmpty(value) {
    return value === undefined ||
        value === null ||
        String(value).trim() === "";
}

function isValidPositiveInt(value) {
    return Number.isInteger(value) && value > 0;
}

function validateReviewPayload(body) {
    const coSoId = Number(body?.co_so_id);
    const soSao = Number(body?.so_sao);

    const nhanXet = isEmpty(body?.nhan_xet)
        ? null
        : String(body.nhan_xet).trim();

    if (!isValidPositiveInt(coSoId)) {
        return {
            ok: false,
            message: "Cơ sở không hợp lệ"
        };
    }

    if (
        !Number.isInteger(soSao) ||
        soSao < 1 ||
        soSao > 5
    ) {
        return {
            ok: false,
            message: "Số sao phải từ 1 đến 5"
        };
    }

    if (nhanXet && nhanXet.length > 150) {
        return {
            ok: false,
            message: "Nhận xét không được vượt quá 150 ký tự"
        };
    }

    return {
        ok: true,
        data: {
            co_so_id: coSoId,
            so_sao: soSao,
            nhan_xet: nhanXet
        }
    };
}

module.exports = {
    getAuthInfo,
    isValidPositiveInt,
    validateReviewPayload
};