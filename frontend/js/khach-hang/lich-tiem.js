const user = JSON.parse(
  localStorage.getItem("user") || "null"
);

const token = localStorage.getItem("token");

if (!user || !token) {
  alert("Bạn chưa đăng nhập! Vui lòng đăng nhập để xem lịch tiêm.");
  window.top.location.href = new URL(
    "../common/dangnhap.html",
    window.location.href
  ).href;
  throw new Error("Chưa đăng nhập");
}

if (user.vai_tro !== "KHACH_HANG") {

  alert(
    "Bạn không có quyền truy cập chức năng này!"
  );

  throw new Error(
    "Không có quyền truy cập"
  );
}


const API_BASE_URL =
  "http://localhost:3000/api";


// ========================================
// DOM
// ========================================

const tbody =
  document.getElementById(
    "lichTableBody"
  );


const emptyState =
  document.getElementById(
    "lichEmptyState"
  );


const filterTrangThai =
  document.getElementById(
    "filterTrangThai"
  );


const filterNgay =
  document.getElementById(
    "filterNgay"
  );


// ========================================
// MODAL CHI TIẾT
// ========================================

const detailModal =
  document.getElementById(
    "detailModal"
  );


const btnCloseDetailModal =
  document.getElementById(
    "btnCloseDetailModal"
  );


const btnCloseDetail =
  document.getElementById(
    "btnCloseDetail"
  );

// ========================================
// MODAL HỦY LỊCH
// ========================================

const cancelModal =
  document.getElementById(
    "cancelModal"
  );


const btnCloseCancelModal =
  document.getElementById(
    "btnCloseCancelModal"
  );


const btnCancelClose =
  document.getElementById(
    "btnCancelClose"
  );


const btnConfirmCancel =
  document.getElementById(
    "btnConfirmCancel"
  );


const cancelReasonGroup =
  document.getElementById(
    "cancelReasonGroup"
  );


const cancelReasonHint =
  document.getElementById(
    "cancelReasonHint"
  );


// ========================================
// DỮ LIỆU
// ========================================

let lichData = [];


// ========================================
// HÀM HỖ TRỢ
// ========================================

function getUserId() {

  return user?.id || null;
}

// Tạo headers xác thực JWT
function getAuthHeaders(withJson = false) {

  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`
  };

  if (withJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

// Xử lý lỗi xác thực JWT
async function checkAuthResponse(res) {
  if (res.status === 401) {
    alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    window.top.location.href = new URL(
      "../common/dangnhap.html",
      window.location.href
    ).href;
    return true;
  }

  if (res.status === 403) {
    alert("Bạn không có quyền thực hiện chức năng này.");
    return true;
  }

  return false;
}


/**
 * Chuẩn hóa text.
 */
function displayText(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "—";
  }


  const text =
    String(value).trim();


  return text || "—";
}


/**
 * Chuẩn hóa ghi chú.
 */
function formatNote(note) {

  if (
    note === null ||
    note === undefined
  ) {

    return "—";
  }


  const text =
    String(note).trim();


  return text || "—";
}


/**
 * Format ngày.
 */
function formatDate(input) {

  if (!input) {

    return "—";
  }


  const date =
    new Date(input);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";
  }


  return date.toLocaleDateString(
    "vi-VN",
    {
      timeZone:
        "Asia/Ho_Chi_Minh"
    }
  );
}


/**
 * Format giờ.
 */
function formatTime(timeStr) {

  if (!timeStr) {

    return "—";
  }


  const time =
    String(timeStr).trim();


  if (!time) {

    return "—";
  }


  return time.length >= 5
    ? time.slice(0, 5)
    : time;
}


/**
 * Format tiền.
 */
function formatCurrency(amount) {

  const number =
    Number(amount);


  if (
    !Number.isFinite(number)
  ) {

    return "—";
  }


  return (
    number.toLocaleString(
      "vi-VN"
    ) + " đ"
  );
}


/**
 * Format giới tính.
 */
function formatGender(gender) {

  switch (gender) {

    case "NAM":
      return "Nam";

    case "NU":
      return "Nữ";

    case "KHAC":
      return "Khác";

    default:
      return displayText(
        gender
      );
  }
}


/**
 * Format mối quan hệ.
 */
function formatRelationship(value) {

  if (!value) {

    return "—";
  }


  if (
    value === "BAN_THAN"
  ) {

    return "Bản thân";
  }


  return displayText(value);
}


/**
 * Format trạng thái lịch.
 */
function formatStatusText(status) {

  switch (status) {

    case "CHO_DUYET":
      return "Chờ duyệt";

    case "DA_DUYET":
      return "Đã duyệt";

    case "DA_TIEM":
      return "Đã tiêm";

    case "DA_HUY":
      return "Đã hủy";

    default:
      return displayText(
        status
      );
  }
}


/**
 * Lấy ngày hiện tại theo local
 * dạng YYYY-MM-DD.
 */
function getTodayString() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${year}-${month}-${day}`
  );
}


/**
 * Khách chỉ được tự hủy
 * TRƯỚC ngày tiêm.
 *
 * Ví dụ:
 * hôm nay 05/10
 * lịch 06/10 -> được hủy
 *
 * lịch 05/10 -> không tự hủy
 */
function canCustomerCancel(
  ngayTiem
) {

  if (!ngayTiem) {

    return false;
  }


  const appointmentDate =
    String(
      ngayTiem
    ).slice(
      0,
      10
    );


  const today =
    getTodayString();


  return (
    appointmentDate >
    today
  );
}


// ========================================
// BADGE TRẠNG THÁI LỊCH
// ========================================

function renderStatusBadge(status) {
  const config = {
    CHO_DUYET: ["schedule", "Chờ duyệt", "status-pending"],
    DA_DUYET: ["check_circle", "Đã duyệt", "status-approved"],
    DA_TIEM: ["verified", "Đã tiêm", "status-success"],
    DA_HUY: ["cancel", "Đã hủy", "status-danger"]
  };

  const [icon, text, className] =
    config[status] || ["help_outline", "Không xác định", "status-neutral"];

  return `
        <span class="status-text ${className}">
            <span class="material-symbols-rounded">${icon}</span>
            <span>${text}</span>
        </span>
    `;
}

// Trạng thái yêu cầu hoàn tiền hiển thị bên dưới trạng thái lịch
function renderRefundStatus(item) {
  const status = item.trang_thai_hoan_tien;

  if (status === "CHO_XU_LY") {
    return `
            <div class="refund-status refund-pending">
                <span class="material-symbols-rounded">schedule</span>
                <span>Chờ xử lý hoàn tiền</span>
            </div>
        `;
  }

  if (status === "DA_HOAN_TIEN" && item.trang_thai !== "DA_HUY") {
    return `
            <div class="refund-status refund-success">
                <span class="material-symbols-rounded">check_circle</span>
                <span>Đã hoàn tiền</span>
            </div>
        `;
  }

  if (status === "TU_CHOI" || status === "DA_TU_CHOI") {
    return `
            <div class="refund-status refund-danger">
                <span class="material-symbols-rounded">error</span>
                <span>Yêu cầu hoàn tiền bị từ chối</span>
            </div>
        `;
  }

  return "";
}

// ========================================
// THAO TÁC
// ========================================

function renderActions(item) {
  const paymentStatus =
    item.trang_thai_thanh_toan || "CHUA_THANH_TOAN";

  const paymentMethod =
    item.phuong_thuc_thanh_toan || item.phuong_thuc || "";

  let cancelButton = "";

  const lichCoTheHuy =
    item.trang_thai === "CHO_DUYET" ||
    item.trang_thai === "DA_DUYET";

  const truocNgayTiem = canCustomerCancel(item.ngay_tiem);

  // Không cho gửi thêm yêu cầu khi đã tồn tại yêu cầu hoàn tiền
  const daCoYeuCauHoanTien =
    item.trang_thai_hoan_tien != null &&
    item.trang_thai_hoan_tien !== "";

  if (lichCoTheHuy && truocNgayTiem && !daCoYeuCauHoanTien) {

    if (
      paymentMethod === "VNPAY" &&
      paymentStatus === "DA_THANH_TOAN"
    ) {
      cancelButton = `
    <button
        class="btn btn-cancel-appointment"
        type="button"
        onclick="openCancelModal(${item.id}, 'YEU_CAU_HOAN_TIEN')"
    >
        Yêu cầu hủy
    </button>
`;
    } else if (
      paymentMethod === "TIEN_MAT" &&
      paymentStatus === "DA_THANH_TOAN"
    ) {
      cancelButton = "";

    } else {
      cancelButton = `
    <button
        class="btn btn-cancel-appointment"
        type="button"
        onclick="openCancelModal(${item.id}, 'HUY_TRUC_TIEP')"
    >
        Hủy lịch
    </button>
`;
    }
  }

  const detailButton = `
        <button
            class="btn btn-detail"
            type="button"
            onclick="openDetailModal(${item.id})"
        >
            Chi tiết
        </button>
    `;

  return `
        <div class="action-group">

            ${detailButton}

            ${cancelButton ? `
                <button
                    type="button"
                    class="action-menu-trigger"
                    aria-label="Thao tác khác"
                    aria-haspopup="menu"
                    aria-expanded="false"
                    onclick="toggleActionMenu(event, this)"
                >
                    <span class="material-symbols-rounded">
                        more_horiz
                    </span>
                </button>

                <template class="action-menu-template">
                    ${cancelButton}
                </template>
            ` : ""}

        </div>
    `;
}

// ========================================
// MENU BA CHẤM - THAO TÁC LỊCH TIÊM
// ========================================

let activeActionTrigger = null;

const actionPopup = document.createElement("div");

actionPopup.className = "action-popup";
actionPopup.setAttribute("role", "menu");

Object.assign(actionPopup.style, {
  position: "fixed",
  zIndex: "99999",
  display: "none",
  flexDirection: "column",
  minWidth: "180px",
  padding: "6px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.15)"
});

document.body.appendChild(actionPopup);

// Đóng menu
function closeActionMenu() {
  actionPopup.style.display = "none";
  actionPopup.innerHTML = "";

  if (activeActionTrigger) {
    activeActionTrigger.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  activeActionTrigger = null;
}

// Mở / đóng menu
function toggleActionMenu(event, trigger) {
  event.stopPropagation();

  if (activeActionTrigger === trigger) {
    closeActionMenu();
    return;
  }

  closeActionMenu();

  const template = trigger
    .closest(".action-group")
    ?.querySelector(".action-menu-template");

  if (!template) return;

  actionPopup.innerHTML = template.innerHTML;
  actionPopup.style.display = "flex";
  actionPopup.style.visibility = "hidden";

  const rect = trigger.getBoundingClientRect();
  const popupWidth = actionPopup.offsetWidth;
  const popupHeight = actionPopup.offsetHeight;

  const left = Math.max(
    8,
    Math.min(
      rect.right - popupWidth,
      window.innerWidth - popupWidth - 8
    )
  );

  const spaceBelow = window.innerHeight - rect.bottom;

  const top = spaceBelow >= popupHeight + 8
    ? rect.bottom + 6
    : Math.max(8, rect.top - popupHeight - 6);

  actionPopup.style.left = `${left}px`;
  actionPopup.style.top = `${top}px`;
  actionPopup.style.visibility = "visible";

  activeActionTrigger = trigger;

  trigger.setAttribute("aria-expanded", "true");
}

// Chọn thao tác trong menu
actionPopup.addEventListener("click", (event) => {
  if (event.target.closest("button")) {
    closeActionMenu();
  }
});

// Bấm bên ngoài menu để đóng
document.addEventListener("click", (event) => {
  if (
    !actionPopup.contains(event.target) &&
    !event.target.closest(".action-menu-trigger")
  ) {
    closeActionMenu();
  }
});

// Cuộn bảng hoặc trang thì đóng menu
document.addEventListener(
  "scroll",
  closeActionMenu,
  true
);

// Thay đổi kích thước màn hình
window.addEventListener("resize", closeActionMenu);

// Phím ESC
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    activeActionTrigger
  ) {
    closeActionMenu();
  }
});

// ========================================
// RENDER DANH SÁCH
// ========================================

function renderTable() {

  if (!tbody) {

    return;
  }


  const statusValue =
    filterTrangThai?.value || "";


  const dateValue =
    filterNgay?.value || "";



  const filtered = lichData
    .filter((item) => {
      const matchStatus =
        !statusValue ||
        item.trang_thai === statusValue;

      const itemDate = item.ngay_tiem
        ? String(item.ngay_tiem).slice(0, 10)
        : "";

      const matchDate =
        !dateValue ||
        itemDate === dateValue;

      return matchStatus && matchDate;
    })
    .sort((a, b) => {
      const dateA = `${String(a.ngay_tiem || "").slice(0, 10)} ${formatTime(a.gio_tiem)}`;
      const dateB = `${String(b.ngay_tiem || "").slice(0, 10)} ${formatTime(b.gio_tiem)}`;

      return dateA.localeCompare(dateB) || Number(a.id) - Number(b.id);
    });




  tbody.innerHTML = "";


  if (
    filtered.length === 0
  ) {

    if (emptyState) {

      emptyState.style.display =
        "block";
    }

    return;
  }


  if (emptyState) {

    emptyState.style.display =
      "none";
  }


  filtered.forEach(
    (item, index) => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `
        <td class="text-center">
          ${index + 1}
        </td>

        <td>
          ${displayText(
        item.ho_ten
      )}
        </td>

        <td>
          ${displayText(
        item.vaccine
      )}
        </td>

        <td>
          ${displayText(
        item.ten_co_so
      )}
        </td>

        <td class="text-center">
          ${formatDate(
        item.ngay_tiem
      )}
        </td>

       <td class="text-center">
    ${formatTime(item.gio_tiem)}
</td>

<td class="text-center">
    ${renderStatusBadge(item.trang_thai)}
    ${renderRefundStatus(item)}
</td>

<td class="text-center">
    ${renderActions(item)}
</td>
      `;


      tbody.appendChild(
        row
      );
    }
  );
}


// ========================================
// LẤY DANH SÁCH LỊCH TIÊM
// ========================================

async function fetchLichTiem() {

  const userId =
    getUserId();


  if (!userId) {

    alert(
      "Không xác định được tài khoản."
    );

    return;
  }


  try {

    const res = await fetch(
      `${API_BASE_URL}/lich/${userId}`,
      {
        headers: getAuthHeaders()
      }
    );

    if (await checkAuthResponse(res)) return;


    const data =
      await res.json();
    if (!res.ok) {

      throw new Error(
        data.message ||
        "Không thể tải lịch tiêm."
      );
    }


    lichData =
      Array.isArray(data)
        ? data
        : [];


    renderTable();


  } catch (err) {

    console.error(
      "Lỗi tải lịch tiêm:",
      err
    );


    lichData = [];


    renderTable();


    alert(
      err.message ||
      "Có lỗi xảy ra khi tải lịch tiêm."
    );
  }
}


// ========================================
// MODAL CHI TIẾT
// ========================================

function openDetailModal(
  lichId
) {

  const item =
    lichData.find(
      (lich) =>
        Number(lich.id) ===
        Number(lichId)
    );


  if (!item) {

    alert(
      "Không tìm thấy lịch tiêm."
    );

    return;
  }


  document.getElementById(
    "detailHoTen"
  ).textContent =
    displayText(
      item.ho_ten
    );


  document.getElementById(
    "detailMoiQuanHe"
  ).textContent =
    formatRelationship(
      item.moi_quan_he
    );


  document.getElementById(
    "detailNgaySinh"
  ).textContent =
    formatDate(
      item.ngay_sinh_nguoi_tiem
    );


  document.getElementById(
    "detailGioiTinh"
  ).textContent =
    formatGender(
      item.gioi_tinh_nguoi_tiem
    );


  document.getElementById(
    "detailSoDienThoai"
  ).textContent =
    displayText(
      item.so_dien_thoai
    );


  document.getElementById(
    "detailEmail"
  ).textContent =
    displayText(
      item.email_nguoi_tiem
    );


  document.getElementById(
    "detailVaccine"
  ).textContent =
    displayText(
      item.vaccine
    );


  const coSoParts = [];


  if (item.ten_co_so) {

    coSoParts.push(
      item.ten_co_so
    );
  }


  if (item.dia_chi_co_so) {

    coSoParts.push(
      item.dia_chi_co_so
    );
  }


  document.getElementById(
    "detailCoSo"
  ).textContent =
    coSoParts.length
      ? coSoParts.join(" - ")
      : "—";


  document.getElementById(
    "detailNgayTiem"
  ).textContent =
    formatDate(
      item.ngay_tiem
    );


  document.getElementById(
    "detailGioTiem"
  ).textContent =
    formatTime(
      item.gio_tiem
    );


  document.getElementById(
    "detailTrangThai"
  ).textContent =
    formatStatusText(
      item.trang_thai
    );


  const paymentStatus =
    item.trang_thai_thanh_toan ||
    "CHUA_THANH_TOAN";


  const paymentMethod =
    item.phuong_thuc_thanh_toan ||
    item.phuong_thuc ||
    "";


  let paymentText =
    "Chưa thanh toán";


  if (
    item.trang_thai ===
    "CHO_DUYET"
  ) {

    paymentText =
      "Chưa đến bước thanh toán";

  } else if (
    paymentStatus ===
    "DA_THANH_TOAN"
  ) {

    if (
      paymentMethod ===
      "VNPAY"
    ) {

      paymentText =
        "Đã thanh toán qua VNPAY";

    } else if (
      paymentMethod ===
      "TIEN_MAT"
    ) {

      paymentText =
        "Tiền mặt - Đã thanh toán";

    } else {

      paymentText =
        "Đã thanh toán";
    }

  } else if (
    paymentStatus ===
    "THAT_BAI"
  ) {

    paymentText =
      "Thanh toán thất bại";

  } else if (
    paymentStatus ===
    "DA_HOAN_TIEN"
  ) {

    paymentText =
      "Đã hoàn tiền";

  } else if (
    paymentMethod ===
    "TIEN_MAT"
  ) {

    paymentText =
      "Tiền mặt tại cơ sở - Chưa thanh toán";
  }


  document.getElementById(
    "detailThanhToan"
  ).textContent =
    paymentText;


  document.getElementById(
    "detailGhiChu"
  ).textContent =
    formatNote(
      item.ghi_chu
    );
  const cancelReasonGroup =
    document.getElementById("detailCancelReasonGroup");

  const refundGroup =
    document.getElementById("detailRefundGroup");

  const hasCancelReason =
    item.trang_thai === "DA_HUY" &&
    Boolean(item.ly_do_huy);

  if (cancelReasonGroup) {
    cancelReasonGroup.style.display =
      hasCancelReason ? "flex" : "none";
  }

  if (hasCancelReason) {
    document.getElementById("detailCancelReason").textContent =
      item.ly_do_huy;
  }

  const refundStatus = item.trang_thai_hoan_tien;

  if (refundGroup) {
    refundGroup.style.display =
      refundStatus ? "flex" : "none";
  }

  if (refundStatus) {
    const labels = {
      CHO_XU_LY: "Chờ xử lý hoàn tiền",
      DA_HOAN_TIEN: "Đã hoàn tiền",
      TU_CHOI: "Yêu cầu hoàn tiền bị từ chối",
      DA_TU_CHOI: "Yêu cầu hoàn tiền bị từ chối"
    };

    document.getElementById("detailRefundStatus").textContent =
      labels[refundStatus] || refundStatus;

    document.getElementById("detailRefundReason").textContent =
      formatNote(item.ly_do_hoan_tien);
  }

  detailModal?.classList.add(
    "show"
  );
}


function closeDetailModal() {

  detailModal?.classList.remove(
    "show"
  );
}

// ========================================
// MODAL HỦY LỊCH
// ========================================

function openCancelModal(
  lichId,
  loaiXuLy
) {

  const item =
    lichData.find(
      (lich) =>
        Number(lich.id) ===
        Number(lichId)
    );
  if (!item) {
    alert("Không tìm thấy lịch tiêm.");
    return;
  }

  // Không cho mở form hủy khi đã có yêu cầu hoàn tiền
  if (item.trang_thai_hoan_tien) {
    alert(
      item.trang_thai_hoan_tien === "CHO_XU_LY"
        ? "Lịch tiêm này đã có yêu cầu hoàn tiền đang chờ Admin xử lý."
        : "Lịch tiêm này đã có yêu cầu hoàn tiền trước đó. Vui lòng xem chi tiết lịch."
    );
    return;
  }


  // ======================================
  // KIỂM TRA TRẠNG THÁI LỊCH
  // ======================================

  if (
    ![
      "CHO_DUYET",
      "DA_DUYET"
    ].includes(
      item.trang_thai
    )
  ) {

    alert(
      "Trạng thái lịch hiện tại không thể hủy."
    );

    return;
  }


  // ======================================
  // CHỈ HỦY TRƯỚC NGÀY TIÊM
  // ======================================

  if (
    !canCustomerCancel(
      item.ngay_tiem
    )
  ) {

    alert(
      "Bạn chỉ được tự hủy lịch trước ngày tiêm. Vui lòng liên hệ cơ sở tiêm để được hỗ trợ."
    );

    return;
  }


  const paymentStatus =
    item.trang_thai_thanh_toan ||
    "CHUA_THANH_TOAN";


  const paymentMethod =
    item.phuong_thuc_thanh_toan ||
    item.phuong_thuc ||
    "";


  // ======================================
  // TIỀN MẶT ĐÃ THU
  // KHÁCH KHÔNG TỰ HỦY
  // ======================================

  if (
    paymentMethod ===
    "TIEN_MAT" &&
    paymentStatus ===
    "DA_THANH_TOAN"
  ) {

    alert(
      "Lịch này đã được thanh toán tiền mặt tại cơ sở. Vui lòng liên hệ nhân viên y tế để được hỗ trợ."
    );

    return;
  }


  // ======================================
  // KIỂM TRA LOẠI XỬ LÝ
  // ======================================

  const isRefundRequest =
    paymentMethod ===
    "VNPAY" &&
    paymentStatus ===
    "DA_THANH_TOAN";


  /*
   * Không tin hoàn toàn tham số truyền
   * từ onclick.
   *
   * Tự xác định lại dựa trên dữ liệu
   * thanh toán thật của lịch.
   */
  const actualType =
    isRefundRequest
      ? "YEU_CAU_HOAN_TIEN"
      : "HUY_TRUC_TIEP";


  if (
    loaiXuLy !==
    actualType
  ) {

    loaiXuLy =
      actualType;
  }


  const lichIdInput =
    document.getElementById(
      "cancelLichTiemId"
    );


  if (lichIdInput) {

    lichIdInput.value =
      item.id;
  }


  document.getElementById(
    "cancelHoTen"
  ).textContent =
    displayText(
      item.ho_ten
    );


  document.getElementById(
    "cancelVaccine"
  ).textContent =
    displayText(
      item.vaccine
    );


  document.getElementById(
    "cancelNgayGio"
  ).textContent =
    `${formatDate(
      item.ngay_tiem
    )} - ${formatTime(
      item.gio_tiem
    )}`;


  // ======================================
  // HIỂN THỊ THANH TOÁN
  // ======================================

  let paymentText =
    "Chưa thanh toán";


  if (
    paymentMethod ===
    "VNPAY" &&
    paymentStatus ===
    "DA_THANH_TOAN"
  ) {

    paymentText =
      "Đã thanh toán qua VNPAY";

  } else if (
    paymentMethod ===
    "TIEN_MAT" &&
    paymentStatus !==
    "DA_THANH_TOAN"
  ) {

    paymentText =
      "Tiền mặt tại cơ sở - Chưa thanh toán";

  } else if (
    paymentStatus ===
    "THAT_BAI"
  ) {

    paymentText =
      "Thanh toán VNPAY thất bại";
  }


  document.getElementById(
    "cancelThanhToan"
  ).textContent =
    paymentText;


  const reasonInput =
    document.getElementById(
      "cancelReason"
    );


  if (reasonInput) {

    reasonInput.value = "";
  }


  cancelModal.dataset.loaiXuLy =
    actualType;


  // ======================================
  // YÊU CẦU HOÀN TIỀN
  // ======================================

  if (
    actualType ===
    "YEU_CAU_HOAN_TIEN"
  ) {

    document.getElementById(
      "cancelModalTitle"
    ).textContent =
      "Yêu cầu hủy và hoàn tiền";


    document.getElementById("cancelWarning").style.display = "none";


    /*
     * VNPAY đã thanh toán:
     * lý do BẮT BUỘC.
     */
    if (
      cancelReasonGroup
    ) {

      cancelReasonGroup.style.display =
        "flex";
    }


    if (
      cancelReasonHint
    ) {

      cancelReasonHint.textContent =
        "Vui lòng nhập lý do yêu cầu hủy và hoàn tiền. Tối đa 500 ký tự.";
    }


    if (
      btnConfirmCancel
    ) {

      btnConfirmCancel.textContent =
        "Gửi yêu cầu";
    }

  } else {

    // ====================================
    // HỦY TRỰC TIẾP
    // ====================================

    document.getElementById(
      "cancelModalTitle"
    ).textContent =
      "Hủy lịch tiêm";


    document.getElementById("cancelWarning").style.display = "none";

    /*
     * Chưa thanh toán:
     * không bắt buộc nhập lý do.
     *
     * Ẩn luôn ô lý do để giao diện
     * gọn hơn.
     */
    if (cancelReasonGroup) {
      cancelReasonGroup.style.display = "flex";
    }

    if (cancelReasonHint) {
      cancelReasonHint.textContent =
        "Vui lòng nhập lý do hủy lịch. Tối đa 500 ký tự.";
    }

    if (
      btnConfirmCancel
    ) {

      btnConfirmCancel.textContent =
        "Xác nhận hủy";
    }
  }


  if (
    btnConfirmCancel
  ) {

    btnConfirmCancel.disabled =
      false;
  }


  cancelModal?.classList.add(
    "show"
  );


  /*
   * Chỉ focus lý do nếu
   * yêu cầu hoàn tiền.
   */
  if (
    actualType ===
    "YEU_CAU_HOAN_TIEN" &&
    reasonInput
  ) {

    setTimeout(
      () => {

        reasonInput.focus();

      },
      0
    );
  }
}


// ========================================
// ĐÓNG MODAL HỦY
// ========================================

function closeCancelModal() {

  cancelModal?.classList.remove(
    "show"
  );


  const idInput =
    document.getElementById(
      "cancelLichTiemId"
    );


  if (idInput) {

    idInput.value = "";
  }


  const reasonInput =
    document.getElementById(
      "cancelReason"
    );


  if (reasonInput) {

    reasonInput.value = "";
  }


  if (cancelModal) {

    cancelModal.dataset.loaiXuLy =
      "";
  }


  if (
    cancelReasonGroup
  ) {

    cancelReasonGroup.style.display =
      "flex";
  }


  if (
    cancelReasonHint
  ) {

    cancelReasonHint.textContent =
      "Tối đa 500 ký tự.";
  }


  if (
    btnConfirmCancel
  ) {

    btnConfirmCancel.disabled =
      false;


    btnConfirmCancel.textContent =
      "Xác nhận hủy";
  }
}


// ========================================
// XÁC NHẬN HỦY
// ========================================

async function handleCancelAppointment() {

  const lichId =
    Number(
      document.getElementById(
        "cancelLichTiemId"
      )?.value
    );


  if (!lichId) {

    alert(
      "Không xác định được lịch tiêm."
    );

    return;
  }


  const item =
    lichData.find(
      (lich) =>
        Number(lich.id) ===
        Number(lichId)
    );


  if (!item) {

    alert(
      "Không tìm thấy lịch tiêm."
    );

    return;
  }


  // ======================================
  // FRONTEND KIỂM TRA LẠI
  // ======================================

  if (
    !canCustomerCancel(
      item.ngay_tiem
    )
  ) {

    closeCancelModal();


    alert(
      "Bạn chỉ được tự hủy lịch trước ngày tiêm."
    );

    return;
  }


  if (
    ![
      "CHO_DUYET",
      "DA_DUYET"
    ].includes(
      item.trang_thai
    )
  ) {

    closeCancelModal();


    alert(
      "Trạng thái lịch hiện tại không thể hủy."
    );

    return;
  }


  const paymentStatus =
    item.trang_thai_thanh_toan ||
    "CHUA_THANH_TOAN";


  const paymentMethod =
    item.phuong_thuc_thanh_toan ||
    item.phuong_thuc ||
    "";


  // ======================================
  // TIỀN MẶT ĐÃ THU
  // ======================================

  if (
    paymentMethod ===
    "TIEN_MAT" &&
    paymentStatus ===
    "DA_THANH_TOAN"
  ) {

    closeCancelModal();


    alert(
      "Lịch đã được thanh toán tiền mặt tại cơ sở. Vui lòng liên hệ nhân viên y tế để được hỗ trợ."
    );

    return;
  }


  const isRefundRequest =
    paymentMethod ===
    "VNPAY" &&
    paymentStatus ===
    "DA_THANH_TOAN";


  const lyDo = String(
    document.getElementById("cancelReason")?.value || ""
  ).trim();

  if (!lyDo) {
    alert("Vui lòng nhập lý do hủy lịch.");
    document.getElementById("cancelReason")?.focus();
    return;
  }

  if (lyDo.length > 500) {
    alert("Lý do hủy không được vượt quá 500 ký tự.");
    return;
  }

  if (item.trang_thai_hoan_tien) {
    closeCancelModal();
    alert("Lịch tiêm này đã có yêu cầu hoàn tiền trước đó.");
    return;
  }
  // ======================================
  // XÁC NHẬN
  // ======================================

  const confirmMessage =
    isRefundRequest
      ? "Bạn xác nhận gửi yêu cầu hủy và hoàn tiền?"
      : "Bạn có chắc chắn muốn hủy lịch tiêm này?";


  if (
    !window.confirm(
      confirmMessage
    )
  ) {

    return;
  }


  const userId =
    getUserId();


  if (!userId) {

    alert(
      "Không xác định được tài khoản."
    );

    return;
  }


  try {

    if (
      btnConfirmCancel
    ) {

      btnConfirmCancel.disabled =
        true;


      btnConfirmCancel.textContent =
        "Đang xử lý...";
    }


    /*
     * Backend tự quyết định:
     *
     * 1. Chưa thanh toán
     *    -> DA_HUY ngay.
     *
     * 2. Đã thanh toán
     *    -> tạo hoan_tien CHO_XU_LY.
     *
     * Frontend KHÔNG được tự quyết định
     * trạng thái DB.
     */
    const res = await fetch(
      `${API_BASE_URL}/lich/huy/${lichId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          ly_do: lyDo
        })
      }
    );

    if (await checkAuthResponse(res)) return;

    const data =
      await res.json();


    if (!res.ok) {

      throw new Error(
        data.message ||
        "Không thể xử lý yêu cầu hủy lịch."
      );
    }


    closeCancelModal();


    if (
      isRefundRequest
    ) {

      alert(
        data.message ||
        "Đã gửi yêu cầu hủy và hoàn tiền. Vui lòng chờ ADMIN xử lý."
      );

    } else {

      alert(
        data.message ||
        "Hủy lịch thành công."
      );
    }


    await fetchLichTiem();


  } catch (err) {

    console.error(
      "Lỗi hủy lịch:",
      err
    );


    alert(
      err.message ||
      "Có lỗi xảy ra khi xử lý yêu cầu hủy lịch."
    );


  } finally {

    if (
      btnConfirmCancel
    ) {

      btnConfirmCancel.disabled =
        false;


      btnConfirmCancel.textContent =
        isRefundRequest
          ? "Gửi yêu cầu"
          : "Xác nhận hủy";
    }
  }
}


// ========================================
// EVENT BỘ LỌC
// ========================================

if (
  filterTrangThai
) {

  filterTrangThai.addEventListener(
    "change",
    renderTable
  );
}


if (
  filterNgay
) {

  filterNgay.addEventListener(
    "change",
    renderTable
  );
}


// ========================================
// EVENT MODAL CHI TIẾT
// ========================================

if (
  btnCloseDetailModal
) {

  btnCloseDetailModal.addEventListener(
    "click",
    closeDetailModal
  );
}


if (
  btnCloseDetail
) {

  btnCloseDetail.addEventListener(
    "click",
    closeDetailModal
  );
}


if (
  detailModal
) {

  detailModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        detailModal
      ) {

        closeDetailModal();
      }
    }
  );
}

// ========================================
// EVENT MODAL HỦY
// ========================================

if (
  btnCloseCancelModal
) {

  btnCloseCancelModal.addEventListener(
    "click",
    closeCancelModal
  );
}


if (
  btnCancelClose
) {

  btnCancelClose.addEventListener(
    "click",
    closeCancelModal
  );
}


if (
  btnConfirmCancel
) {

  btnConfirmCancel.addEventListener(
    "click",
    handleCancelAppointment
  );
}


if (
  cancelModal
) {

  cancelModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        cancelModal
      ) {

        closeCancelModal();
      }
    }
  );
}


// ========================================
// PHÍM ESC
// ========================================

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key !==
      "Escape"
    ) {

      return;
    }


    /*
     * Ưu tiên đóng modal hủy
     */
    if (
      cancelModal?.classList.contains(
        "show"
      )
    ) {

      closeCancelModal();

      return;
    }
    if (
      detailModal?.classList.contains(
        "show"
      )
    ) {

      closeDetailModal();
    }
  }
);
// ========================================
// KHỞI TẠO
// ========================================

fetchLichTiem();