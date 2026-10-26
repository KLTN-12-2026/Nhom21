const token = localStorage.getItem("token");

let user = null;

try {
  user = JSON.parse(localStorage.getItem("user"));
} catch (error) {
  user = null;
}

if (!user || !token) {
  alert("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại!");

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.top.location.href = new URL(
    "../common/dangnhap.html",
    window.location.href
  ).href;

  throw new Error("Chưa đăng nhập");
}

// ============================
// 2. LẤY CÁC Ô INPUT
// ============================
const hoSoForm = document.getElementById("hoSoForm");
const hoTenInput = document.getElementById("hoTenInput");
const ngaySinhInput = document.getElementById("ngaySinhInput");
const gioiTinhSelect = document.getElementById("gioiTinhInput");
const sdtInput = document.getElementById("sdtInput");
const emailInput = document.getElementById("emailInput");
const diaChiInput = document.getElementById("diaChiInput");
const btnSave = document.getElementById("btnSaveProfile");

// ============================
// 3. HÀM DÙNG CHUNG
// ============================
const fullNameRegex = /^[A-Za-zÀ-ỹ]+(?:\s[A-Za-zÀ-ỹ]+)*$/;
const phoneRegex = /^0\d{9}$/;
const emailRegex = /^[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const addressRegex = /^[A-Za-zÀ-ỹ0-9](?:[A-Za-zÀ-ỹ0-9\s,./-]{3,98})[A-Za-zÀ-ỹ0-9]$/;

function isEmpty(v) {
  return !v || v.toString().trim() === "";
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAgeFromDate(dateString) {
  const today = new Date();
  const birthDate = new Date(dateString);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function formatDateOnly(value) {
  if (!value) return "";

  const str = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  const d = new Date(value);
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAuthHeaders(includeJson = false) {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

// ============================
// 4. HIỂN THỊ / XÓA LỖI
// ============================
function getOrCreateErrorElement(input) {
  if (!input) return null;

  const formGroup = input.closest(".form-group");
  if (!formGroup) return null;

  let errorEl = formGroup.querySelector(`.error-message[data-for="${input.id}"]`);

  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.className = "error-message";
    errorEl.setAttribute("data-for", input.id);
    formGroup.appendChild(errorEl);
  }

  return errorEl;
}

function showError(input, message) {
  if (!input) return;
  const errorEl = getOrCreateErrorElement(input);
  if (errorEl) {
    errorEl.textContent = message;
  }
  input.classList.add("input-error");
  input.classList.remove("input-success");
}

function clearError(input) {
  if (!input) return;

  const formGroup = input.closest(".form-group");
  if (!formGroup) return;

  const errorEl = formGroup.querySelector(`.error-message[data-for="${input.id}"]`);
  if (errorEl) {
    errorEl.textContent = "";
  }

  input.classList.remove("input-error");
  input.classList.remove("input-success");
}

// ============================
// 4.1. THÔNG BÁO CHUNG CHO FORM
// ============================
function getOrCreateFormMessage() {
  if (!hoSoForm) return null;

  let box = document.getElementById("profileFormMessage");
  if (box) return box;

  box = document.createElement("div");
  box.id = "profileFormMessage";
  box.style.marginTop = "10px";
  box.style.fontSize = "13px";
  box.style.lineHeight = "1.45";

  const actions = hoSoForm.querySelector(".actions");
  if (actions && actions.parentNode) {
    actions.parentNode.insertBefore(box, actions.nextSibling);
  } else {
    hoSoForm.appendChild(box);
  }

  return box;
}

function showFormMessage(message, type = "error") {
  const box = getOrCreateFormMessage();
  if (!box) return;

  box.textContent = message || "";
  box.style.color = type === "success" ? "#15803d" : "#e53935";
}

function clearFormMessage() {
  const box = document.getElementById("profileFormMessage");
  if (box) {
    box.textContent = "";
  }
}

// ============================
// 5. VALIDATE THÔNG TIN CÁ NHÂN
// ============================
function validateHoTen() {
  if (!hoTenInput) return true;
  const value = hoTenInput.value;

  if (isEmpty(value)) {
    showError(hoTenInput, "Vui lòng nhập họ tên.");
    return false;
  }

  if (value !== value.trim()) {
    showError(hoTenInput, "Họ tên không được có khoảng trắng ở đầu hoặc cuối.");
    return false;
  }

  if (value.trim().length < 2 || value.trim().length > 50) {
    showError(hoTenInput, "Họ tên phải từ 2 đến 50 ký tự.");
    return false;
  }

  if (!fullNameRegex.test(value.trim())) {
    showError(hoTenInput, "Họ tên không được chứa số hoặc ký tự đặc biệt.");
    return false;
  }

  clearError(hoTenInput);
  return true;
}

function validateNgaySinh() {
  if (!ngaySinhInput) return true;
  const value = ngaySinhInput.value;

  if (isEmpty(value)) {
    showError(ngaySinhInput, "Vui lòng chọn ngày sinh.");
    return false;
  }

  if (value > getTodayString()) {
    showError(ngaySinhInput, "Ngày sinh không được lớn hơn ngày hiện tại.");
    return false;
  }

  const age = getAgeFromDate(value);
  if (age < 0 || age > 120) {
    showError(ngaySinhInput, "Ngày sinh không hợp lệ.");
    return false;
  }

  clearError(ngaySinhInput);
  return true;
}

function validateGioiTinh() {
  if (!gioiTinhSelect) return true;
  const value = gioiTinhSelect.value;

  if (isEmpty(value)) {
    showError(gioiTinhSelect, "Vui lòng chọn giới tính.");
    return false;
  }

  clearError(gioiTinhSelect);
  return true;
}

function validateSdt() {
  if (!sdtInput) return true;
  const value = sdtInput.value;

  if (isEmpty(value)) {
    showError(sdtInput, "Vui lòng nhập số điện thoại.");
    return false;
  }

  if (value !== value.trim()) {
    showError(sdtInput, "Số điện thoại không được có khoảng trắng ở đầu hoặc cuối.");
    return false;
  }

  if (!phoneRegex.test(value.trim())) {
    showError(sdtInput, "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.");
    return false;
  }

  clearError(sdtInput);
  return true;
}

function validateEmail() {
  if (!emailInput) return true;
  const value = emailInput.value;

  if (isEmpty(value)) {
    showError(emailInput, "Vui lòng nhập email.");
    return false;
  }

  if (value !== value.trim()) {
    showError(emailInput, "Email không được có khoảng trắng ở đầu hoặc cuối.");
    return false;
  }

  if (/^[^A-Za-z0-9]/.test(value) || /[^A-Za-z0-9]$/.test(value)) {
    showError(emailInput, "Email không được bắt đầu hoặc kết thúc bằng ký tự đặc biệt.");
    return false;
  }

  if (value.trim().length > 100) {
    showError(emailInput, "Email không được vượt quá 100 ký tự.");
    return false;
  }

  if (!emailRegex.test(value.trim())) {
    showError(emailInput, "Email không hợp lệ.");
    return false;
  }

  clearError(emailInput);
  return true;
}

function validateDiaChi() {
  if (!diaChiInput) return true;
  const value = diaChiInput.value;

  if (isEmpty(value)) {
    showError(diaChiInput, "Vui lòng nhập địa chỉ.");
    return false;
  }

  if (value !== value.trim()) {
    showError(diaChiInput, "Địa chỉ không được có khoảng trắng ở đầu hoặc cuối.");
    return false;
  }

  if (value.trim().length < 5 || value.trim().length > 100) {
    showError(diaChiInput, "Địa chỉ phải từ 5 đến 100 ký tự.");
    return false;
  }

  if (!addressRegex.test(value.trim())) {
    showError(diaChiInput, "Địa chỉ chỉ được chứa chữ, số và các dấu , . / -; không được ở đầu hoặc cuối.");
    return false;
  }

  clearError(diaChiInput);
  return true;
}

function validateProfileForm() {
  const isHoTenValid = validateHoTen();
  const isNgaySinhValid = validateNgaySinh();
  const isGioiTinhValid = validateGioiTinh();
  const isSdtValid = validateSdt();
  const isEmailValid = validateEmail();
  const isDiaChiValid = validateDiaChi();

  return (
    isHoTenValid &&
    isNgaySinhValid &&
    isGioiTinhValid &&
    isSdtValid &&
    isEmailValid &&
    isDiaChiValid
  );
}

// ============================
// 6. REALTIME VALIDATION THÔNG TIN CÁ NHÂN
// ============================
if (ngaySinhInput) {
  ngaySinhInput.max = getTodayString();
}

if (hoTenInput) {
  hoTenInput.addEventListener("input", () => {
    clearFormMessage();
    if (hoTenInput.value.trim()) {
      validateHoTen();
    } else {
      clearError(hoTenInput);
    }
  });

  hoTenInput.addEventListener("blur", validateHoTen);
}

if (ngaySinhInput) {
  ngaySinhInput.addEventListener("change", () => {
    clearFormMessage();
    validateNgaySinh();
  });
  ngaySinhInput.addEventListener("blur", validateNgaySinh);
}

if (gioiTinhSelect) {
  gioiTinhSelect.addEventListener("change", () => {
    clearFormMessage();
    validateGioiTinh();
  });
}

if (sdtInput) {
  sdtInput.addEventListener("input", () => {
    clearFormMessage();
    if (sdtInput.value.trim()) {
      validateSdt();
    } else {
      clearError(sdtInput);
    }
  });

  sdtInput.addEventListener("blur", validateSdt);
}

if (emailInput) {
  emailInput.addEventListener("input", () => {
    clearFormMessage();
    if (emailInput.value.trim()) {
      validateEmail();
    } else {
      clearError(emailInput);
    }
  });

  emailInput.addEventListener("blur", validateEmail);
}

if (diaChiInput) {
  diaChiInput.addEventListener("input", () => {
    clearFormMessage();
    if (diaChiInput.value.trim()) {
      validateDiaChi();
    } else {
      clearError(diaChiInput);
    }
  });

  diaChiInput.addEventListener("blur", validateDiaChi);
}

// ============================
// 7. ĐỔ DỮ LIỆU TỪ LOCALSTORAGE
// ============================
function fillProfileFromLocalUser() {
  if (!user) return;

  if (hoTenInput) hoTenInput.value = user.full_name || "";
  if (sdtInput) sdtInput.value = user.phone || "";
  if (emailInput) emailInput.value = user.email || "";
  if (ngaySinhInput) {
    ngaySinhInput.value = user.ngay_sinh ? formatDateOnly(user.ngay_sinh) : "";
  }
  if (gioiTinhSelect) gioiTinhSelect.value = user.gioi_tinh || "";
  if (diaChiInput) diaChiInput.value = user.dia_chi || "";
}

// ============================
// 8. LOAD PROFILE TỪ API
// ============================
async function loadProfile() {
  try {
    fillProfileFromLocalUser();

    const res = await fetch(`http://localhost:3000/api/hoso/profile/${user.id}`, {
      headers: getAuthHeaders()
    });

    // Kiểm tra JWT hết hạn
    if (await checkAuthResponse(res)) return;

    if (!res.ok) {
      console.warn("⚠ Không load được profile, mã:", res.status);
      return;
    }

    const data = await res.json();

    if (hoTenInput) hoTenInput.value = data.ho_ten || hoTenInput.value;
    if (ngaySinhInput) {
      ngaySinhInput.value = data.ngay_sinh ? formatDateOnly(data.ngay_sinh) : ngaySinhInput.value;
    }
    if (gioiTinhSelect) gioiTinhSelect.value = data.gioi_tinh || gioiTinhSelect.value;
    if (sdtInput) sdtInput.value = data.so_dien_thoai || sdtInput.value;
    if (emailInput) emailInput.value = data.email || emailInput.value;
    if (diaChiInput) diaChiInput.value = data.dia_chi || diaChiInput.value;
  } catch (err) {
    console.error("❌ Lỗi load profile:", err);
  }
}

// ============================
// 8.1. MAP LỖI SERVER -> FIELD
// ============================
function applyServerFieldError(message) {
  const msg = String(message || "").toLowerCase();

  if (msg.includes("họ tên")) {
    showError(hoTenInput, message);
    hoTenInput?.focus();
    return true;
  }

  if (msg.includes("ngày sinh")) {
    showError(ngaySinhInput, message);
    ngaySinhInput?.focus();
    return true;
  }

  if (msg.includes("giới tính")) {
    showError(gioiTinhSelect, message);
    gioiTinhSelect?.focus();
    return true;
  }

  if (
    msg.includes("số điện thoại") ||
    msg.includes("so_dien_thoai") ||
    msg.includes("điện thoại")
  ) {
    showError(sdtInput, message);
    sdtInput?.focus();
    return true;
  }

  if (msg.includes("email")) {
    showError(emailInput, message);
    emailInput?.focus();
    return true;
  }

  if (msg.includes("địa chỉ") || msg.includes("dia_chi")) {
    showError(diaChiInput, message);
    diaChiInput?.focus();
    return true;
  }

  return false;
}

// ============================
// 9. LƯU THÔNG TIN CÁ NHÂN
// ============================
async function submitProfileUpdate() {
  clearFormMessage();

  if (!validateProfileForm()) {
    showFormMessage("Vui lòng kiểm tra lại thông tin đã nhập.");
    return;
  }

  const body = {
    ho_ten: hoTenInput.value.trim(),
    ngay_sinh: ngaySinhInput.value || null,
    gioi_tinh: gioiTinhSelect.value,
    so_dien_thoai: sdtInput.value.trim(),
    email: emailInput.value,
    dia_chi: diaChiInput.value.trim(),
  };

  const oldText = btnSave ? btnSave.innerHTML : "";

  try {
    if (btnSave) {
      btnSave.disabled = true;
      btnSave.innerHTML = "Đang lưu...";
    }

    const res = await fetch(`http://localhost:3000/api/hoso/profile/${user.id}`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify(body),
    });

    // Kiểm tra JWT hết hạn
    if (await checkAuthResponse(res)) return;

    const data = await res.json();

    if (!res.ok) {
      const errorMessage = data.message || "Cập nhật thất bại";

      if (!applyServerFieldError(errorMessage)) {
        showFormMessage(errorMessage);
      }
      return;
    }

    user.full_name = body.ho_ten;
    user.phone = body.so_dien_thoai;
    user.email = body.email;
    user.ngay_sinh = body.ngay_sinh;
    user.gioi_tinh = body.gioi_tinh;
    user.dia_chi = body.dia_chi;
    localStorage.setItem("user", JSON.stringify(user));

    clearFormMessage();
    alert(data.message || "Cập nhật thông tin cá nhân thành công");

  } catch (err) {
    console.error("❌ Lỗi lưu profile:", err);
    showFormMessage("Không kết nối được server.");
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML = oldText;
    }
  }
}

if (hoSoForm) {
  hoSoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitProfileUpdate();
  });
}

if (btnSave) {
  btnSave.addEventListener("click", async (e) => {
    e.preventDefault();
    await submitProfileUpdate();
  });
}

/* =========================================================
   ĐỔI MẬT KHẨU
========================================================= */

const changePasswordForm =
  document.getElementById("changePasswordForm");

const currentPasswordInput =
  document.getElementById("currentPasswordInput");

const newPasswordInput =
  document.getElementById("newPasswordInput");

const confirmPasswordInput =
  document.getElementById("confirmPasswordInput");

const btnChangePassword =
  document.getElementById("btnChangePassword");


/* =========================================================
   REGEX MẬT KHẨU
========================================================= */

const changePasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])\S{8,32}$/;


/* =========================================================
   HIỂN THỊ LỖI
========================================================= */

function showPasswordError(input, message) {
  if (!input) return;

  const errorElement = document.querySelector(
    `.error-message[data-for="${input.id}"]`
  );

  if (errorElement) {
    errorElement.textContent = message;
  }

  input.classList.add("input-error");
  input.classList.remove("input-success");
}


function clearPasswordError(input) {
  if (!input) return;

  const errorElement = document.querySelector(
    `.error-message[data-for="${input.id}"]`
  );

  if (errorElement) {
    errorElement.textContent = "";
  }

  input.classList.remove("input-error");
}


function showPasswordSuccess(input) {
  if (!input) return;

  clearPasswordError(input);

  input.classList.add("input-success");
}


/* =========================================================
   VALIDATE MẬT KHẨU HIỆN TẠI
========================================================= */

function validateCurrentPassword() {
  const currentPassword =
    currentPasswordInput.value;

  if (!currentPassword) {
    showPasswordError(
      currentPasswordInput,
      "Vui lòng nhập mật khẩu hiện tại."
    );

    return false;
  }

  if (
    currentPassword !== currentPassword.trim() ||
    /\s/.test(currentPassword)
  ) {
    showPasswordError(
      currentPasswordInput,
      "Mật khẩu hiện tại không được chứa khoảng trắng."
    );

    return false;
  }

  clearPasswordError(currentPasswordInput);

  return true;
}


/* =========================================================
   VALIDATE MẬT KHẨU MỚI
========================================================= */

function validateNewPassword() {
  const currentPassword =
    currentPasswordInput.value;

  const newPassword =
    newPasswordInput.value;

  if (!newPassword) {
    showPasswordError(
      newPasswordInput,
      "Vui lòng nhập mật khẩu mới."
    );

    return false;
  }

  if (
    newPassword !== newPassword.trim() ||
    /\s/.test(newPassword)
  ) {
    showPasswordError(
      newPasswordInput,
      "Mật khẩu mới không được chứa khoảng trắng."
    );

    return false;
  }

  if (!changePasswordRegex.test(newPassword)) {
    showPasswordError(
      newPasswordInput,
      "Mật khẩu phải từ 8-32 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)."
    );

    return false;
  }

  if (
    currentPassword &&
    newPassword === currentPassword
  ) {
    showPasswordError(
      newPasswordInput,
      "Mật khẩu mới phải khác mật khẩu hiện tại."
    );

    return false;
  }

  showPasswordSuccess(newPasswordInput);

  return true;
}


/* =========================================================
   VALIDATE XÁC NHẬN MẬT KHẨU
========================================================= */

function validateConfirmPassword() {
  const newPassword =
    newPasswordInput.value;

  const confirmPassword =
    confirmPasswordInput.value;

  if (!confirmPassword) {
    showPasswordError(
      confirmPasswordInput,
      "Vui lòng xác nhận mật khẩu mới."
    );

    return false;
  }

  if (
    confirmPassword !== confirmPassword.trim() ||
    /\s/.test(confirmPassword)
  ) {
    showPasswordError(
      confirmPasswordInput,
      "Xác nhận mật khẩu không được chứa khoảng trắng."
    );

    return false;
  }

  if (newPassword !== confirmPassword) {
    showPasswordError(
      confirmPasswordInput,
      "Xác nhận mật khẩu mới không khớp."
    );

    return false;
  }

  showPasswordSuccess(confirmPasswordInput);

  return true;
}


/* =========================================================
   VALIDATE TOÀN BỘ FORM
========================================================= */

function validateChangePasswordForm() {
  const currentValid =
    validateCurrentPassword();

  const newValid =
    validateNewPassword();

  const confirmValid =
    validateConfirmPassword();

  return (
    currentValid &&
    newValid &&
    confirmValid
  );
}


/* =========================================================
   XỬ LÝ ĐỔI MẬT KHẨU
========================================================= */


async function changePassword(event) {
  event.preventDefault();

  if (!user || !user.id) {
    alert("Không xác định được tài khoản đang đăng nhập.");
    return;
  }

  if (!validateChangePasswordForm()) {
    return;
  }

  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Lấy JWT đã lưu khi đăng nhập
  const token = localStorage.getItem("token");

  // Kiểm tra JWT trước khi gửi yêu cầu
  if (!token) {
    alert("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
    return;
  }

  try {
    btnChangePassword.disabled = true;
    btnChangePassword.textContent = "Đang đổi...";

    const response = await fetch(
      "http://localhost:3000/api/auth/change-password",
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      }
    );
    // Kiểm tra JWT hết hạn
    if (await checkAuthResponse(response)) {
      return;
    }

    let data = {};

    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }

    if (!response.ok) {
      /*
        Backend có trả field:
        currentPassword
        newPassword
        confirmPassword
      */

      if (data.field === "currentPassword") {
        showPasswordError(
          currentPasswordInput,
          data.message || "Mật khẩu hiện tại không chính xác."
        );

        currentPasswordInput.focus();
      }

      else if (data.field === "newPassword") {
        showPasswordError(
          newPasswordInput,
          data.message || "Mật khẩu mới không hợp lệ."
        );

        newPasswordInput.focus();
      }

      else if (data.field === "confirmPassword") {
        showPasswordError(
          confirmPasswordInput,
          data.message || "Xác nhận mật khẩu không hợp lệ."
        );

        confirmPasswordInput.focus();
      }

      else {
        alert(
          data.message ||
          "Không thể đổi mật khẩu."
        );
      }

      return;
    }

    alert(
      data.message ||
      "Đổi mật khẩu thành công."
    );

    /*
      Xóa dữ liệu sau khi đổi thành công
    */

    changePasswordForm.reset();

    document
      .querySelectorAll(".toggle-password")
      .forEach((button) => {
        button.textContent = "👁";
        button.setAttribute("aria-label", "Hiện mật khẩu");
        button.title = "Hiện mật khẩu";
      });

  } catch (error) {
    console.error(
      "Lỗi đổi mật khẩu:",
      error
    );

    alert(
      "Không thể kết nối đến server. Vui lòng thử lại."
    );

  } finally {
    btnChangePassword.disabled = false;
    btnChangePassword.textContent = "Đổi mật khẩu";
  }
}
document
  .querySelectorAll(".toggle-password")
  .forEach((button) => {
    button.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input");

      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        this.setAttribute("aria-label", "Ẩn mật khẩu");
        this.title = "Ẩn mật khẩu";
      } else {
        input.type = "password";
        this.setAttribute("aria-label", "Hiện mật khẩu");
        this.title = "Hiện mật khẩu";
      }

      // Luôn giữ icon con mắt
      this.textContent = "👁";
    });
  });


/* =========================================================
   EVENT FORM ĐỔI MẬT KHẨU
========================================================= */

if (changePasswordForm) {
  changePasswordForm.addEventListener(
    "submit",
    changePassword
  );
}


/* =========================================================
   VALIDATE KHI NHẬP
========================================================= */

currentPasswordInput?.addEventListener(
  "input",
  () => {
    clearPasswordError(currentPasswordInput);

    if (newPasswordInput.value) {
      validateNewPassword();
    }
  }
);


currentPasswordInput?.addEventListener(
  "blur",
  () => {
    if (currentPasswordInput.value) {
      validateCurrentPassword();
    }
  }
);


newPasswordInput?.addEventListener(
  "input",
  () => {
    clearPasswordError(newPasswordInput);

    if (newPasswordInput.value) {
      validateNewPassword();
    }

    if (confirmPasswordInput.value) {
      validateConfirmPassword();
    }
  }
);


newPasswordInput?.addEventListener(
  "blur",
  () => {
    if (newPasswordInput.value) {
      validateNewPassword();
    }
  }
);


confirmPasswordInput?.addEventListener(
  "input",
  () => {
    clearPasswordError(confirmPasswordInput);

    if (confirmPasswordInput.value) {
      validateConfirmPassword();
    }
  }
);


confirmPasswordInput?.addEventListener(
  "blur",
  () => {
    if (confirmPasswordInput.value) {
      validateConfirmPassword();
    }
  }
);

// // ============================
// // 10. LOAD LỊCH SỬ TIÊM
// // ============================
// async function loadHistory() {
//   if (!tbodyTiem) return;

//   try {
//     const res = await fetch(`http://localhost:3000/api/hoso/user/${user.id}`, {
//       headers: getAuthHeaders()
//     });

//     if (!res.ok) {
//       tbodyTiem.innerHTML = `
//         <tr>
//           <td colspan="5" style="text-align:center;">Không tải được dữ liệu tiêm chủng</td>
//         </tr>
//       `;
//       return;
//     }

//     const list = await res.json();
//     tbodyTiem.innerHTML = "";

//     if (!Array.isArray(list) || list.length === 0) {
//       tbodyTiem.innerHTML = `
//         <tr>
//           <td colspan="6" style="text-align:center;">Chưa có dữ liệu tiêm chủng</td>
//         </tr>
//       `;
//       return;
//     }

//     list.forEach((item) => {
//       const tr = document.createElement("tr");

//       tr.innerHTML = `
//     <td>${item.ho_ten || ""}</td>
//     <td>${item.moi_quan_he || "Bản thân"}</td>
//     <td>${item.ten_vaccine || ""}</td>
//     <td>${item.mui_so ?? ""}</td>
//     <td>${formatDateOnly(item.ngay_tiem)}</td>
//     <td>${item.co_so_tiem || item.ten_co_so || ""}</td>
//   `;

//       tbodyTiem.appendChild(tr);
//     });
//   } catch (err) {
//     console.error("❌ Lỗi load lịch sử tiêm:", err);
//     tbodyTiem.innerHTML = `
//       <tr>
//         <td colspan="5" style="text-align:center;">Không tải được dữ liệu tiêm chủng</td>
//       </tr>
//     `;
//   }
// }

// ============================
// 11. GỌI KHI MỞ TRANG
// ============================
loadProfile();
