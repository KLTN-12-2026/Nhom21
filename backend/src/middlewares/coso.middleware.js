function getAuthInfo(req) {
    return {
        userId: req.user?.id,
        role: req.user?.vai_tro
    };
}

function requireAdmin(req, res) {
    const auth = getAuthInfo(req);

    if (!auth.userId || !auth.role) {
        res.status(401).json({
            message: "Bạn chưa đăng nhập."
        });

        return false;
    }

    if (auth.role !== "ADMIN") {
        res.status(403).json({
            message:
                "Bạn không có quyền thực hiện chức năng này."
        });

        return false;
    }

    return true;
}

function getValidId(value) {
    const id = Number(value);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return null;
    }

    return id;
}

function isValidPhone(phone) {
    return /^0\d{9}$/.test(phone);
}

function parseTime(value) {
    const cleanValue = String(
        value || ""
    ).trim();

    const match = cleanValue.match(
        /^([01]\d|2[0-3]):([0-5]\d)$/
    );

    if (!match) {
        return null;
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);

    return {
        value: `${match[1]}:${match[2]}`,
        totalMinutes: hour * 60 + minute
    };
}

function isValidGoogleMapsEmbed(value) {
    const text = String(value || "")
        .trim()
        .toLowerCase();

    if (!text) {
        return false;
    }

    return (
        text.includes("<iframe") &&
        (
            text.includes("google.com/maps") ||
            text.includes("google.com/maps/embed") ||
            text.includes("maps.google.com")
        )
    );
}

function validateCoSoData(data) {

    const tenCoSo = String(
        data.ten_co_so || ""
    ).trim();

    const diaChi = String(
        data.dia_chi || ""
    ).trim();

    const soDienThoai = String(
        data.so_dien_thoai || ""
    ).trim();

    const gioMoRaw = String(
        data.gio_mo || ""
    ).trim();

    const gioDongRaw = String(
        data.gio_dong || ""
    ).trim();

    const moTa = String(
        data.mo_ta || ""
    ).trim();

    const maNhungBanDo = String(
        data.ma_nhung_ban_do || ""
    ).trim();

    if (!tenCoSo) {
        return {
            valid: false,
            message: "Vui lòng nhập tên cơ sở."
        };
    }

    if (tenCoSo.length > 150) {
        return {
            valid: false,
            message:
                "Tên cơ sở không được vượt quá 150 ký tự."
        };
    }

    if (!soDienThoai) {
        return {
            valid: false,
            message: "Vui lòng nhập số điện thoại."
        };
    }

    if (!isValidPhone(soDienThoai)) {
        return {
            valid: false,
            message:
                "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0."
        };
    }

    if (!gioMoRaw) {
        return {
            valid: false,
            message: "Vui lòng chọn giờ mở cửa."
        };
    }

    const gioMo = parseTime(gioMoRaw);

    if (!gioMo) {
        return {
            valid: false,
            message: "Giờ mở cửa không hợp lệ."
        };
    }

    if (!gioDongRaw) {
        return {
            valid: false,
            message: "Vui lòng chọn giờ đóng cửa."
        };
    }

    const gioDong = parseTime(gioDongRaw);

    if (!gioDong) {
        return {
            valid: false,
            message: "Giờ đóng cửa không hợp lệ."
        };
    }

    if (
        gioDong.totalMinutes <=
        gioMo.totalMinutes
    ) {
        return {
            valid: false,
            message:
                "Giờ đóng cửa phải lớn hơn giờ mở cửa."
        };
    }

    if (!diaChi) {
        return {
            valid: false,
            message: "Vui lòng nhập địa chỉ."
        };
    }

    if (diaChi.length > 255) {
        return {
            valid: false,
            message:
                "Địa chỉ không được vượt quá 255 ký tự."
        };
    }

    if (!maNhungBanDo) {
        return {
            valid: false,
            message:
                "Vui lòng nhập mã nhúng Google Maps."
        };
    }

    if (
        !isValidGoogleMapsEmbed(
            maNhungBanDo
        )
    ) {
        return {
            valid: false,
            message:
                "Mã nhúng Google Maps không hợp lệ. Vui lòng dán mã iframe Google Maps."
        };
    }

    return {
        valid: true,

        data: {
            tenCoSo,
            diaChi,
            soDienThoai,
            gioMo: gioMo.value,
            gioDong: gioDong.value,
            moTa,
            maNhungBanDo
        }
    };
}

module.exports = {
    getAuthInfo,
    requireAdmin,
    getValidId,
    isValidPhone,
    parseTime,
    isValidGoogleMapsEmbed,
    validateCoSoData
};
