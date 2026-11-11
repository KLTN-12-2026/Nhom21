function requireAdmin(req, res, next) {
    const role = req.user?.vai_tro;

    if (role !== "ADMIN") {
        return res.status(403).json({
            message: "Bạn không có quyền ADMIN!"
        });
    }

    next();
}

// HÀM KIỂM TRA GIÁ TRỊ RỖNG
function isEmpty(value) {
    return (
        value === undefined ||
        value === null ||
        value === ""
    );
}

// HÀM KIỂM TRA ID
function isValidId(id) {
    const value = Number(id);

    return Number.isInteger(value) && value > 0;
}

// VALIDATE DỮ LIỆU BẢNG GIÁ
function validatePricePayload({
    vaccine_id,
    gia_ban,
    gia_uu_dai
}) {

    // KIỂM TRA VACCINE
    if (isEmpty(vaccine_id)) {
        return {
            ok: false,
            message: "Vui lòng chọn vaccine"
        };
    }

    // KIỂM TRA GIÁ BÁN
    if (isEmpty(gia_ban)) {
        return {
            ok: false,
            message: "Giá bán là bắt buộc"
        };
    }

    const vaccineIdNum = Number(vaccine_id);
    const giaBanNum = Number(gia_ban);

    const giaUuDaiNum =
        gia_uu_dai === undefined ||
            gia_uu_dai === null ||
            gia_uu_dai === ""
            ? null
            : Number(gia_uu_dai);

    // VALIDATE ID VACCINE
    if (
        !Number.isInteger(vaccineIdNum) ||
        vaccineIdNum <= 0
    ) {
        return {
            ok: false,
            message: "Vaccine không hợp lệ"
        };
    }
    // VALIDATE GIÁ BÁN

    if (
        !Number.isInteger(giaBanNum) ||
        giaBanNum <= 0
    ) {
        return {
            ok: false,
            message:
                "Giá bán phải là số nguyên dương lớn hơn 0"
        };
    }

    if (giaBanNum > 100000000) {
        return {
            ok: false,
            message:
                "Giá bán không được vượt quá 100.000.000"
        };
    }

    // VALIDATE GIÁ ƯU ĐÃI
    if (giaUuDaiNum !== null) {

        if (
            !Number.isInteger(giaUuDaiNum) ||
            giaUuDaiNum <= 0
        ) {
            return {
                ok: false,
                message:
                    "Giá ưu đãi phải là số nguyên dương lớn hơn 0"
            };
        }

        if (giaUuDaiNum >= giaBanNum) {
            return {
                ok: false,
                message:
                    "Giá ưu đãi phải nhỏ hơn giá bán"
            };
        }

        if (giaUuDaiNum > 100000000) {
            return {
                ok: false,
                message:
                    "Giá ưu đãi không được vượt quá 100.000.000"
            };
        }
    }
    return {
        ok: true,
        data: {
            vaccine_id: vaccineIdNum,
            gia_ban: giaBanNum,
            gia_uu_dai: giaUuDaiNum
        }
    };
}

module.exports = {
    requireAdmin,
    isEmpty,
    isValidId,
    validatePricePayload
};
