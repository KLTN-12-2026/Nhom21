const cosoService = require("../services/coso.service");
const {
    getValidId,
    validateCoSoData
} = require("../middlewares/coso.middleware");

const {
    deleteImageFile
} = require("../middlewares/coso-upload.middleware");

function deleteUploadedImage(req) {
    if (req.file) {
        deleteImageFile(
            `uploads/coso/${req.file.filename}`
        );
    }
}

async function getAll(req, res) {
    try {
        const rows = await cosoService.getAll();

        return res.json(rows);

    } catch (err) {
        console.error(
            "Lỗi lấy danh sách cơ sở:",
            err
        );

        return res.status(500).json({
            message: "Không thể lấy danh sách cơ sở."
        });
    }
}

async function getById(req, res) {
    try {
        const id = getValidId(req.params.id);

        if (!id) {
            return res.status(400).json({
                message: "ID cơ sở không hợp lệ."
            });
        }

        const rows = await cosoService.getById(id);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy cơ sở."
            });
        }

        return res.json(rows[0]);

    } catch (err) {
        console.error(
            "Lỗi lấy chi tiết cơ sở:",
            err
        );

        return res.status(500).json({
            message: "Không thể lấy thông tin cơ sở."
        });
    }
}

async function create(req, res) {
    try {

        const validation = validateCoSoData(
            req.body
        );

        if (!validation.valid) {
            deleteUploadedImage(req);

            return res.status(400).json({
                message: validation.message
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Vui lòng chọn ảnh cơ sở."
            });
        }

        const {
            tenCoSo,
            diaChi,
            soDienThoai,
            gioMo,
            gioDong,
            moTa,
            maNhungBanDo
        } = validation.data;

        const duplicate =
            await cosoService.isDuplicateName(
                tenCoSo
            );

        if (duplicate) {
            deleteUploadedImage(req);

            return res.status(409).json({
                message: "Tên cơ sở này đã tồn tại."
            });
        }

        const imagePath =
            `uploads/coso/${req.file.filename}`;
        await cosoService.create({
            tenCoSo,
            diaChi,
            soDienThoai,
            gioMo,
            gioDong,
            imagePath,
            moTa,
            maNhungBanDo
        });

        return res.status(201).json({
            message: "Thêm cơ sở thành công."
        });

    } catch (err) {
        deleteUploadedImage(req);

        console.error(
            "Lỗi thêm cơ sở:",
            err
        );

        return res.status(500).json({
            message: "Không thể thêm cơ sở."
        });
    }
}

async function update(req, res) {
    try {

        const id = getValidId(req.params.id);

        if (!id) {
            deleteUploadedImage(req);

            return res.status(400).json({
                message: "ID cơ sở không hợp lệ."
            });
        }
        const validation = validateCoSoData(
            req.body
        );

        if (!validation.valid) {
            deleteUploadedImage(req);

            return res.status(400).json({
                message: validation.message
            });
        }

        const oldRows =
            await cosoService.getExistingImage(id);

        if (oldRows.length === 0) {
            deleteUploadedImage(req);

            return res.status(404).json({
                message: "Không tìm thấy cơ sở."
            });
        }

        const {
            tenCoSo,
            diaChi,
            soDienThoai,
            gioMo,
            gioDong,
            moTa,
            maNhungBanDo
        } = validation.data;

        const duplicate =
            await cosoService.isDuplicateName(
                tenCoSo,
                id
            );

        if (duplicate) {
            deleteUploadedImage(req);

            return res.status(409).json({
                message: "Tên cơ sở này đã tồn tại."
            });
        }
        const oldImagePath = oldRows[0].hinh_anh;

        let imagePath = oldImagePath;

        if (req.file) {
            imagePath =
                `uploads/coso/${req.file.filename}`;
        }

        if (!imagePath) {
            deleteUploadedImage(req);

            return res.status(400).json({
                message: "Vui lòng chọn ảnh cơ sở."
            });
        }

        await cosoService.update(id, {
            tenCoSo,
            diaChi,
            soDienThoai,
            gioMo,
            gioDong,
            imagePath,
            moTa,
            maNhungBanDo
        });

        if (
            req.file &&
            oldImagePath &&
            oldImagePath !== imagePath
        ) {
            deleteImageFile(oldImagePath);
        }

        return res.json({
            message: "Cập nhật cơ sở thành công."
        });

    } catch (err) {

        // Nếu lỗi sau khi upload ảnh mới,
        // xóa ảnh vừa upload.

        deleteUploadedImage(req);

        console.error(
            "Lỗi cập nhật cơ sở:",
            err
        );

        return res.status(500).json({
            message: "Không thể cập nhật cơ sở."
        });
    }
}

async function stop(req, res) {
    try {


        const id = getValidId(req.params.id);

        if (!id) {
            return res.status(400).json({
                message: "ID cơ sở không hợp lệ."
            });
        }

        const rows =
            await cosoService.getStatusById(id);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy cơ sở."
            });
        }

        if (
            rows[0].trang_thai === "TAM_DUNG"
        ) {
            return res.status(400).json({
                message:
                    "Cơ sở này đã ở trạng thái tạm dừng."
            });
        }

        await cosoService.stop(id);

        return res.json({
            message: "Tạm dừng cơ sở thành công."
        });

    } catch (err) {
        console.error(
            "Lỗi tạm dừng cơ sở:",
            err
        );

        return res.status(500).json({
            message: "Không thể tạm dừng cơ sở."
        });
    }
}

async function activate(req, res) {
    try {

        const id = getValidId(req.params.id);

        if (!id) {
            return res.status(400).json({
                message: "ID cơ sở không hợp lệ."
            });
        }

        const rows =
            await cosoService.getStatusById(id);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy cơ sở."
            });
        }

        if (
            rows[0].trang_thai === "HOAT_DONG"
        ) {
            return res.status(400).json({
                message: "Cơ sở này đang hoạt động."
            });
        }

        await cosoService.activate(id);

        return res.json({
            message: "Kích hoạt lại cơ sở thành công."
        });

    } catch (err) {
        console.error(
            "Lỗi kích hoạt lại cơ sở:",
            err
        );

        return res.status(500).json({
            message: "Không thể kích hoạt lại cơ sở."
        });
    }
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    stop,
    activate
};
