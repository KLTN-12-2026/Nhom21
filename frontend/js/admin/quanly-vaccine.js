
const API_VACCINE = "http://localhost:3000/api/vaccine";
const API_ORIGIN = "http://localhost:3000";

// ==================================================
// KIỂM TRA ĐĂNG NHẬP VÀ QUYỀN ADMIN
// ==================================================

let user = null;

try {
  user = JSON.parse(localStorage.getItem("user"));
} catch (error) {
  console.error("Dữ liệu đăng nhập không hợp lệ:", error);
}

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

// ==================================================
// DOM
// ==================================================

const vaccineBody = document.getElementById("vaccineBody");
const searchVaccine = document.getElementById("searchVaccine");
const filterTrangThai = document.getElementById("filterTrangThai");

const addModal = document.getElementById("addVaccineModal");
const editModal = document.getElementById("editVaccineModal");

const vaccineForm = document.getElementById("vaccineForm");
const editVaccineForm = document.getElementById("editVaccineForm");

// FORM THÊM
const tenVaccineInput = document.getElementById("ten_vaccine");
const phongBenhInput = document.getElementById("phong_benh");
const loaiDoiTuongInput = document.getElementById("loai_doi_tuong");
const nuocSXInput = document.getElementById("nuoc_sx");
const nhaCungCapInput = document.getElementById("nha_cung_cap");
const moTaInput = document.getElementById("mo_ta");

const addImageInput = document.getElementById("hinh_anh");
const addImagePreview = document.getElementById("preview_hinh_anh");
const addDetailInput = document.getElementById("noi_dung_chi_tiet");
const addSourceInput = document.getElementById("nguon_tham_khao");

// FORM CẬP NHẬT
const editIdInput = document.getElementById("edit_id");
const editTenVaccineInput = document.getElementById("edit_ten_vaccine");
const editPhongBenhInput = document.getElementById("edit_phong_benh");
const editLoaiDoiTuongInput = document.getElementById("edit_loai_doi_tuong");
const editNuocSXInput = document.getElementById("edit_nuoc_sx");
const editNhaCungCapInput = document.getElementById("edit_nha_cung_cap");
const editMoTaInput = document.getElementById("edit_mo_ta");

const editImageInput = document.getElementById("edit_hinh_anh");
const editImagePreview = document.getElementById("edit_preview_hinh_anh");
const editDetailInput = document.getElementById("edit_noi_dung_chi_tiet");
const editSourceInput = document.getElementById("edit_nguon_tham_khao");

let danhSachVaccine = [];

// ==================================================
// COMBOBOX NƯỚC SẢN XUẤT
// ==================================================

const DEFAULT_COUNTRIES = [
  "Việt Nam",
  "Mỹ",
  "Pháp",
  "Bỉ",
  "Đức",
  "Hà Lan",
  "Hàn Quốc",
  "Nhật Bản",
  "Ý",
  "Cu Ba"
];

function normalizeCountry(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

function getCountrySuggestions() {
  const countries = [...DEFAULT_COUNTRIES];

  danhSachVaccine.forEach(vaccine => {
    const country = String(vaccine.nuoc_sx || "").trim();

    if (
      country &&
      !countries.some(
        item =>
          normalizeCountry(item) ===
          normalizeCountry(country)
      )
    ) {
      countries.push(country);
    }
  });

  return countries;
}

function setupCountryCombobox(input) {
  if (!input) return;

  const wrapper = input.closest("[data-country-combobox]");
  if (!wrapper) return;

  const toggle = wrapper.querySelector(".country-toggle");
  const menu = wrapper.querySelector(".country-options");

  function closeMenu() {
    menu.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }

  function renderOptions(showAll = false) {
    const keyword = normalizeCountry(input.value);

    const countries = getCountrySuggestions().filter(
      country =>
        showAll ||
        normalizeCountry(country).includes(keyword)
    );

    menu.replaceChildren();

    countries.forEach(country => {
      const option = document.createElement("button");

      option.type = "button";
      option.className = "country-option";
      option.textContent = country;
      option.setAttribute("role", "option");

      option.addEventListener("mousedown", event => {
        event.preventDefault();
      });

      option.addEventListener("click", () => {
        input.value = country;

        input.dispatchEvent(
          new Event("input", { bubbles: true })
        );

        closeMenu();
      });

      menu.appendChild(option);
    });

    if (countries.length === 0) {
      const empty = document.createElement("div");

      empty.className = "country-empty";
      empty.textContent =
        "Chưa có quốc gia này. Bạn có thể nhập tên mới.";

      menu.appendChild(empty);
    }

    menu.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  toggle.addEventListener("click", () => {
    if (menu.hidden) {
      input.focus();
      renderOptions(true);
    } else {
      closeMenu();
    }
  });

  input.addEventListener("input", () => {
    renderOptions();
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMenu();
    }

    if (event.key === "ArrowDown" && menu.hidden) {
      event.preventDefault();
      renderOptions(true);
    }
  });

  document.addEventListener("click", event => {
    if (!wrapper.contains(event.target)) {
      closeMenu();
    }
  });
}

setupCountryCombobox(nuocSXInput);
setupCountryCombobox(editNuocSXInput);

// ==================================================
// REGEX / HẰNG SỐ
// ==================================================

const vaccineNameRegex =
  /^(?![.,-])[A-Za-zÀ-ỹ0-9\s.,()+-]{2,100}(?<![.,-])$/;

const diseaseRegex =
  /^(?![.,-])[A-Za-zÀ-ỹ0-9\s,()+-]{2,150}(?<![.,-])$/;

const supplierRegex =
  /^(?![.,-])[A-Za-zÀ-ỹ0-9\s.,()-]{2,100}(?<![.,-])$/;

const descriptionRegex =
  /^[A-Za-zÀ-ỹ0-9\s.,:;()*/-]*$/;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

// ==================================================
// HÀM DÙNG CHUNG
// ==================================================

function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getErrorElement(input) {
  if (!input) return null;

  const group = input.closest(".form-group");

  if (!group) return null;

  return group.querySelector(
    `.error-message[data-for="${input.id}"]`
  );
}

function showError(input, message) {
  if (!input) return;

  const errorElement = getErrorElement(input);

  if (errorElement) {
    errorElement.textContent = message;
  }

  input.classList.add("input-error");
}

function clearError(input) {
  if (!input) return;

  const errorElement = getErrorElement(input);

  if (errorElement) {
    errorElement.textContent = "";
  }

  input.classList.remove("input-error");
}

function clearFormErrors(inputs) {
  inputs.forEach(clearError);
}

function getAdminHeaders(hasBody = false) {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`
  };

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function getDoiTuongText(value) {
  if (value === "TRE_EM") return "Trẻ em";
  if (value === "NGUOI_LON") return "Người lớn";
  if (value === "CA_HAI") return "Cả hai";

  return "Không xác định";
}

function getTrangThaiHtml(status) {
  if (status === "CON") {
    return '<span class="status-badge status-con">Còn hàng</span>';
  }

  if (status === "HET") {
    return '<span class="status-badge status-het">Hết hàng</span>';
  }

  if (status === "NGUNG") {
    return '<span class="status-badge status-ngung">Ngừng sử dụng</span>';
  }

  return `<span class="status-badge">${escapeHtml(status || "Không xác định")}</span>`;
}

// ==================================================
// XỬ LÝ HÌNH ẢNH
// ==================================================

function validateVaccineImage(input) {
  clearError(input);

  if (!input) return false;

  const file = input.files[0];

  if (!file) return true;

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    showError(
      input,
      "Chỉ chấp nhận hình ảnh JPG, PNG hoặc WEBP."
    );
    return false;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    showError(
      input,
      "Hình ảnh không được vượt quá 5 MB."
    );
    return false;
  }

  return true;
}

function getVaccineImageUrl(imagePath) {
  if (!imagePath) return "";

  const path = String(imagePath).replace(/^\/+/, "");

  if (!path.startsWith("uploads/vaccine/")) {
    return "";
  }

  return `${API_ORIGIN}/${path}`;
}

function hideImagePreview(preview) {
  if (!preview) return;

  preview.removeAttribute("src");
  preview.style.display = "none";
}

function showImagePreview(preview, imageUrl) {
  if (!preview) return;

  if (!imageUrl) {
    hideImagePreview(preview);
    return;
  }

  preview.src = imageUrl;
  preview.style.display = "block";
}

function previewSelectedImage(input, preview, fallbackUrl = "") {
  const file = input.files[0];

  if (!file) {
    showImagePreview(preview, fallbackUrl);
    return;
  }

  if (!validateVaccineImage(input)) {
    input.value = "";
    showImagePreview(preview, fallbackUrl);
    return;
  }

  const objectUrl = URL.createObjectURL(file);

  preview.onload = () => {
    URL.revokeObjectURL(objectUrl);
    preview.onload = null;
  };

  preview.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    preview.onerror = null;
    hideImagePreview(preview);
  };

  showImagePreview(preview, objectUrl);
}

// ==================================================
// CHUYỂN TAB
// ==================================================

function chuyenTabVaccine(formId, tab) {
  const form = document.getElementById(formId);

  if (!form) return;

  const prefix = formId === "vaccineForm" ? "add" : "edit";

  form.querySelectorAll(".vaccine-tab").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.tab === tab
    );
  });

  form.querySelectorAll(".vaccine-tab-panel").forEach(panel => {
    panel.classList.toggle(
      "active",
      panel.id === `${prefix}-${tab}`
    );
  });
}

document.querySelectorAll(".vaccine-tab").forEach(button => {
  button.addEventListener("click", () => {
    const formId = button.dataset.form === "add"
      ? "vaccineForm"
      : "editVaccineForm";

    chuyenTabVaccine(formId, button.dataset.tab);
  });
});

// ==================================================
// VALIDATE THÔNG TIN CƠ BẢN
// ==================================================

function validateVaccineData(data, inputs) {
  let valid = true;

  clearFormErrors(Object.values(inputs));

  if (isEmpty(data.ten_vaccine)) {
    showError(inputs.ten_vaccine, "Vui lòng nhập tên vaccine.");
    valid = false;
  } else if (
    data.ten_vaccine.length < 2 ||
    data.ten_vaccine.length > 100 ||
    !vaccineNameRegex.test(data.ten_vaccine)
  ) {
    showError(inputs.ten_vaccine, "Tên vaccine không hợp lệ.");
    valid = false;
  }

  if (isEmpty(data.phong_benh)) {
    showError(inputs.phong_benh, "Vui lòng nhập phòng bệnh.");
    valid = false;
  } else if (
    data.phong_benh.length < 2 ||
    data.phong_benh.length > 150 ||
    !diseaseRegex.test(data.phong_benh)
  ) {
    showError(inputs.phong_benh, "Phòng bệnh không hợp lệ.");
    valid = false;
  }

  if (!["TRE_EM", "NGUOI_LON", "CA_HAI"].includes(data.loai_doi_tuong)) {
    showError(inputs.loai_doi_tuong, "Đối tượng không hợp lệ.");
    valid = false;
  }

  if (isEmpty(data.nuoc_sx)) {
    showError(inputs.nuoc_sx, "Vui lòng chọn nước sản xuất.");
    valid = false;
  }

  if (isEmpty(data.nha_cung_cap)) {
    showError(inputs.nha_cung_cap, "Vui lòng nhập nhà cung cấp.");
    valid = false;
  } else if (
    data.nha_cung_cap.length < 2 ||
    data.nha_cung_cap.length > 100 ||
    !supplierRegex.test(data.nha_cung_cap)
  ) {
    showError(inputs.nha_cung_cap, "Nhà cung cấp không hợp lệ.");
    valid = false;
  }

  if (data.mo_ta.length > 500) {
    showError(inputs.mo_ta, "Mô tả không được vượt quá 500 ký tự.");
    valid = false;
  } else if (data.mo_ta && !descriptionRegex.test(data.mo_ta)) {
    showError(inputs.mo_ta, "Mô tả chứa ký tự không hợp lệ.");
    valid = false;
  }

  return valid;
}

// ==================================================
// VALIDATE THÔNG TIN BỔ SUNG
// ==================================================

function validateVaccineExtra(
  data,
  imageInput,
  detailInput,
  sourceInput
) {
  let valid = validateVaccineImage(imageInput);

  clearError(detailInput);
  clearError(sourceInput);

  if (data.noi_dung_chi_tiet.length > 60000) {
    showError(
      detailInput,
      "Nội dung chi tiết không được vượt quá 60000 ký tự."
    );
    valid = false;
  }

  if (data.nguon_tham_khao.length > 10000) {
    showError(
      sourceInput,
      "Nguồn tham khảo không được vượt quá 10000 ký tự."
    );
    valid = false;
  }

  return valid;
}

// ==================================================
// LẤY DỮ LIỆU FORM
// ==================================================

function getAddFormData() {
  return {
    ten_vaccine: tenVaccineInput.value.trim(),
    phong_benh: phongBenhInput.value.trim(),
    loai_doi_tuong: loaiDoiTuongInput.value,
    nuoc_sx: nuocSXInput.value.trim(),
    nha_cung_cap: nhaCungCapInput.value.trim(),
    mo_ta: moTaInput.value.trim(),
    noi_dung_chi_tiet: addDetailInput.value.trim(),
    nguon_tham_khao: addSourceInput.value.trim()
  };
}

function getAddInputs() {
  return {
    ten_vaccine: tenVaccineInput,
    phong_benh: phongBenhInput,
    loai_doi_tuong: loaiDoiTuongInput,
    nuoc_sx: nuocSXInput,
    nha_cung_cap: nhaCungCapInput,
    mo_ta: moTaInput
  };
}

function getEditFormData() {
  return {
    ten_vaccine: editTenVaccineInput.value.trim(),
    phong_benh: editPhongBenhInput.value.trim(),
    loai_doi_tuong: editLoaiDoiTuongInput.value,
    nuoc_sx: editNuocSXInput.value.trim(),
    nha_cung_cap: editNhaCungCapInput.value.trim(),
    mo_ta: editMoTaInput.value.trim(),
    noi_dung_chi_tiet: editDetailInput.value.trim(),
    nguon_tham_khao: editSourceInput.value.trim()
  };
}

function getEditInputs() {
  return {
    ten_vaccine: editTenVaccineInput,
    phong_benh: editPhongBenhInput,
    loai_doi_tuong: editLoaiDoiTuongInput,
    nuoc_sx: editNuocSXInput,
    nha_cung_cap: editNhaCungCapInput,
    mo_ta: editMoTaInput
  };
}

function buildVaccineFormData(payload, imageInput) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, value ?? "");
  });

  const file = imageInput.files[0];

  if (file) {
    formData.append("hinh_anh", file);
  }

  return formData;
}

// ==================================================
// MODAL THÊM
// ==================================================

function moModalThemVaccine() {
  vaccineForm.reset();
  loaiDoiTuongInput.value = "CA_HAI";

  clearFormErrors([
    ...Object.values(getAddInputs()),
    addImageInput,
    addDetailInput,
    addSourceInput
  ]);

  hideImagePreview(addImagePreview);
  chuyenTabVaccine("vaccineForm", "basic");

  addModal.classList.add("show");
  document.body.classList.add("modal-open");

  setTimeout(() => tenVaccineInput.focus(), 100);
}

function dongModalThemVaccine() {
  addModal.classList.remove("show");
  document.body.classList.remove("modal-open");

  vaccineForm.reset();
  loaiDoiTuongInput.value = "CA_HAI";

  hideImagePreview(addImagePreview);

  clearFormErrors([
    ...Object.values(getAddInputs()),
    addImageInput,
    addDetailInput,
    addSourceInput
  ]);

  chuyenTabVaccine("vaccineForm", "basic");
}

// ==================================================
// MODAL CẬP NHẬT
// ==================================================

function moModalCapNhat(id) {
  const vaccine = danhSachVaccine.find(
    item => Number(item.id) === Number(id)
  );

  if (!vaccine) {
    alert("Không tìm thấy vaccine cần cập nhật.");
    return;
  }

  editVaccineForm.reset();

  editIdInput.value = vaccine.id;
  editTenVaccineInput.value = vaccine.ten_vaccine || "";
  editPhongBenhInput.value = vaccine.phong_benh || "";
  editLoaiDoiTuongInput.value = vaccine.loai_doi_tuong || "CA_HAI";
  editNuocSXInput.value = vaccine.nuoc_sx || "";
  editNhaCungCapInput.value = vaccine.nha_cung_cap || "";
  editMoTaInput.value = vaccine.mo_ta || "";

  editDetailInput.value = vaccine.noi_dung_chi_tiet || "";
  editSourceInput.value = vaccine.nguon_tham_khao || "";

  editImageInput.value = "";

  showImagePreview(
    editImagePreview,
    getVaccineImageUrl(vaccine.hinh_anh)
  );

  clearFormErrors([
    ...Object.values(getEditInputs()),
    editImageInput,
    editDetailInput,
    editSourceInput
  ]);

  chuyenTabVaccine("editVaccineForm", "basic");

  editModal.classList.add("show");
  document.body.classList.add("modal-open");

  setTimeout(() => editTenVaccineInput.focus(), 100);
}

function dongModalCapNhat() {
  editModal.classList.remove("show");
  document.body.classList.remove("modal-open");

  editVaccineForm.reset();
  editIdInput.value = "";

  hideImagePreview(editImagePreview);

  clearFormErrors([
    ...Object.values(getEditInputs()),
    editImageInput,
    editDetailInput,
    editSourceInput
  ]);

  chuyenTabVaccine("editVaccineForm", "basic");
}

// ==================================================
// RENDER DANH SÁCH
// ==================================================

function renderVaccines(data) {
  vaccineBody.innerHTML = "";

  if (!data.length) {
    vaccineBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-row">
          Không tìm thấy vaccine phù hợp.
        </td>
      </tr>
    `;
    return;
  }

  data.forEach((item, index) => {
    const row = document.createElement("tr");
    const encodedName = encodeURIComponent(item.ten_vaccine || "");

    const moTa = item.mo_ta
      ? escapeHtml(item.mo_ta)
      : "—";

    row.innerHTML = `
      <td data-label="STT">${index + 1}</td>

      <td data-label="Tên vaccine">
        <span class="vaccine-name">
          ${escapeHtml(item.ten_vaccine || "")}
        </span>
      </td>

      <td data-label="Phòng bệnh">
        ${escapeHtml(item.phong_benh || "—")}
      </td>

      <td data-label="Đối tượng">
        ${escapeHtml(getDoiTuongText(item.loai_doi_tuong))}
      </td>

      <td data-label="Nước SX">
        ${escapeHtml(item.nuoc_sx || "—")}
      </td>

      <td data-label="Nhà cung cấp">
        ${escapeHtml(item.nha_cung_cap || "—")}
      </td>

      <td data-label="Trạng thái">
        ${getTrangThaiHtml(item.trang_thai)}
      </td>

      <td
        data-label="Mô tả"
        class="description-cell"
        title="${escapeHtml(item.mo_ta || "")}"
      >
        ${moTa}
      </td>

      <td data-label="Thao tác">
        <div class="actions">

          <button
            type="button"
            class="btn-edit"
            onclick="moModalCapNhat(${Number(item.id)})"
          >
            Cập nhật
          </button>

          ${item.trang_thai === "NGUNG"
        ? `
                <button
                  type="button"
                  class="btn-activate"
                  onclick="kichHoatVaccine(
                    ${Number(item.id)},
                    '${encodedName}'
                  )"
                >
                  Kích hoạt lại
                </button>
              `
        : `
                <button
                  type="button"
                  class="btn-stop"
                  onclick="ngungVaccine(
                    ${Number(item.id)},
                    '${encodedName}'
                  )"
                >
                  Ngừng sử dụng
                </button>
              `
      }

        </div>
      </td>
    `;

    vaccineBody.appendChild(row);
  });
}

// ==================================================
// TÌM KIẾM VÀ LỌC
// ==================================================

function locDanhSachVaccine() {
  const keyword = searchVaccine.value
    .trim()
    .toLocaleLowerCase("vi");

  const status = filterTrangThai.value;

  const filtered = danhSachVaccine.filter(item => {
    const ten = String(item.ten_vaccine || "")
      .toLocaleLowerCase("vi");

    const benh = String(item.phong_benh || "")
      .toLocaleLowerCase("vi");

    const nhaCungCap = String(item.nha_cung_cap || "")
      .toLocaleLowerCase("vi");

    const nuocSX = String(item.nuoc_sx || "")
      .toLocaleLowerCase("vi");

    const matchKeyword =
      !keyword ||
      ten.includes(keyword) ||
      benh.includes(keyword) ||
      nhaCungCap.includes(keyword) ||
      nuocSX.includes(keyword);

    const matchStatus =
      status === "ALL" ||
      item.trang_thai === status;

    return matchKeyword && matchStatus;
  });

  renderVaccines(filtered);
}

// ==================================================
// LOAD DANH SÁCH
// ==================================================

async function loadVaccines() {
  try {
    vaccineBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-row">
          Đang tải dữ liệu...
        </td>
      </tr>
    `;

    const response = await fetch(API_VACCINE);
    const result = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        result?.message || "Không tải được danh sách vaccine."
      );
    }

    danhSachVaccine = Array.isArray(result) ? result : [];

    locDanhSachVaccine();

  } catch (error) {
    console.error("Lỗi tải danh sách vaccine:", error);

    danhSachVaccine = [];

    vaccineBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-row">
          Không tải được dữ liệu vaccine.
        </td>
      </tr>
    `;

    alert(error.message);
  }
}

// ==================================================
// THÊM VACCINE
// ==================================================

vaccineForm.addEventListener("submit", async event => {
  event.preventDefault();

  const payload = getAddFormData();

  const validBasic = validateVaccineData(
    payload,
    getAddInputs()
  );

  const validExtra = validateVaccineExtra(
    payload,
    addImageInput,
    addDetailInput,
    addSourceInput
  );

  if (!validBasic || !validExtra) {
    if (!validBasic) {
      chuyenTabVaccine("vaccineForm", "basic");
    } else if (
      addDetailInput.classList.contains("input-error") ||
      addSourceInput.classList.contains("input-error")
    ) {
      chuyenTabVaccine("vaccineForm", "detail");
    } else {
      chuyenTabVaccine("vaccineForm", "basic");
    }

    return;
  }

  try {
    const response = await fetch(API_VACCINE, {
      method: "POST",
      headers: getAdminHeaders(),
      body: buildVaccineFormData(payload, addImageInput)
    });

    const result = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        result.message || "Thêm vaccine thất bại."
      );
    }

    alert(result.message || "Thêm vaccine thành công.");

    dongModalThemVaccine();
    await loadVaccines();

  } catch (error) {
    console.error("Lỗi thêm vaccine:", error);
    alert(error.message);
  }
});

// ==================================================
// CẬP NHẬT VACCINE
// ==================================================

editVaccineForm.addEventListener("submit", async event => {
  event.preventDefault();

  const id = Number(editIdInput.value);

  if (!Number.isInteger(id) || id <= 0) {
    alert("Không xác định được vaccine cần cập nhật.");
    return;
  }

  const payload = getEditFormData();

  const validBasic = validateVaccineData(
    payload,
    getEditInputs()
  );

  const validExtra = validateVaccineExtra(
    payload,
    editImageInput,
    editDetailInput,
    editSourceInput
  );

  if (!validBasic || !validExtra) {
    if (!validBasic) {
      chuyenTabVaccine("editVaccineForm", "basic");
    } else if (
      editDetailInput.classList.contains("input-error") ||
      editSourceInput.classList.contains("input-error")
    ) {
      chuyenTabVaccine("editVaccineForm", "detail");
    } else {
      chuyenTabVaccine("editVaccineForm", "basic");
    }

    return;
  }

  const confirmed = confirm(
    "Bạn có chắc muốn cập nhật thông tin vaccine này?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${API_VACCINE}/${id}`, {
      method: "PUT",
      headers: getAdminHeaders(),
      body: buildVaccineFormData(payload, editImageInput)
    });

    const result = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        result.message || "Cập nhật vaccine thất bại."
      );
    }

    alert(result.message || "Cập nhật vaccine thành công.");

    dongModalCapNhat();
    await loadVaccines();

  } catch (error) {
    console.error("Lỗi cập nhật vaccine:", error);
    alert(error.message);
  }
});

// ==================================================
// NGỪNG SỬ DỤNG
// ==================================================

async function ngungVaccine(id, encodedName) {
  const vaccineName = decodeURIComponent(encodedName);

  const confirmed = confirm(
    `Bạn có chắc muốn ngừng sử dụng vaccine "${vaccineName}"?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_VACCINE}/${id}/stop`,
      {
        method: "PATCH",
        headers: getAdminHeaders()
      }
    );

    const result = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        result.message || "Ngừng sử dụng vaccine thất bại."
      );
    }

    alert(result.message || "Đã ngừng sử dụng vaccine.");

    await loadVaccines();

  } catch (error) {
    console.error("Lỗi ngừng sử dụng vaccine:", error);
    alert(error.message);
  }
}

// ==================================================
// KÍCH HOẠT LẠI
// ==================================================

async function kichHoatVaccine(id, encodedName) {
  const vaccineName = decodeURIComponent(encodedName);

  const confirmed = confirm(
    `Bạn có chắc muốn kích hoạt lại vaccine "${vaccineName}"?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_VACCINE}/${id}/activate`,
      {
        method: "PATCH",
        headers: getAdminHeaders()
      }
    );

    const result = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        result.message || "Kích hoạt lại vaccine thất bại."
      );
    }

    alert(result.message || "Kích hoạt lại vaccine thành công.");

    await loadVaccines();

  } catch (error) {
    console.error("Lỗi kích hoạt lại vaccine:", error);
    alert(error.message);
  }
}

// ==================================================
// EVENT TÌM KIẾM VÀ LỌC
// ==================================================

searchVaccine.addEventListener("input", locDanhSachVaccine);
filterTrangThai.addEventListener("change", locDanhSachVaccine);

// ==================================================
// EVENT HÌNH ẢNH
// ==================================================

addImageInput.addEventListener("change", () => {
  previewSelectedImage(
    addImageInput,
    addImagePreview
  );
});

editImageInput.addEventListener("change", () => {
  const vaccine = danhSachVaccine.find(
    item => Number(item.id) === Number(editIdInput.value)
  );

  const oldImageUrl = getVaccineImageUrl(
    vaccine?.hinh_anh
  );

  previewSelectedImage(
    editImageInput,
    editImagePreview,
    oldImageUrl
  );
});

// ==================================================
// ĐÓNG MODAL KHI CLICK BÊN NGOÀI
// ==================================================

addModal.addEventListener("click", event => {
  if (event.target === addModal) {
    dongModalThemVaccine();
  }
});

editModal.addEventListener("click", event => {
  if (event.target === editModal) {
    dongModalCapNhat();
  }
});

// ==================================================
// ESC ĐÓNG MODAL
// ==================================================

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;

  if (addModal.classList.contains("show")) {
    dongModalThemVaccine();
  }

  if (editModal.classList.contains("show")) {
    dongModalCapNhat();
  }
});

// ==================================================
// XÓA ERROR KHI NHẬP LẠI
// ==================================================

[
  tenVaccineInput,
  phongBenhInput,
  nhaCungCapInput,
  moTaInput,
  addDetailInput,
  addSourceInput,
  editTenVaccineInput,
  editPhongBenhInput,
  editNhaCungCapInput,
  editMoTaInput,
  editDetailInput,
  editSourceInput
].forEach(input => {
  input.addEventListener("input", () => clearError(input));
});


// Select đối tượng
[
  loaiDoiTuongInput,
  editLoaiDoiTuongInput
].forEach(input => {
  input.addEventListener("change", () => clearError(input));
});

// Combobox nước sản xuất
[
  nuocSXInput,
  editNuocSXInput
].forEach(input => {
  input.addEventListener("input", () => clearError(input));
});

// ==================================================
// GLOBAL - HTML ONCLICK
// ==================================================

window.moModalThemVaccine = moModalThemVaccine;
window.dongModalThemVaccine = dongModalThemVaccine;
window.moModalCapNhat = moModalCapNhat;
window.dongModalCapNhat = dongModalCapNhat;
window.ngungVaccine = ngungVaccine;
window.kichHoatVaccine = kichHoatVaccine;

// ==================================================
// LOAD BAN ĐẦU
// ==================================================

loadVaccines();
