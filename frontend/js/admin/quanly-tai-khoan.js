const API_BASE_URL = "http://localhost:3000/api";


const currentUser = JSON.parse(localStorage.getItem("user"));

if (!currentUser) {
  alert("Bạn chưa đăng nhập!");
  window.top.location.href = new URL(
    "pages/khach-hang/dang-nhap.html",
    window.location.origin + "/frontend/"
  ).href;
  throw new Error("Chưa đăng nhập");
}

if (currentUser.vai_tro !== "ADMIN") {
  alert("Bạn không có quyền ADMIN!");
  window.top.location.href = new URL(
    "pages/common/trang-chu.html",
    window.location.origin + "/frontend/"
  ).href;
  throw new Error("Không có quyền ADMIN");
}




const usersBody = document.getElementById("usersBody");
const filterRole = document.getElementById("filterRole");
const keywordInput = document.getElementById("keyword");

const accountModal = document.getElementById("accountModal");
const modalTitle = document.getElementById("modalTitle");
const btnOpenAdd = document.getElementById("btnOpenAdd");
const btnCloseModalTop = document.getElementById("btnCloseModalTop");
const btnCloseModalBottom = document.getElementById("btnCloseModalBottom");
const btnSaveAccount = document.getElementById("btnSaveAccount");

const accountIdInput = document.getElementById("accountId");
const accountUsernameInput = document.getElementById("accountUsername");
const accountPasswordInput = document.getElementById("accountPassword");
const accountRoleInput = document.getElementById("accountRole");
const accountFacilityInput = document.getElementById("accountFacility");
const accountStatusInput = document.getElementById("accountStatus");

const passwordGroup = document.getElementById("passwordGroup");
const facilityGroup = document.getElementById("facilityGroup");



const resetPasswordModal =
  document.getElementById("resetPasswordModal");

const resetUserIdInput =
  document.getElementById("resetUserId");

const resetUsernameInput =
  document.getElementById("resetUsername");

const resetPasswordInput =
  document.getElementById("resetPassword");

const resetPasswordConfirmInput =
  document.getElementById("resetPasswordConfirm");

const btnCloseResetTop =
  document.getElementById("btnCloseResetTop");

const btnCloseResetBottom =
  document.getElementById("btnCloseResetBottom");

const btnResetPassword =
  document.getElementById("btnResetPassword");




let allUsers = [];
let allFacilities = [];

let isEditMode = false;



const usernameRegex =
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d._]{6,30}$/;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])\S{8,32}$/;



function normalizeText(str) {
  return (str || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}


function getHeaders(includeJson = false) {
  const headers = {
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function authFetch(url, options = {}) {
  const response = await fetch(url, options);

  if (await checkAuthResponse(response)) {
    throw new Error("Phiên đăng nhập đã hết hạn");
  }

  return response;
}

function getRoleText(vai_tro) {
  switch (vai_tro) {
    case "ADMIN":
      return "ADMIN";

    case "NHAN_VIEN_Y_TE":
      return "NHÂN VIÊN Y TẾ";

    case "KHACH_HANG":
      return "KHÁCH HÀNG";

    default:
      return vai_tro || "";
  }
}


function getStatusBadge(trang_thai) {
  return trang_thai === "BI_KHOA"
    ? `<span class="status-badge status-locked">Đã khóa</span>`
    : `<span class="status-badge status-active">Hoạt động</span>`;
}


function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    value.toString().trim() === ""
  );
}




function setAccountRoleOptions() {
  accountRoleInput.innerHTML = `
    <option value="">-- Chọn vai trò --</option>
    <option value="NHAN_VIEN_Y_TE">NHÂN VIÊN Y TẾ</option>
  `;
}




function showError(input, message) {
  if (!input) return;

  const formGroup = input.closest(".form-group");

  if (!formGroup) return;

  const errorEl = formGroup.querySelector(
    `.error-message[data-for="${input.id}"]`
  );

  if (errorEl) {
    errorEl.textContent = message;
  }

  input.classList.add("input-error");
}


function clearError(input) {
  if (!input) return;

  const formGroup = input.closest(".form-group");

  if (!formGroup) return;

  const errorEl = formGroup.querySelector(
    `.error-message[data-for="${input.id}"]`
  );

  if (errorEl) {
    errorEl.textContent = "";
  }

  input.classList.remove("input-error");
}


function clearModalErrors() {
  [
    accountUsernameInput,
    accountPasswordInput,
    accountRoleInput,
    accountFacilityInput,
    accountStatusInput
  ].forEach((input) => {
    if (input) {
      clearError(input);
    }
  });
}




function validateUsername() {
  const ten_dang_nhap = accountUsernameInput.value;

  if (isEmpty(ten_dang_nhap)) {
    showError(
      accountUsernameInput,
      "Vui lòng nhập tên đăng nhập."
    );

    return false;
  }

  if (
    ten_dang_nhap !== ten_dang_nhap.trim() ||
    /\s/.test(ten_dang_nhap)
  ) {
    showError(
      accountUsernameInput,
      "Tên đăng nhập không được chứa khoảng trắng."
    );

    return false;
  }

  if (!usernameRegex.test(ten_dang_nhap)) {
    showError(
      accountUsernameInput,
      "Tên đăng nhập phải từ 6-30 ký tự, có chữ và số."
    );

    return false;
  }

  const duplicated = allUsers.find((u) => {
    const sameUsername =
      (u.ten_dang_nhap || "").toLowerCase() ===
      ten_dang_nhap.toLowerCase();

    const sameId =
      String(u.id) ===
      String(accountIdInput.value || "");

    return sameUsername && !sameId;
  });

  if (duplicated) {
    showError(
      accountUsernameInput,
      "Tên đăng nhập đã tồn tại."
    );

    return false;
  }

  clearError(accountUsernameInput);

  return true;
}




function validatePassword() {
  const mat_khau = accountPasswordInput.value;

  if (isEditMode) {
    clearError(accountPasswordInput);
    return true;
  }

  if (isEmpty(mat_khau)) {
    showError(
      accountPasswordInput,
      "Vui lòng nhập mật khẩu."
    );

    return false;
  }

  if (
    mat_khau !== mat_khau.trim() ||
    /\s/.test(mat_khau)
  ) {
    showError(
      accountPasswordInput,
      "Mật khẩu không được chứa khoảng trắng."
    );

    return false;
  }

  if (!passwordRegex.test(mat_khau)) {
    showError(
      accountPasswordInput,
      "Mật khẩu 8-32 ký tự, có hoa, thường, số và ký tự đặc biệt."
    );

    return false;
  }

  clearError(accountPasswordInput);

  return true;
}




function validateRole() {
  const vai_tro = accountRoleInput.value;

  if (isEmpty(vai_tro)) {
    showError(
      accountRoleInput,
      "Vui lòng chọn vai trò."
    );

    return false;
  }

  if (vai_tro !== "NHAN_VIEN_Y_TE") {
    showError(
      accountRoleInput,
      "Chỉ được sử dụng vai trò NHÂN VIÊN Y TẾ."
    );

    return false;
  }

  clearError(accountRoleInput);

  return true;
}




function validateFacility() {
  const co_so_id = accountFacilityInput.value;

  if (isEmpty(co_so_id)) {
    showError(
      accountFacilityInput,
      "Vui lòng chọn cơ sở làm việc."
    );

    return false;
  }

  const facility = allFacilities.find(
    (item) =>
      String(item.id) === String(co_so_id)
  );

  if (!facility) {
    showError(
      accountFacilityInput,
      "Cơ sở làm việc không hợp lệ."
    );

    return false;
  }

  if (facility.trang_thai !== "HOAT_DONG") {
    showError(
      accountFacilityInput,
      "Cơ sở này hiện đang tạm dừng."
    );

    return false;
  }

  clearError(accountFacilityInput);

  return true;
}




function validateAccountForm() {
  const usernameValid = validateUsername();
  const roleValid = validateRole();
  const facilityValid = validateFacility();

  if (isEditMode) {
    return (
      usernameValid &&
      roleValid &&
      facilityValid
    );
  }

  const passwordValid = validatePassword();

  return (
    usernameValid &&
    passwordValid &&
    roleValid &&
    facilityValid
  );
}




async function loadFacilities() {
  try {
    const res = await fetch(
      `${API_BASE_URL}/coso`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
        "Không lấy được danh sách cơ sở"
      );
    }

    allFacilities =
      Array.isArray(data)
        ? data
        : [];

    renderFacilityOptions();

  } catch (err) {
    allFacilities = [];

    accountFacilityInput.innerHTML = `
      <option value="">
        Không tải được danh sách cơ sở
      </option>
    `;

    console.error(
      "Lỗi tải cơ sở:",
      err
    );
  }
}




function renderFacilityOptions(selectedId = "") {
  if (!accountFacilityInput) return;

  const activeFacilities =
    allFacilities.filter(
      (item) =>
        item.trang_thai === "HOAT_DONG"
    );

  accountFacilityInput.innerHTML = `
    <option value="">
      -- Chọn cơ sở tiêm --
    </option>
  `;

  activeFacilities.forEach((item) => {
    const option =
      document.createElement("option");

    option.value = item.id;

    option.textContent =
      item.ten_co_so ||
      `Cơ sở ${item.id}`;

    if (
      String(item.id) ===
      String(selectedId)
    ) {
      option.selected = true;
    }

    accountFacilityInput.appendChild(option);
  });

  
  if (
    selectedId &&
    !activeFacilities.some(
      (item) =>
        String(item.id) === String(selectedId)
    )
  ) {
    const currentFacility =
      allFacilities.find(
        (item) =>
          String(item.id) ===
          String(selectedId)
      );

    if (currentFacility) {
      const option =
        document.createElement("option");

      option.value =
        currentFacility.id;

      option.textContent =
        `${currentFacility.ten_co_so} (Tạm dừng)`;

      option.selected = true;

      accountFacilityInput.appendChild(option);
    }
  }
}



function openAccountModal(user = null) {
  clearModalErrors();

  setAccountRoleOptions();


  if (user) {
    if (user.vai_tro === "KHACH_HANG") {
      alert(
        "Admin không được chỉnh sửa tài khoản khách hàng."
      );

      return;
    }

    if (user.vai_tro === "ADMIN") {
      alert(
        "Không chỉnh sửa tài khoản ADMIN tại chức năng này."
      );

      return;
    }

    isEditMode = true;

    modalTitle.textContent =
      "Sửa tài khoản";

    accountIdInput.value =
      user.id ?? "";

    accountUsernameInput.value =
      user.ten_dang_nhap ?? "";

    accountPasswordInput.value =
      "";

    accountRoleInput.value =
      "NHAN_VIEN_Y_TE";

    accountRoleInput.disabled =
      true;

    renderFacilityOptions(
      user.co_so_id ?? ""
    );

    accountFacilityInput.value =
      user.co_so_id ?? "";

    accountFacilityInput.disabled =
      false;

    accountStatusInput.value =
      user.trang_thai === "BI_KHOA"
        ? "LOCKED"
        : "ACTIVE";

    passwordGroup.style.display =
      "none";

    if (facilityGroup) {
      facilityGroup.style.display = "";
    }
  }


  else {
    isEditMode = false;

    modalTitle.textContent =
      "Thêm tài khoản";

    accountIdInput.value =
      "";

    accountUsernameInput.value =
      "";

    accountPasswordInput.value =
      "";

    accountRoleInput.value =
      "";

    accountStatusInput.value =
      "ACTIVE";

    accountRoleInput.disabled =
      false;

    renderFacilityOptions();

    accountFacilityInput.value =
      "";

    accountFacilityInput.disabled =
      false;

    passwordGroup.style.display =
      "";

    if (facilityGroup) {
      facilityGroup.style.display = "";
    }
  }

  accountModal.classList.add("show");
}


function closeAccountModal() {
  accountModal.classList.remove("show");

  clearModalErrors();

  accountIdInput.value =
    "";

  accountUsernameInput.value =
    "";

  accountPasswordInput.value =
    "";

  accountRoleInput.value =
    "";

  accountStatusInput.value =
    "ACTIVE";

  renderFacilityOptions();

  accountFacilityInput.value =
    "";

  accountFacilityInput.disabled =
    false;

  accountRoleInput.disabled =
    false;

  passwordGroup.style.display =
    "";

  if (facilityGroup) {
    facilityGroup.style.display = "";
  }

  isEditMode = false;
}




function openResetPasswordModal(user) {
  if (!user) return;

  if (
    String(user.id) ===
    String(currentUser.id)
  ) {
    alert(
      "Bạn không thể reset mật khẩu của chính mình tại đây."
    );

    return;
  }

  resetUserIdInput.value =
    user.id;

  resetUsernameInput.value =
    user.ten_dang_nhap || "";

  resetPasswordInput.value =
    "";

  resetPasswordConfirmInput.value =
    "";

  clearError(
    resetPasswordInput
  );

  clearError(
    resetPasswordConfirmInput
  );

  resetPasswordModal.classList.add(
    "show"
  );
}


function closeResetPasswordModal() {
  resetPasswordModal.classList.remove(
    "show"
  );

  resetUserIdInput.value =
    "";

  resetUsernameInput.value =
    "";

  resetPasswordInput.value =
    "";

  resetPasswordConfirmInput.value =
    "";

  clearError(
    resetPasswordInput
  );

  clearError(
    resetPasswordConfirmInput
  );
}


function validateResetPassword() {
  const mat_khau =
    resetPasswordInput.value;

  if (isEmpty(mat_khau)) {
    showError(
      resetPasswordInput,
      "Vui lòng nhập mật khẩu mới."
    );

    return false;
  }

  if (
    mat_khau !== mat_khau.trim() ||
    /\s/.test(mat_khau)
  ) {
    showError(
      resetPasswordInput,
      "Mật khẩu không được chứa khoảng trắng."
    );

    return false;
  }

  if (!passwordRegex.test(mat_khau)) {
    showError(
      resetPasswordInput,
      "Mật khẩu 8-32 ký tự, có hoa, thường, số và ký tự đặc biệt."
    );

    return false;
  }

  clearError(
    resetPasswordInput
  );

  return true;
}


function validateResetPasswordConfirm() {
  const mat_khau =
    resetPasswordInput.value;

  const confirmPassword =
    resetPasswordConfirmInput.value;

  if (isEmpty(confirmPassword)) {
    showError(
      resetPasswordConfirmInput,
      "Vui lòng xác nhận mật khẩu."
    );

    return false;
  }

  if (mat_khau !== confirmPassword) {
    showError(
      resetPasswordConfirmInput,
      "Mật khẩu xác nhận không khớp."
    );

    return false;
  }

  clearError(
    resetPasswordConfirmInput
  );

  return true;
}


async function resetPassword() {
  const id =
    resetUserIdInput.value;

  const ten_dang_nhap =
    resetUsernameInput.value;

  const mat_khau =
    resetPasswordInput.value;

  const passwordValid =
    validateResetPassword();

  const confirmValid =
    validateResetPasswordConfirm();

  if (
    !passwordValid ||
    !confirmValid
  ) {
    return;
  }

  if (
    !confirm(
      `Bạn có chắc muốn reset mật khẩu cho tài khoản "${ten_dang_nhap}" không?`
    )
  ) {
    return;
  }

  try {
    btnResetPassword.disabled =
      true;

    const res = await authFetch(
      `${API_BASE_URL}/users/${id}/reset-password`,
      {
        method: "PATCH",
        headers: getHeaders(true),
        body: JSON.stringify({ mat_khau })
      }
    );

    const data =
      await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
        "Reset mật khẩu thất bại"
      );
    }

    alert(
      data.message ||
      "Reset mật khẩu thành công"
    );

    closeResetPasswordModal();

  } catch (err) {
    alert(
      "Lỗi: " + err.message
    );

  } finally {
    btnResetPassword.disabled =
      false;
  }
}




function getFilteredUsers() {
  const roleVal =
    filterRole
      ? filterRole.value
      : "ALL";

  const key =
    normalizeText(
      keywordInput
        ? keywordInput.value.trim()
        : ""
    );

  let list =
    [...allUsers];

  if (
    roleVal &&
    roleVal !== "ALL"
  ) {
    list = list.filter(
      (u) =>
        u.vai_tro === roleVal
    );
  }

  if (key) {
    list = list.filter(
      (u) =>
        normalizeText(
          u.ten_dang_nhap
        ).includes(key)
    );
  }

  return list;
}


function applyFilters() {
  renderUsers(
    getFilteredUsers()
  );
}



async function loadUsers() {
  try {
    usersBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">
          Đang tải dữ liệu...
        </td>
      </tr>
    `;
    const res = await authFetch(
      `${API_BASE_URL}/users?includeDeleted=1`,
      {
        headers: getHeaders()
      }
    );

    const data =
      await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
        "Không lấy được danh sách tài khoản"
      );
    }

    allUsers =
      Array.isArray(data)
        ? data
        : [];

    applyFilters();

  } catch (err) {
    console.error(
      "Lỗi tải tài khoản:",
      err
    );

    usersBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">
          Lỗi tải dữ liệu: ${err.message}
        </td>
      </tr>
    `;
  }
}



function closeAllActionMenus() {
  document
    .querySelectorAll(
      ".action-dropdown.show"
    )
    .forEach((menu) => {
      menu.classList.remove(
        "show"
      );
    });
}




function renderUsers(list) {
  usersBody.innerHTML =
    "";

  if (
    !list ||
    list.length === 0
  ) {
    usersBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">
          Không có tài khoản
        </td>
      </tr>
    `;

    return;
  }

  list.forEach(
    (u, index) => {
      const tr =
        document.createElement("tr");

      const isSelf =
        String(u.id) ===
        String(currentUser.id);

      const isLocked =
        u.trang_thai ===
        "BI_KHOA";

      const isAdmin =
        u.vai_tro ===
        "ADMIN";

      const isStaff =
        u.vai_tro ===
        "NHAN_VIEN_Y_TE";

      let facilityText = "—";

      if (isStaff) {
        facilityText =
          u.ten_co_so ||
          "Chưa xác định";
      }

      tr.innerHTML = `
            <td data-label="STT" class="text-center">
        ${index + 1}
    </td>

    <td data-label="Tên đăng nhập">
        ${u.ten_dang_nhap ?? ""}
    </td>

    <td data-label="Vai trò" class="text-center">
        ${getRoleText(u.vai_tro)}
    </td>

    <td data-label="Cơ sở làm việc">
        ${facilityText}
    </td>

    <td data-label="Trạng thái" class="text-center">
        ${getStatusBadge(u.trang_thai)}
    </td>

    <td data-label="Thao tác" class="text-center">
        <div class="action-wrap">

            ${isStaff
          ? `
                  <button
                    type="button"
                    class="btn btn-outline btn-edit-user"
                    title="Sửa tài khoản"
                  >
                    <span class="material-symbols-rounded">
                      edit
                    </span>

                    <span>
                      Sửa
                    </span>
                  </button>
                `
          : ""
        }

            ${!isSelf
          ? `
                  <div class="action-menu">

                    <button
                      type="button"
                      class="btn-more"
                      title="Quản lý tài khoản"
                      aria-label="Quản lý tài khoản"
                    >
                      <span class="material-symbols-rounded">
                        manage_accounts
                      </span>
                    </button>

                    <div class="action-dropdown">

                      <button
                        type="button"
                        class="action-item action-reset"
                      >
                        <span class="material-symbols-rounded">
                          lock_reset
                        </span>

                        <span>
                          Reset mật khẩu
                        </span>
                      </button>

                      ${!isAdmin
            ? isLocked
              ? `
                              <button
                                type="button"
                                class="action-item action-unlock"
                              >
                                <span class="material-symbols-rounded">
                                  lock_open
                                </span>

                                <span>
                                  Mở khóa tài khoản
                                </span>
                              </button>
                            `
              : `
                              <button
                                type="button"
                                class="action-item action-lock"
                              >
                                <span class="material-symbols-rounded">
                                  lock
                                </span>

                                <span>
                                  Khóa tài khoản
                                </span>
                              </button>
                            `
            : ""
          }

                    </div>

                  </div>
                `
          : ""
        }

          </div>

        </td>
      `;

      const editBtn =
        tr.querySelector(
          ".btn-edit-user"
        );

      const moreBtn =
        tr.querySelector(
          ".btn-more"
        );

      const dropdown =
        tr.querySelector(
          ".action-dropdown"
        );

      const resetBtn =
        tr.querySelector(
          ".action-reset"
        );

      const lockBtn =
        tr.querySelector(
          ".action-lock"
        );

      const unlockBtn =
        tr.querySelector(
          ".action-unlock"
        );

      if (editBtn) {
        editBtn.addEventListener(
          "click",
          () => {
            closeAllActionMenus();
            editAccount(u.id);
          }
        );
      }

      if (
        moreBtn &&
        dropdown
      ) {
        moreBtn.addEventListener(
          "click",
          (e) => {
            e.stopPropagation();

            const isOpen =
              dropdown.classList.contains(
                "show"
              );

            closeAllActionMenus();

            if (!isOpen) {
              dropdown.classList.add(
                "show"
              );
            }
          }
        );

        dropdown.addEventListener(
          "click",
          (e) => {
            e.stopPropagation();
          }
        );
      }

      if (resetBtn) {
        resetBtn.addEventListener(
          "click",
          () => {
            closeAllActionMenus();
            openResetPasswordModal(u);
          }
        );
      }

      if (lockBtn) {
        lockBtn.addEventListener(
          "click",
          () => {
            closeAllActionMenus();

            lockUser(
              u.id,
              u.ten_dang_nhap
            );
          }
        );
      }

      if (unlockBtn) {
        unlockBtn.addEventListener(
          "click",
          () => {
            closeAllActionMenus();

            unlockUser(
              u.id,
              u.ten_dang_nhap
            );
          }
        );
      }

      usersBody.appendChild(tr);
    }
  );
}



function editAccount(id) {
  const found =
    allUsers.find(
      (u) =>
        String(u.id) ===
        String(id)
    );

  if (!found) {
    alert(
      "Không tìm thấy tài khoản."
    );

    return;
  }

  if (
    found.vai_tro ===
    "KHACH_HANG"
  ) {
    alert(
      "Admin không được chỉnh sửa tài khoản khách hàng."
    );

    return;
  }

  if (
    found.vai_tro ===
    "ADMIN"
  ) {
    alert(
      "Không chỉnh sửa tài khoản ADMIN tại chức năng này."
    );

    return;
  }

  openAccountModal(found);
}




async function saveAccount() {
  const id =
    accountIdInput.value.trim();

  const ten_dang_nhap =
    accountUsernameInput.value.trim();

  const mat_khau =
    accountPasswordInput.value;

  const vai_tro =
    accountRoleInput.value;

  const co_so_id =
    accountFacilityInput.value;

  const status =
    accountStatusInput.value;

 

  if (!validateAccountForm()) {
    return;
  }

  try {
    btnSaveAccount.disabled =
      true;

  
    if (isEditMode) {
      const oldUser =
        allUsers.find(
          (u) =>
            String(u.id) ===
            String(id)
        );

      if (!oldUser) {
        throw new Error(
          "Không tìm thấy tài khoản."
        );
      }

      if (
        oldUser.vai_tro !==
        "NHAN_VIEN_Y_TE"
      ) {
        throw new Error(
          "Chỉ được chỉnh sửa tài khoản nhân viên y tế."
        );
      }

      const oldStatus =
        oldUser.trang_thai ===
          "BI_KHOA"
          ? "LOCKED"
          : "ACTIVE";

      const payload = {
        ten_dang_nhap,
        vai_tro: "NHAN_VIEN_Y_TE",
        co_so_id: Number(co_so_id)
      };

      console.log(
        "Dữ liệu cập nhật nhân viên:",
        payload
      );

      const res = await authFetch(
        `${API_BASE_URL}/users/${id}`,
        {
          method: "PUT",

          headers:
            getHeaders(true),

          body:
            JSON.stringify(payload)
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
          "Cập nhật tài khoản thất bại"
        );
      }

      
      if (status !== oldStatus) {
        if (status === "LOCKED") {
          const lockRes =
            await authFetch(
              `${API_BASE_URL}/users/${id}`,
              {
                method: "DELETE",
                headers:
                  getHeaders()
              }
            );

          const lockData =
            await lockRes.json();

          if (!lockRes.ok) {
            throw new Error(
              lockData.message ||
              "Khóa tài khoản thất bại"
            );
          }
        } else {
          const unlockRes =
            await authFetch(
              `${API_BASE_URL}/users/${id}/unlock`,
              {
                method: "PATCH",
                headers:
                  getHeaders()
              }
            );

          const unlockData =
            await unlockRes.json();

          if (!unlockRes.ok) {
            throw new Error(
              unlockData.message ||
              "Mở khóa tài khoản thất bại"
            );
          }
        }
      }

      alert(
        data.message ||
        "Cập nhật tài khoản thành công"
      );
    }


    else {
      const payload = {
        ten_dang_nhap,
        mat_khau,
        vai_tro,
        co_so_id:
          Number(co_so_id)
      };

      console.log(
        "Dữ liệu thêm nhân viên:",
        payload
      );

      const res = await authFetch(
        `${API_BASE_URL}/users`,
        {
          method: "POST",

          headers:
            getHeaders(true),

          body:
            JSON.stringify(payload)
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
          "Thêm tài khoản thất bại"
        );
      }

      if (
        status === "LOCKED" &&
        data.id
      ) {
        const lockRes =
          await authFetch(
            `${API_BASE_URL}/users/${data.id}`,
            {
              method: "DELETE",
              headers:
                getHeaders()
            }
          );

        const lockData =
          await lockRes.json();

        if (!lockRes.ok) {
          throw new Error(
            lockData.message ||
            "Khóa tài khoản thất bại"
          );
        }
      }

      alert(
        data.message ||
        "Thêm tài khoản thành công"
      );
    }

    closeAccountModal();

    await loadUsers();

  } catch (err) {
    console.error(
      "Lỗi lưu tài khoản:",
      err
    );

    alert(
      "Lỗi: " + err.message
    );

  } finally {
    btnSaveAccount.disabled =
      false;
  }
}



async function lockUser(
  id,
  ten_dang_nhap
) {
  if (
    String(id) ===
    String(currentUser.id)
  ) {
    alert(
      "Bạn không thể tự khóa tài khoản của chính mình."
    );

    return;
  }

  const targetUser =
    allUsers.find(
      (u) =>
        String(u.id) ===
        String(id)
    );

  if (
    targetUser?.vai_tro ===
    "ADMIN"
  ) {
    alert(
      "Không được khóa tài khoản ADMIN."
    );

    return;
  }

  if (
    !confirm(
      `Bạn có đồng ý khóa tài khoản "${ten_dang_nhap}" không?`
    )
  ) {
    return;
  }

  try {
    const res = await authFetch(
      `${API_BASE_URL}/users/${id}`,
      {
        method: "DELETE",
        headers: getHeaders()
      }
    );

    const data =
      await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
        "Khóa tài khoản thất bại"
      );
    }

    alert(
      data.message ||
      "Đã khóa tài khoản"
    );

    await loadUsers();

  } catch (err) {
    alert(
      "Lỗi: " + err.message
    );
  }
}




async function unlockUser(
  id,
  ten_dang_nhap
) {
  const targetUser =
    allUsers.find(
      (u) =>
        String(u.id) ===
        String(id)
    );

  if (
    targetUser?.vai_tro ===
    "ADMIN"
  ) {
    alert(
      "Không thực hiện mở khóa ADMIN tại chức năng này."
    );

    return;
  }

  if (
    !confirm(
      `Bạn có đồng ý mở khóa tài khoản "${ten_dang_nhap}" không?`
    )
  ) {
    return;
  }

  try {
    const res = await authFetch(
      `${API_BASE_URL}/users/${id}/unlock`,
      {
        method: "PATCH",
        headers: getHeaders()
      }
    );

    const data =
      await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
        "Mở khóa tài khoản thất bại"
      );
    }

    alert(
      data.message ||
      "Đã mở khóa tài khoản"
    );

    await loadUsers();

  } catch (err) {
    alert(
      "Lỗi: " + err.message
    );
  }
}




accountUsernameInput?.addEventListener(
  "input",
  () => {
    if (
      accountUsernameInput.value.trim()
    ) {
      validateUsername();
    } else {
      clearError(
        accountUsernameInput
      );
    }
  }
);


accountPasswordInput?.addEventListener(
  "input",
  () => {
    if (
      accountPasswordInput.value
    ) {
      validatePassword();
    } else {
      clearError(
        accountPasswordInput
      );
    }
  }
);


accountRoleInput?.addEventListener(
  "change",
  () => {
    validateRole();

    if (!isEditMode) {
      accountFacilityInput.disabled =
        accountRoleInput.value !==
        "NHAN_VIEN_Y_TE";

      if (
        accountRoleInput.value !==
        "NHAN_VIEN_Y_TE"
      ) {
        accountFacilityInput.value =
          "";

        clearError(
          accountFacilityInput
        );
      }
    }
  }
);


accountFacilityInput?.addEventListener(
  "change",
  validateFacility
);




btnOpenAdd?.addEventListener(
  "click",
  async () => {
    await loadFacilities();

    openAccountModal();
  }
);


btnCloseModalTop?.addEventListener(
  "click",
  closeAccountModal
);


btnCloseModalBottom?.addEventListener(
  "click",
  closeAccountModal
);


btnSaveAccount?.addEventListener(
  "click",
  saveAccount
);




filterRole?.addEventListener(
  "change",
  applyFilters
);


keywordInput?.addEventListener(
  "input",
  applyFilters
);



btnCloseResetTop?.addEventListener(
  "click",
  closeResetPasswordModal
);


btnCloseResetBottom?.addEventListener(
  "click",
  closeResetPasswordModal
);


btnResetPassword?.addEventListener(
  "click",
  resetPassword
);


resetPasswordInput?.addEventListener(
  "input",
  () => {
    if (
      resetPasswordInput.value
    ) {
      validateResetPassword();
    } else {
      clearError(
        resetPasswordInput
      );
    }

    if (
      resetPasswordConfirmInput.value
    ) {
      validateResetPasswordConfirm();
    }
  }
);


resetPasswordConfirmInput?.addEventListener(
  "input",
  () => {
    if (
      resetPasswordConfirmInput.value
    ) {
      validateResetPasswordConfirm();
    } else {
      clearError(
        resetPasswordConfirmInput
      );
    }
  }
);




window.addEventListener(
  "click",
  (e) => {
    if (
      e.target === accountModal
    ) {
      closeAccountModal();
    }

    if (
      e.target === resetPasswordModal
    ) {
      closeResetPasswordModal();
    }

    if (
      !e.target.closest(
        ".action-menu"
      )
    ) {
      closeAllActionMenus();
    }
  }
);




async function initPage() {
  await loadFacilities();
  await loadUsers();
}

initPage();