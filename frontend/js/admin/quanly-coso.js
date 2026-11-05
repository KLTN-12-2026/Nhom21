const API_CO_SO = "http://localhost:3000/api/coso";
const BASE_URL = "http://localhost:3000";

let currentUser = null;
const token = localStorage.getItem("token");
try {
    currentUser = JSON.parse(
        localStorage.getItem("user")
    );
} catch (error) {
    currentUser = null;
}

if (!currentUser || !token) {
    alert("Bạn chưa đăng nhập!");

    window.top.location.href = new URL(
        "../khach-hang/dangnhap.html",
        window.location.href
    ).href;

    throw new Error("Chưa đăng nhập");
}

if (currentUser.vai_tro !== "ADMIN") {
    alert("Bạn không có quyền truy cập!");

    window.top.location.href = new URL(
        "../common/trangchu.html",
        window.location.href
    ).href;

    throw new Error("Không có quyền ADMIN");
}

const coSoTableBody = document.getElementById("coSoTableBody");

const coSoFormBox = document.getElementById("coSoFormBox");
const coSoForm = document.getElementById("coSoForm");
const formTitle = document.getElementById("formTitle");

const btnShowAddForm = document.getElementById("btnShowAddForm");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelForm = document.getElementById("btnCancelForm");

const coSoId = document.getElementById("coSoId");
const tenCoSo = document.getElementById("tenCoSo");
const soDienThoai = document.getElementById("soDienThoai");
const gioMo = document.getElementById("gioMo");
const gioDong = document.getElementById("gioDong");
const diaChi = document.getElementById("diaChi");
const moTa = document.getElementById("moTa");
const mapEmbed = document.getElementById("mapEmbed");
const hinhAnh = document.getElementById("hinhAnh");
const previewImage = document.getElementById("previewImage");

let danhSachCoSo = [];
let anhCuHienTai = "";

function getAuthHeaders() {
    return {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`
    };
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getImageUrl(imagePath) {
    if (!imagePath) {
        return "";
    }

    const path = String(imagePath).replace(/\\/g, "/");

    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }

    if (path.startsWith("/")) {
        return `${BASE_URL}${path}`;
    }

    return `${BASE_URL}/${path}`;
}

function showModal() {
    coSoFormBox.classList.add("show");
}

function closeModal() {
    coSoFormBox.classList.remove("show");
    resetForm();
}

function resetForm() {
    coSoForm.reset();

    coSoId.value = "";
    anhCuHienTai = "";

    formTitle.textContent = "Thêm cơ sở";

    previewImage.src = "";
    previewImage.style.display = "none";

    hinhAnh.value = "";
}

function openAddForm() {
    resetForm();

    formTitle.textContent = "Thêm cơ sở";

    showModal();
}

async function loadCoSo() {
    coSoTableBody.innerHTML = `
        <tr>
            <td colspan="8" class="empty">
                Đang tải danh sách cơ sở...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(API_CO_SO);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Không thể tải danh sách cơ sở."
            );
        }

        danhSachCoSo = Array.isArray(data)
            ? data
            : [];

        renderCoSo();
    } catch (error) {
        console.error(
            "Lỗi tải danh sách cơ sở:",
            error
        );

        coSoTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    Không thể tải danh sách cơ sở.
                </td>
            </tr>
        `;
    }
}

function renderCoSo() {
    if (!danhSachCoSo.length) {
        coSoTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    Chưa có cơ sở tiêm nào.
                </td>
            </tr>
        `;

        return;
    }

    coSoTableBody.innerHTML = danhSachCoSo
        .map((coSo, index) => {
            const id = Number(coSo.id);

            const ten = escapeHtml(
                coSo.ten_co_so || ""
            );

            const diaChiText = escapeHtml(
                coSo.dia_chi || ""
            );

            const dienThoai = escapeHtml(
                coSo.so_dien_thoai || ""
            );

            const gioMoText = escapeHtml(
                formatTimeInput(coSo.gio_mo)
            );

            const gioDongText = escapeHtml(
                formatTimeInput(coSo.gio_dong)
            );

            const trangThai = coSo.trang_thai;

            const imageUrl = getImageUrl(
                coSo.hinh_anh
            );

            let imageHtml = `
                <span>Chưa có ảnh</span>
            `;

            if (imageUrl) {
                imageHtml = `
                    <img
                        src="${escapeHtml(imageUrl)}"
                        alt="${ten}"
                        class="thumb"
                    >
                `;
            }

            let statusHtml = "";

            let actionHtml = `
                <button
                    type="button"
                    class="btn-action btn-edit"
                    onclick="editCoSo(${id})"
                >
                    Cập nhật
                </button>
            `;

            if (trangThai === "HOAT_DONG") {
                statusHtml = `
                    <span class="status active">
                        Hoạt động
                    </span>
                `;

                actionHtml += `
                    <button
                        type="button"
                        class="btn-action btn-stop"
                        onclick="tamDungCoSo(${id})"
                    >
                        Tạm dừng cơ sở
                    </button>
                `;
            } else if (trangThai === "TAM_DUNG") {
                statusHtml = `
                    <span class="status inactive">
                        Tạm dừng cơ sở
                    </span>
                `;

                actionHtml += `
                    <button
                        type="button"
                        class="btn-action btn-activate"
                        onclick="kichHoatCoSo(${id})"
                    >
                        Kích hoạt lại
                    </button>
                `;
            } else {
                statusHtml = `
                    <span class="status inactive">
                        Không xác định
                    </span>
                `;
            }

            const gioLamViec =
                gioMoText && gioDongText
                    ? `${gioMoText} - ${gioDongText}`
                    : "-";

            return `
    <tr>
        <td data-label="STT" style="text-align:center;">
            ${index + 1}
        </td>

        <td data-label="Ảnh" style="text-align:center;">
            ${imageHtml}
        </td>

        <td data-label="Tên cơ sở">
            ${ten}
        </td>

        <td data-label="Địa chỉ">
            ${diaChiText}
        </td>

        <td data-label="Điện thoại" style="text-align:center;">
            ${dienThoai}
        </td>

        <td data-label="Giờ làm việc" style="text-align:center;">
            ${gioLamViec}
        </td>

        <td data-label="Trạng thái" style="text-align:center;">
            ${statusHtml}
        </td>

        <td data-label="Thao tác">
            <div class="action-group">
                ${actionHtml}
            </div>
        </td>
    </tr>
`;
        })
        .join("");
}

function editCoSo(id) {
    const coSo = danhSachCoSo.find(
        (item) => Number(item.id) === Number(id)
    );

    if (!coSo) {
        alert(
            "Không tìm thấy thông tin cơ sở."
        );

        return;
    }

    resetForm();

    formTitle.textContent = "Cập nhật cơ sở";

    coSoId.value = coSo.id;

    tenCoSo.value = coSo.ten_co_so || "";
    soDienThoai.value = coSo.so_dien_thoai || "";

    gioMo.value = formatTimeInput(
        coSo.gio_mo
    );

    gioDong.value = formatTimeInput(
        coSo.gio_dong
    );

    diaChi.value = coSo.dia_chi || "";
    moTa.value = coSo.mo_ta || "";

    mapEmbed.value =
        coSo.ma_nhung_ban_do || "";

    anhCuHienTai = coSo.hinh_anh || "";

    if (anhCuHienTai) {
        previewImage.src = getImageUrl(
            anhCuHienTai
        );

        previewImage.style.display = "block";
    } else {
        previewImage.src = "";
        previewImage.style.display = "none";
    }

    showModal();
}

function formatTimeInput(value) {
    if (!value) {
        return "";
    }

    return String(value).substring(0, 5);
}

function isValidPhone(phone) {
    return /^0\d{9}$/.test(phone);
}

function isValidWorkingTime(openTime, closeTime) {
    if (!openTime || !closeTime) {
        return false;
    }

    return closeTime > openTime;
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

function validateImage(file) {
    if (!file) {
        return true;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        alert(
            "Ảnh cơ sở chỉ chấp nhận JPG, PNG hoặc WEBP."
        );

        return false;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
        alert(
            "Ảnh cơ sở không được vượt quá 5 MB."
        );

        return false;
    }

    return true;
}

function validateForm() {
    const ten = tenCoSo.value.trim();
    const phone = soDienThoai.value.trim();
    const openTime = gioMo.value;
    const closeTime = gioDong.value;
    const address = diaChi.value.trim();
    const maps = mapEmbed.value.trim();

    const id = coSoId.value.trim();

    const imageFile = hinhAnh.files[0];

    if (!ten) {
        alert(
            "Vui lòng nhập tên cơ sở."
        );

        tenCoSo.focus();

        return false;
    }

    if (!phone) {
        alert(
            "Vui lòng nhập số điện thoại."
        );

        soDienThoai.focus();

        return false;
    }

    if (!isValidPhone(phone)) {
        alert(
            "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0."
        );

        soDienThoai.focus();

        return false;
    }

    if (!openTime) {
        alert(
            "Vui lòng chọn giờ mở cửa."
        );

        gioMo.focus();

        return false;
    }

    if (!closeTime) {
        alert(
            "Vui lòng chọn giờ đóng cửa."
        );

        gioDong.focus();

        return false;
    }

    if (!isValidWorkingTime(
        openTime,
        closeTime
    )) {
        alert(
            "Giờ đóng cửa phải lớn hơn giờ mở cửa."
        );

        gioDong.focus();

        return false;
    }

    if (!address) {
        alert(
            "Vui lòng nhập địa chỉ cơ sở."
        );

        diaChi.focus();

        return false;
    }

    if (!maps) {
        alert(
            "Vui lòng nhập mã nhúng Google Maps."
        );

        mapEmbed.focus();

        return false;
    }

    if (!isValidGoogleMapsEmbed(maps)) {
        alert(
            "Mã Google Maps không hợp lệ. Vui lòng dán mã iframe Google Maps."
        );

        mapEmbed.focus();

        return false;
    }

    if (!id && !imageFile) {
        alert(
            "Vui lòng chọn ảnh cơ sở."
        );

        hinhAnh.focus();

        return false;
    }

    if (id && !imageFile && !anhCuHienTai) {
        alert(
            "Vui lòng chọn ảnh cơ sở."
        );

        hinhAnh.focus();

        return false;
    }

    if (!validateImage(imageFile)) {
        return false;
    }

    return true;
}

function createFormData() {
    const formData = new FormData();

    formData.append(
        "ten_co_so",
        tenCoSo.value.trim()
    );

    formData.append(
        "dia_chi",
        diaChi.value.trim()
    );

    formData.append(
        "so_dien_thoai",
        soDienThoai.value.trim()
    );

    formData.append(
        "gio_mo",
        gioMo.value
    );

    formData.append(
        "gio_dong",
        gioDong.value
    );

    formData.append(
        "mo_ta",
        moTa.value.trim()
    );

    formData.append(
        "ma_nhung_ban_do",
        mapEmbed.value.trim()
    );

    const imageFile = hinhAnh.files[0];

    if (imageFile) {
        formData.append(
            "hinh_anh",
            imageFile
        );
    }

    return formData;
}

async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const id = coSoId.value.trim();

    const isEdit = Boolean(id);

    const url = isEdit
        ? `${API_CO_SO}/${id}`
        : API_CO_SO;

    const method = isEdit
        ? "PUT"
        : "POST";

    const formData = createFormData();

    try {
        const response = await fetch(
            url,
            {
                method: method,
                headers: getAuthHeaders(),
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                (
                    isEdit
                        ? "Không thể cập nhật cơ sở."
                        : "Không thể thêm cơ sở."
                )
            );
        }

        alert(
            data.message ||
            (
                isEdit
                    ? "Cập nhật cơ sở thành công."
                    : "Thêm cơ sở thành công."
            )
        );

        closeModal();

        await loadCoSo();
    } catch (error) {
        console.error(
            "Lỗi lưu cơ sở:",
            error
        );

        alert(
            error.message ||
            "Có lỗi xảy ra khi lưu cơ sở."
        );
    }
}

async function tamDungCoSo(id) {
    const coSo = danhSachCoSo.find(
        (item) => Number(item.id) === Number(id)
    );

    if (!coSo) {
        alert(
            "Không tìm thấy cơ sở."
        );

        return;
    }

    if (coSo.trang_thai !== "HOAT_DONG") {
        alert(
            "Cơ sở này hiện không ở trạng thái hoạt động."
        );

        return;
    }

    const confirmed = confirm(
        `Bạn có chắc muốn tạm dừng cơ sở "${coSo.ten_co_so}" không?\n\n` +
        "Cơ sở sẽ không nhận đăng ký tiêm mới cho đến khi được kích hoạt lại."
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_CO_SO}/${id}/stop`,
            {
                method: "PATCH",
                headers: getAuthHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Không thể tạm dừng cơ sở."
            );
        }

        alert(
            data.message ||
            "Tạm dừng cơ sở thành công."
        );

        await loadCoSo();
    } catch (error) {
        console.error(
            "Lỗi tạm dừng cơ sở:",
            error
        );

        alert(
            error.message ||
            "Có lỗi xảy ra khi tạm dừng cơ sở."
        );
    }
}

async function kichHoatCoSo(id) {
    const coSo = danhSachCoSo.find(
        (item) => Number(item.id) === Number(id)
    );

    if (!coSo) {
        alert(
            "Không tìm thấy cơ sở."
        );

        return;
    }

    if (coSo.trang_thai !== "TAM_DUNG") {
        alert(
            "Cơ sở này hiện không ở trạng thái tạm dừng."
        );

        return;
    }

    const confirmed = confirm(
        `Bạn có chắc muốn kích hoạt lại cơ sở "${coSo.ten_co_so}" không?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_CO_SO}/${id}/activate`,
            {
                method: "PATCH",
                headers: getAuthHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Không thể kích hoạt lại cơ sở."
            );
        }

        alert(
            data.message ||
            "Kích hoạt lại cơ sở thành công."
        );

        await loadCoSo();
    } catch (error) {
        console.error(
            "Lỗi kích hoạt lại cơ sở:",
            error
        );

        alert(
            error.message ||
            "Có lỗi xảy ra khi kích hoạt lại cơ sở."
        );
    }
}

hinhAnh.addEventListener(
    "change",
    function () {
        const file = this.files[0];

        if (!file) {
            if (anhCuHienTai) {
                previewImage.src = getImageUrl(
                    anhCuHienTai
                );

                previewImage.style.display = "block";
            } else {
                previewImage.src = "";
                previewImage.style.display = "none";
            }

            return;
        }

        if (!validateImage(file)) {
            this.value = "";

            if (anhCuHienTai) {
                previewImage.src = getImageUrl(
                    anhCuHienTai
                );

                previewImage.style.display = "block";
            } else {
                previewImage.src = "";
                previewImage.style.display = "none";
            }

            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            previewImage.src = event.target.result;
            previewImage.style.display = "block";
        };

        reader.readAsDataURL(file);
    }
);

btnShowAddForm.addEventListener(
    "click",
    openAddForm
);

btnCancelForm.addEventListener(
    "click",
    closeModal
);

btnCloseModal.addEventListener(
    "click",
    closeModal
);

coSoForm.addEventListener(
    "submit",
    handleSubmit
);

coSoFormBox.addEventListener(
    "click",
    function (event) {
        if (event.target === coSoFormBox) {
            closeModal();
        }
    }
);

document.addEventListener(
    "keydown",
    function (event) {
        if (
            event.key === "Escape" &&
            coSoFormBox.classList.contains("show")
        ) {
            closeModal();
        }
    }
);

window.editCoSo = editCoSo;
window.tamDungCoSo = tamDungCoSo;
window.kichHoatCoSo = kichHoatCoSo;

loadCoSo();