const API_LO_VACCINE = "http://localhost:3000/api/lo-vaccine";
const API_VACCINE = "http://localhost:3000/api/vaccine";
const API_CO_SO = "http://localhost:3000/api/coso";
const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

if (!user || !token) {
    alert("Bạn chưa đăng nhập!");

    window.top.location.href = new URL(
        "../khach-hang/dangnhap.html",
        window.location.href
    ).href;

    throw new Error("Chưa đăng nhập hoặc thiếu token");
}

if (user.vai_tro !== "ADMIN") {
    alert("Bạn không có quyền truy cập!");

    window.top.location.href = new URL(
        "../common/trangchu.html",
        window.location.href
    ).href;

    throw new Error("Không có quyền ADMIN");
}

const loVaccineBody = document.getElementById("loVaccineBody");
const searchLoVaccine = document.getElementById("searchLoVaccine");
const filterTrangThai = document.getElementById("filterTrangThai");

const addLoVaccineModal = document.getElementById("addLoVaccineModal");
const loVaccineForm = document.getElementById("loVaccineForm");

const vaccineIdInput = document.getElementById("vaccine_id");
const coSoIdInput = document.getElementById("co_so_id");
const maLoInput = document.getElementById("ma_lo");
const soLuongNhapInput = document.getElementById("so_luong_nhap");
const hanSuDungInput = document.getElementById("han_su_dung");

let danhSachLoVaccine = [];
let danhSachVaccine = [];
let danhSachCoSo = [];

document.addEventListener("DOMContentLoaded", async () => {
    datNgayToiThieu();

    await taiDanhSachVaccine();
    await taiDanhSachCoSo();
    await taiDanhSachLoVaccine();
});

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`
    };
}

async function taiDanhSachVaccine() {
    try {
        const response = await fetch(API_VACCINE, {
            method: "GET",
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                "Không thể tải danh sách vaccine."
            );
        }

        const data = layMangDuLieu(result);

        danhSachVaccine = data;

        renderVaccineSelect();
    } catch (error) {
        console.error("Lỗi tải danh sách vaccine:", error);
        alert(error.message || "Không thể tải danh sách vaccine.");
    }
}

function renderVaccineSelect() {
    vaccineIdInput.innerHTML = `
        <option value="">Chọn vaccine</option>
    `;

    const vaccines = danhSachVaccine.filter((vaccine) => {
        return vaccine.trang_thai !== "NGUNG";
    });

    vaccines.forEach((vaccine) => {
        const option = document.createElement("option");

        option.value = vaccine.id;
        option.textContent = vaccine.ten_vaccine;

        vaccineIdInput.appendChild(option);
    });
}

async function taiDanhSachCoSo() {
    try {
        const response = await fetch(API_CO_SO, {
            method: "GET",
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                "Không thể tải danh sách cơ sở tiêm."
            );
        }

        danhSachCoSo = layMangDuLieu(result);

        renderCoSoSelect();
    } catch (error) {
        console.error("Lỗi tải danh sách cơ sở tiêm:", error);

        danhSachCoSo = [];
        renderCoSoSelect();

        alert(
            error.message ||
            "Không thể tải danh sách cơ sở tiêm."
        );
    }
}

function renderCoSoSelect() {
    coSoIdInput.innerHTML = `
        <option value="">Chọn cơ sở tiêm</option>
    `;

    const coSoHoatDong = danhSachCoSo.filter((coSo) => {
        return coSo.trang_thai === "HOAT_DONG";
    });

    coSoHoatDong.forEach((coSo) => {
        const option = document.createElement("option");

        option.value = coSo.id;
        option.textContent = coSo.ten_co_so;

        coSoIdInput.appendChild(option);
    });
}

async function taiDanhSachLoVaccine() {
    try {
        const response = await fetch(API_LO_VACCINE, {
            method: "GET",
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                "Không thể tải danh sách lô vaccine."
            );
        }

        danhSachLoVaccine = layMangDuLieu(result);

        locVaHienThi();
    } catch (error) {
        console.error("Lỗi tải danh sách lô vaccine:", error);

        danhSachLoVaccine = [];
        renderLoVaccine([]);

        alert(error.message || "Không thể tải danh sách lô vaccine.");
    }
}

function layMangDuLieu(result) {
    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result.data)) {
        return result.data;
    }

    if (Array.isArray(result.rows)) {
        return result.rows;
    }

    if (Array.isArray(result.vaccines)) {
        return result.vaccines;
    }

    if (Array.isArray(result.lo_vaccine)) {
        return result.lo_vaccine;
    }

    if (Array.isArray(result.co_so)) {
        return result.co_so;
    }

    return [];
}

function renderLoVaccine(data) {
    loVaccineBody.innerHTML = "";

    if (!data.length) {
        loVaccineBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="10">Không có lô vaccine phù hợp.</td>
            </tr>
        `;

        return;
    }

    data.forEach((lo, index) => {
        const tr = document.createElement("tr");


        tr.innerHTML = `
    <td data-label="STT" class="text-center">
        ${index + 1}
    </td>

    <td data-label="Vaccine">
        ${escapeHtml(layTenVaccine(lo))}
    </td>

    <td data-label="Cơ sở tiêm">
        ${escapeHtml(layTenCoSo(lo))}
    </td>

    <td data-label="Mã lô vaccine">
        ${escapeHtml(lo.ma_lo || "—")}
    </td>

    <td data-label="SL nhập" class="text-center">
        ${formatSoLuong(lo.so_luong_nhap)}
    </td>

    <td data-label="SL còn" class="text-center">
        ${formatSoLuong(lo.so_luong_con)}
    </td>

    <td data-label="Hạn sử dụng" class="text-center">
        ${formatDate(lo.han_su_dung)}
    </td>

    <td data-label="Ngày nhập" class="text-center">
        ${formatDateTime(lo.ngay_nhap)}
    </td>

    <td data-label="Trạng thái" class="text-center">
        ${renderTrangThai(lo.trang_thai)}
    </td>

    <td data-label="Thao tác">
        <div class="action-group">
            ${renderHanhDong(lo)}
        </div>
    </td>
`;

        loVaccineBody.appendChild(tr);
    });
}

function layTenVaccine(lo) {
    if (lo.ten_vaccine) {
        return lo.ten_vaccine;
    }

    const vaccine = danhSachVaccine.find((item) => {
        return Number(item.id) === Number(lo.vaccine_id);
    });

    return vaccine ? vaccine.ten_vaccine : "—";
}

function layTenCoSo(lo) {
    if (lo.ten_co_so) {
        return lo.ten_co_so;
    }

    const coSo = danhSachCoSo.find((item) => {
        return Number(item.id) === Number(lo.co_so_id);
    });

    return coSo ? coSo.ten_co_so : "—";
}

function renderTrangThai(trangThai) {
    switch (trangThai) {
        case "DANG_SU_DUNG":
            return `
                <span class="status-badge status-active">
                    Đang sử dụng
                </span>
            `;

        case "HET_HANG":
            return `
                <span class="status-badge status-empty">
                    Hết hàng
                </span>
            `;

        case "HET_HAN":
            return `
                <span class="status-badge status-expired">
                    Hết hạn
                </span>
            `;

        case "NGUNG":
            return `
                <span class="status-badge status-stopped">
                    Ngừng lô vaccine
                </span>
            `;

        default:
            return `
                <span class="status-badge status-stopped">
                    ${escapeHtml(trangThai || "Không xác định")}
                </span>
            `;
    }
}

function renderHanhDong(lo) {
    if (lo.trang_thai === "DANG_SU_DUNG") {
        return `
            <button
                type="button"
                class="btn-stop"
                onclick="ngungSuDungLo(${Number(lo.id)})"
            >
                Ngừng lô vaccine
            </button>
        `;
    }

    return `<span>—</span>`;
}

function locVaHienThi() {
    const keyword = chuanHoaChuoi(searchLoVaccine.value);
    const trangThai = filterTrangThai.value;

    const data = danhSachLoVaccine.filter((lo) => {
        const maLo = chuanHoaChuoi(lo.ma_lo);
        const tenVaccine = chuanHoaChuoi(layTenVaccine(lo));
        const tenCoSo = chuanHoaChuoi(layTenCoSo(lo));

        const dungTuKhoa =
            !keyword ||
            maLo.includes(keyword) ||
            tenVaccine.includes(keyword) ||
            tenCoSo.includes(keyword);

        const dungTrangThai =
            trangThai === "ALL" ||
            lo.trang_thai === trangThai;

        return dungTuKhoa && dungTrangThai;
    });

    renderLoVaccine(data);
}

searchLoVaccine.addEventListener("input", locVaHienThi);
filterTrangThai.addEventListener("change", locVaHienThi);

function moModalThemLo() {
    resetFormThemLo();
    datNgayToiThieu();

    renderVaccineSelect();
    renderCoSoSelect();

    addLoVaccineModal.classList.add("show");
}

function dongModalThemLo() {
    addLoVaccineModal.classList.remove("show");
    resetFormThemLo();
}

function resetFormThemLo() {
    loVaccineForm.reset();
    xoaTatCaLoi();
}

function datNgayToiThieu() {
    hanSuDungInput.removeAttribute("min");
}

loVaccineForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    xoaTatCaLoi();

    const data = {
        vaccine_id: Number(vaccineIdInput.value),
        co_so_id: Number(coSoIdInput.value),
        ma_lo: maLoInput.value.trim(),
        so_luong_nhap: Number(soLuongNhapInput.value),
        han_su_dung: hanSuDungInput.value
    };

    if (!validateThemLo(data)) {
        return;
    }

    const submitButton = loVaccineForm.querySelector(
        'button[type="submit"]'
    );

    const oldText = submitButton.textContent;

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Đang thêm...";

        const response = await fetch(API_LO_VACCINE, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                "Thêm lô vaccine thất bại."
            );
        }

        alert(result.message || "Thêm lô vaccine thành công.");

        dongModalThemLo();

        await taiDanhSachVaccine();
        await taiDanhSachCoSo();
        await taiDanhSachLoVaccine();
    } catch (error) {
        console.error("Lỗi thêm lô vaccine:", error);
        alert(error.message || "Thêm lô vaccine thất bại.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = oldText;
    }
});

function validateThemLo(data) {
    let isValid = true;

    if (!data.vaccine_id) {
        hienThiLoi(
            "vaccine_id",
            "Vui lòng chọn vaccine."
        );

        isValid = false;
    }

    if (!data.co_so_id) {
        hienThiLoi(
            "co_so_id",
            "Vui lòng chọn cơ sở tiêm."
        );

        isValid = false;
    }

    if (!data.ma_lo) {
        hienThiLoi(
            "ma_lo",
            "Vui lòng nhập mã lô vaccine."
        );

        isValid = false;
    } else if (data.ma_lo.length > 50) {
        hienThiLoi(
            "ma_lo",
            "Mã lô vaccine không được vượt quá 50 ký tự."
        );

        isValid = false;
    } else if (!/^[A-Za-z0-9_-]+$/.test(data.ma_lo)) {
        hienThiLoi(
            "ma_lo",
            "Mã lô vaccine chỉ được chứa chữ không dấu, số, dấu - và _."
        );

        isValid = false;
    }

    if (
        !Number.isInteger(data.so_luong_nhap) ||
        data.so_luong_nhap <= 0
    ) {
        hienThiLoi(
            "so_luong_nhap",
            "Số lượng nhập phải là số nguyên lớn hơn 0."
        );

        isValid = false;
    }

    if (!data.han_su_dung) {
        hienThiLoi(
            "han_su_dung",
            "Vui lòng chọn hạn sử dụng."
        );

        isValid = false;
    } else if (!kiemTraHanSuDung(data.han_su_dung)) {
        hienThiLoi(
            "han_su_dung",
            "Hạn sử dụng phải lớn hơn ngày hiện tại."
        );

        isValid = false;
    }

    return isValid;
}

function kiemTraHanSuDung(value) {
    if (!value) {
        return false;
    }

    const selectedDate = new Date(`${value}T00:00:00`);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return selectedDate > today;
}

function hienThiLoi(field, message) {
    const input = document.getElementById(field);

    const error = document.querySelector(
        `.error-message[data-for="${field}"]`
    );

    if (input) {
        input.classList.add("input-error");
    }

    if (error) {
        error.textContent = message;
    }
}

function xoaLoi(field) {
    const input = document.getElementById(field);

    const error = document.querySelector(
        `.error-message[data-for="${field}"]`
    );

    if (input) {
        input.classList.remove("input-error");
    }

    if (error) {
        error.textContent = "";
    }
}

function xoaTatCaLoi() {
    [
        "vaccine_id",
        "co_so_id",
        "ma_lo",
        "so_luong_nhap",
        "han_su_dung"
    ].forEach((field) => {
        xoaLoi(field);
    });
}

vaccineIdInput.addEventListener("change", () => {
    xoaLoi("vaccine_id");
});

coSoIdInput.addEventListener("change", () => {
    xoaLoi("co_so_id");
});

maLoInput.addEventListener("input", () => {
    xoaLoi("ma_lo");
});

soLuongNhapInput.addEventListener("input", () => {
    xoaLoi("so_luong_nhap");
});

hanSuDungInput.addEventListener("change", () => {
    xoaLoi("han_su_dung");
});

async function ngungSuDungLo(id) {
    const lo = danhSachLoVaccine.find((item) => {
        return Number(item.id) === Number(id);
    });

    if (!lo) {
        alert("Không tìm thấy lô vaccine.");
        return;
    }

    if (lo.trang_thai !== "DANG_SU_DUNG") {
        alert("Lô vaccine này không còn ở trạng thái đang sử dụng.");
        return;
    }

    const tenVaccine = layTenVaccine(lo);
    const tenCoSo = layTenCoSo(lo);

    const xacNhan = confirm(
        `Bạn có chắc muốn ngừng lô vaccine "${lo.ma_lo}" ` +
        `của vaccine "${tenVaccine}" tại "${tenCoSo}" không?`
    );

    if (!xacNhan) {
        return;
    }

    try {
        const response = await fetch(
            `${API_LO_VACCINE}/${id}/stop`,
            {
                method: "PATCH",
                headers: getAuthHeaders()
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                "Không thể ngừng sử dụng lô vaccine."
            );
        }

        alert(
            result.message ||
            "Ngừng sử dụng lô vaccine thành công."
        );

        await taiDanhSachVaccine();
        await taiDanhSachLoVaccine();
    } catch (error) {
        console.error("Lỗi ngừng sử dụng lô:", error);

        alert(
            error.message ||
            "Không thể ngừng sử dụng lô vaccine."
        );
    }
}

function formatSoLuong(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return number.toLocaleString("vi-VN");
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const datePart = String(value).split("T")[0];
    const parts = datePart.split("-");

    if (parts.length !== 3) {
        return value;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function chuanHoaChuoi(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

addLoVaccineModal.addEventListener("click", (event) => {
    if (event.target === addLoVaccineModal) {
        dongModalThemLo();
    }
});

document.addEventListener("keydown", (event) => {
    if (
        event.key === "Escape" &&
        addLoVaccineModal.classList.contains("show")
    ) {
        dongModalThemLo();
    }
});

window.moModalThemLo = moModalThemLo;
window.dongModalThemLo = dongModalThemLo;
window.ngungSuDungLo = ngungSuDungLo;