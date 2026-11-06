const API_BASE_URL = "http://localhost:3000/api";

const user = JSON.parse(
  localStorage.getItem("user")
);

if (!user || !localStorage.getItem("token")) {
  alert("Bạn chưa đăng nhập!");

  window.top.location.href = new URL(
    "../common/dangnhap.html",
    window.location.href
  ).href;

  throw new Error("Chưa đăng nhập");
}

if (
  user.vai_tro !== "NHAN_VIEN_Y_TE"
) {
  alert(
    "Bạn không có quyền truy cập chức năng này!"
  );

  throw new Error(
    "Không có quyền truy cập"
  );
}

const filterStatus =
  document.getElementById("filterStatus");

const filterDate =
  document.getElementById("filterDate");

const btnReload =
  document.getElementById("btnReload");

const lichBody =
  document.getElementById("lichBody");

const detailModal =
  document.getElementById("detailModal");

const btnCloseDetailX =
  document.getElementById("btnCloseDetailX");

const btnCloseDetail =
  document.getElementById("btnCloseDetail");

const detailHoTen =
  document.getElementById("detailHoTen");

const detailMoiQuanHe =
  document.getElementById("detailMoiQuanHe");

const detailNgaySinh =
  document.getElementById("detailNgaySinh");

const detailGioiTinh =
  document.getElementById("detailGioiTinh");

const detailSoDienThoai =
  document.getElementById("detailSoDienThoai");

const detailEmailNguoiTiem =
  document.getElementById("detailEmailNguoiTiem");

const detailVaccine =
  document.getElementById("detailVaccine");

const detailCoSo =
  document.getElementById("detailCoSo");

const detailNgayTiem =
  document.getElementById("detailNgayTiem");

const detailGioTiem =
  document.getElementById("detailGioTiem");

const detailTrangThai =
  document.getElementById("detailTrangThai");

const detailLyDoHuyRow =
  document.getElementById("detailLyDoHuyRow");

const detailLyDoHuy =
  document.getElementById("detailLyDoHuy");

const detailPhuongThuc =
  document.getElementById("detailPhuongThuc");

const detailThanhToan =
  document.getElementById("detailThanhToan");

const detailGhiChu =
  document.getElementById("detailGhiChu");

const detailKetQuaSangLoc =
  document.getElementById("detailKetQuaSangLoc");

const detailBacSiSangLoc =
  document.getElementById("detailBacSiSangLoc");

const detailThoiGianSangLoc =
  document.getElementById("detailThoiGianSangLoc");

const detailGhiChuSangLoc =
  document.getElementById("detailGhiChuSangLoc");

const cancelModal =
  document.getElementById("cancelModal");

const cancelLichId =
  document.getElementById("cancelLichId");

const cancelWarning =
  document.getElementById("cancelWarning");

const cancelHoTen =
  document.getElementById("cancelHoTen");

const cancelVaccine =
  document.getElementById("cancelVaccine");

const cancelNgayGio =
  document.getElementById("cancelNgayGio");

const cancelThanhToan =
  document.getElementById("cancelThanhToan");

const cancelPhuongThuc =
  document.getElementById("cancelPhuongThuc");

const cancelReason =
  document.getElementById("cancelReason");

const cancelReasonError =
  document.getElementById(
    "cancelReasonError"
  );

const cancelCharCount =
  document.getElementById(
    "cancelCharCount"
  );

const btnCloseCancelX =
  document.getElementById(
    "btnCloseCancelX"
  );

const btnCloseCancel =
  document.getElementById(
    "btnCloseCancel"
  );

const btnConfirmCancel =
  document.getElementById(
    "btnConfirmCancel"
  );

let danhSachLich = [];

function getAuthHeaders(withJson = false) {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`
  };

  if (withJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

function normalizeDateValue(value) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
  ) {
    return value.substring(0, 10);
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateToDDMMYYYY(value) {
  const normalized =
    normalizeDateValue(value);

  if (!normalized) {
    return "";
  }

  const [year, month, day] =
    normalized.split("-");

  return `${day}/${month}/${year}`;
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string" &&
    value.includes(":")
  ) {
    return value
      .split(":")
      .slice(0, 2)
      .join(":");
  }

  return "";
}

function isVaccinationDateToday(value) {
  const ngayTiem = normalizeDateValue(value);

  if (!ngayTiem) {
    return false;
  }

  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const homNay = `${year}-${month}-${day}`;

  return ngayTiem === homNay;
}

function hasReachedVaccinationDate(value) {
  const ngayTiem =
    normalizeDateValue(value);

  if (!ngayTiem) {
    return false;
  }

  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  const homNay =
    `${year}-${month}-${day}`;

  return ngayTiem === homNay;
}

function escapeHtml(value) {
  return String(
    value ?? ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getStatusText(status) {
  if (status === "CHO_DUYET") {
    return "Chờ duyệt";
  }

  if (status === "DA_DUYET") {
    return "Đã duyệt";
  }

  if (status === "DA_TIEM") {
    return "Đã tiêm";
  }

  if (status === "DA_HUY") {
    return "Đã hủy";
  }

  return status || "—";
}


function renderStatusBadge(status) {
  const config = {
    CHO_DUYET: ["schedule", "Chờ duyệt", "status-pending"],
    DA_DUYET: ["check_circle", "Đã duyệt", "status-approved"],
    DA_TIEM: ["verified", "Đã tiêm", "status-success"],
    DA_HUY: ["cancel", "Đã hủy", "status-danger"]
  };

  const [icon, text, className] =
    config[status] || ["help_outline", status || "—", "status-neutral"];

  return `
        <span class="status-text ${className}">
            <span class="material-symbols-rounded" aria-hidden="true">${icon}</span>
            <span>${escapeHtml(text)}</span>
        </span>
    `;
}

function renderScreeningBadge(result) {
  const config = {
    DU_DIEU_KIEN: ["check_circle", "Đủ điều kiện tiêm", "status-success"],
    TAM_HOAN: ["schedule", "Tạm hoãn tiêm", "status-warning"],
    CHONG_CHI_DINH: ["error", "Chống chỉ định tiêm", "status-danger"]
  };

  if (!config[result]) return "";

  const [icon, text, className] = config[result];

  return `
        <span class="status-text status-sub ${className}">
            <span class="material-symbols-rounded" aria-hidden="true">${icon}</span>
            <span>${text}</span>
        </span>
    `;
}

function getPaymentMethod(item) {
  return (
    item.phuong_thuc ||
    item.phuong_thuc_thanh_toan ||
    ""
  );
}


function getPaymentMethodText(method) {
  if (method === "MOMO") {
    return "MoMo";
  }

  if (method === "TIEN_MAT") {
    return "Tiền mặt";
  }

  if (method === "VNPAY") {
    return "VNPAY";
  }

  return "Chưa chọn";
}


function renderMethodBadge(method) {
  const config = {
    TIEN_MAT: ["payments", "Tiền mặt"],
    VNPAY: ["credit_card", "VNPAY"],
    MOMO: ["account_balance_wallet", "MoMo"]
  };

  const [icon, text] =
    config[method] || ["remove_circle_outline", "Chưa chọn"];

  return `
        <span class="status-text status-sub payment-method-text">
            <span class="material-symbols-rounded" aria-hidden="true">${icon}</span>
            <span>${text}</span>
        </span>
    `;
}

function getPaymentStatus(item) {
  return (
    item.trang_thai_thanh_toan ||
    "CHUA_THANH_TOAN"
  );
}

function isRefundPending(item) {
  return item?.trang_thai_hoan_tien === "CHO_XU_LY";
}

function renderRefundStatus(item) {
  if (!isRefundPending(item)) {
    return "";
  }

  return `
        <div class="refund-pending">
            <span class="material-symbols-rounded"
                  aria-hidden="true">schedule</span>
            <span>Chờ xử lý hoàn tiền</span>
        </div>
    `;
}

function getPaymentStatusText(status, method) {
  if (status === "DA_THANH_TOAN") {
    return "Đã thanh toán";
  }

  if (status === "DA_HOAN_TIEN") {
    return "Đã hoàn tiền";
  }

  if (status === "THAT_BAI") {
    return "Thất bại";
  }

  if (method === "TIEN_MAT") {
    return "Chờ thu tiền";
  }

  return "Chưa thanh toán";
}


function renderPaymentBadge(status, method) {
  let icon = "schedule";
  let text = "Chưa thanh toán";
  let className = "status-neutral";

  if (status === "DA_THANH_TOAN") {
    icon = "check_circle";
    text = "Đã thanh toán";
    className = "status-success";
  } else if (status === "DA_HOAN_TIEN") {
    icon = "assignment_return";
    text = "Đã hoàn tiền";
    className = "status-refunded";
  } else if (status === "THAT_BAI") {
    icon = "error";
    text = "Thất bại";
    className = "status-danger";
  } else if (method === "TIEN_MAT") {
    icon = "schedule";
    text = "Chờ thu tiền";
    className = "status-warning";
  }

  return `
        <span class="status-text ${className}">
            <span class="material-symbols-rounded" aria-hidden="true">${icon}</span>
            <span>${text}</span>
        </span>
    `;
}

async function loadSchedules() {
  const params =
    new URLSearchParams();


  if (
    filterStatus.value !== "ALL"
  ) {
    params.append(
      "status",
      filterStatus.value
    );
  }


  if (filterDate.value) {
    params.append(
      "date",
      filterDate.value
    );
  }


  const queryString =
    params.toString();


  const url =
    `${API_BASE_URL}/lich/admin` +
    `${queryString ? `?${queryString}` : ""}`;


  lichBody.innerHTML = `
    <tr>
      <td
        colspan="7"
        class="empty-row"
      >
        Đang tải dữ liệu...
      </td>
    </tr>
  `;


  try {
    const response =
      await fetch(
        url,
        {
          method: "GET",
          headers:
            getAuthHeaders()
        }
      );

    if (await checkAuthResponse(response)) return;

    const data =
      await response.json();


    if (!response.ok) {
      throw new Error(
        data.message ||
        "Không thể tải danh sách lịch tiêm"
      );
    }


    danhSachLich =
      Array.isArray(data)
        ? data
        : [];


    renderTable(
      danhSachLich
    );

  } catch (error) {
    console.error(
      "Lỗi tải danh sách lịch tiêm:",
      error
    );


    danhSachLich = [];


    lichBody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-row"
        >
          Không tải được danh sách lịch tiêm
        </td>
      </tr>
    `;
  }
}

function createMoreActionHtml(item) {
  if (
    item.trang_thai !== "CHO_DUYET" &&
    item.trang_thai !== "DA_DUYET"
  ) {
    return "";
  }

  const method = getPaymentMethod(item);
  const paymentStatus = getPaymentStatus(item);

  const daDuDieuKienTiem =
    item.ket_qua_sang_loc === "DU_DIEU_KIEN";

  const canConfirmCash =
    item.trang_thai === "DA_DUYET" &&
    paymentStatus === "CHUA_THANH_TOAN" &&
    (method === "TIEN_MAT" || !method) &&
    hasReachedVaccinationDate(item.ngay_tiem) &&
    daDuDieuKienTiem;

  const canConfirmInjected =
    item.trang_thai === "DA_DUYET" &&
    paymentStatus === "DA_THANH_TOAN" &&
    isVaccinationDateToday(item.ngay_tiem) &&
    daDuDieuKienTiem;
  return `
    <div
      class="more-action-wrap"
      style="position:relative;display:inline-flex;"
    >
      <button
        type="button"
        class="btn-small btn-secondary"
        data-act="more"
        data-id="${item.id}"
        title="Thao tác khác"
        aria-label="Thao tác khác"
        aria-expanded="false"
        style="
          min-width:36px;
          padding-left:10px;
          padding-right:10px;
          font-size:18px;
          line-height:1;
        "
      >
        &#8942;
      </button>

      <div
        class="more-action-menu"
        data-menu-id="${item.id}"
       style="
  display:none;
  flex-direction:column;
  position:absolute;
  right:0;
  top:calc(100% + 6px);
  z-index:100;
  width:230px;
  padding:6px;
  background:#ffffff;
  border:1px solid #e2e8f0;
  border-radius:8px;
  box-shadow:0 8px 24px rgba(15,23,42,0.15);
"
      >

${item.trang_thai === "CHO_DUYET"
      ? `
    <button
      type="button"
      data-act="detail"
      data-id="${item.id}"
      style="
        display:block;
        width:100%;
        padding:9px 10px;
        border:none;
        border-radius:6px;
        background:#ffffff;
        color:#0277bd;
        font-family:inherit;
        font-size:13px;
        font-weight:600;
        text-align:left;
        cursor:pointer;
      "
    >
      Chi tiết
    </button>
  `
      : ""
    }

${item.trang_thai === "DA_DUYET" &&
      isVaccinationDateToday(item.ngay_tiem)
      ? `
    <button
      type="button"
      data-act="screening"
      data-id="${item.id}"
      style="
        display:block;
        width:100%;
        padding:9px 10px;
        border:none;
        border-radius:6px;
        background:#ffffff;
        color:#0277bd;
        font-family:inherit;
        font-size:13px;
        font-weight:600;
        text-align:left;
        cursor:pointer;
      "
    >
      Khám sàng lọc
    </button>
  `
      : ""
    }

    ${canConfirmCash
      ? `
    <button
      type="button"
      data-act="cash"
      data-id="${item.id}"
      data-user="${item.nguoi_dung_id || ""}"
      style="
        display:block;
        width:100%;
        padding:9px 10px;
        border:none;
        border-radius:6px;
        background:#ffffff;
        color:#b45309;
        font-family:inherit;
        font-size:13px;
        font-weight:600;
        text-align:left;
        cursor:pointer;
      "
    >
      Xác nhận thanh toán
    </button>
  `
      : ""
    }
       
${canConfirmInjected
      ? `
    <button
      type="button"
      data-act="injected"
      data-id="${item.id}"
      style="
        display:block;
        width:100%;
        padding:9px 10px;
        border:none;
        border-radius:6px;
        background:#ffffff;
        color:#15803d;
        font-family:inherit;
        font-size:13px;
        font-weight:600;
        text-align:left;
        cursor:pointer;
      "
    >
      Xác nhận đã tiêm
    </button>
  `
      : ""
    }


        <button
          type="button"
          data-act="cancel"
          data-id="${item.id}"
          style="
            width:100%;
            padding:9px 10px;
            border:none;
            border-radius:6px;
            background:#ffffff;
            color:#c62828;
            font-family:inherit;
            font-size:13px;
            font-weight:600;
            text-align:left;
            cursor:pointer;
          "
        >
          Hủy lịch
        </button>

      </div>
    </div>
  `;
}

function createActionHtml(item) {
  const isPending = item.trang_thai === "CHO_DUYET";
  const isApproved = item.trang_thai === "DA_DUYET";
  const refundPending = isRefundPending(item);

  let html = `<div class="action-wrap">`;

  if (isPending && !refundPending) {
    html += `
      <button
        type="button"
        class="btn-small btn-approve"
        data-act="approve"
        data-id="${item.id}"
      >
        Duyệt
      </button>

      ${createMoreActionHtml(item)}
    `;
  } else {

    html += `
      <button
        type="button"
        class="btn-small btn-detail"
        data-act="detail"
        data-id="${item.id}"
      >
        Chi tiết
      </button>
    `;

    if (isApproved && !refundPending) {
      html += createMoreActionHtml(item);
    }
  }

  html += `</div>`;

  return html;
}

function renderTable(list) {
  if (!list.length) {
    lichBody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-row"
        >
          Không có lịch tiêm nào phù hợp
        </td>
      </tr>
    `;

    return;
  }


  lichBody.innerHTML = "";


  list.forEach(
    (item, index) => {

      const method =
        getPaymentMethod(item);

      const paymentStatus =
        getPaymentStatus(item);


      const ngayTiem =
        formatDateToDDMMYYYY(
          item.ngay_tiem
        ) || "—";


      const gioTiem =
        formatTime(
          item.gio_tiem
        ) || "—";


      const tr =
        document.createElement("tr");


      tr.innerHTML = `

        <!-- STT -->

        <td class="text-center">
          ${index + 1}
        </td>


        <!-- NGƯỜI ĐƯỢC TIÊM -->

        <td>
          ${escapeHtml(
        item.ho_ten || "—"
      )}
        </td>


        <!-- VACCINE -->

        <td>
          ${escapeHtml(
        item.vaccine ||
        item.ten_vaccine ||
        "—"
      )}
        </td>


        <!-- NGÀY & GIỜ -->

        <td class="text-center">

          <div>
            ${ngayTiem}
          </div>

          <div
            style="
              margin-top:4px;
              color:#64748b;
              font-size:12px;
            "
          >
            ${gioTiem}
          </div>

        </td>


        <!-- TRẠNG THÁI -->

<td class="text-center">
    <div>
        ${renderStatusBadge(item.trang_thai)}
    </div>

    <div>
    ${item.trang_thai === "DA_DUYET"
          ? renderScreeningBadge(item.ket_qua_sang_loc)
          : ""}
</div>
</td>


        <!-- THANH TOÁN -->

      <td class="text-center">

    ${renderPaymentBadge(paymentStatus, method)}

    <div style="margin-top:6px;">
        ${renderMethodBadge(method)}
    </div>

    ${renderRefundStatus(item)}

</td>


        <!-- THAO TÁC -->

        <td class="text-center">
          ${createActionHtml(item)}
        </td>
      `;


      lichBody.appendChild(tr);
    }
  );


  bindActionEvents();
}

function closeAllMoreMenus() {
  const menus =
    document.querySelectorAll(
      ".more-action-menu"
    );


  menus.forEach((menu) => {
    menu.style.display = "none";
  });


  const buttons =
    document.querySelectorAll(
      'button[data-act="more"]'
    );


  buttons.forEach((button) => {
    button.setAttribute(
      "aria-expanded",
      "false"
    );
  });
}

function toggleMoreMenu(
  lichId,
  button
) {
  const menu =
    lichBody.querySelector(
      `.more-action-menu[data-menu-id="${lichId}"]`
    );


  if (!menu) {
    return;
  }


  const isOpen =
    menu.style.display === "flex";


  closeAllMoreMenus();


  if (!isOpen) {
    menu.style.display = "flex";

    if (button) {
      button.setAttribute(
        "aria-expanded",
        "true"
      );
    }
  }
}

function bindActionEvents() {
  const buttons =
    lichBody.querySelectorAll(
      "button[data-act]"
    );


  buttons.forEach((button) => {
    button.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();


        const id =
          Number(
            button.dataset.id
          );


        const action =
          button.dataset.act;


        const nguoiDungId =
          button.dataset.user;

        if (action === "more") {
          toggleMoreMenu(
            id,
            button
          );

          return;
        }


        closeAllMoreMenus();

        if (action === "screening") {
          openScreeningModal(id);
          return;
        }

        if (action === "detail") {
          openDetailModal(id);

          return;
        }

        if (action === "approve") {
          updateStatus(
            id,
            "DA_DUYET"
          );

          return;
        }

        if (action === "cancel") {
          openCancelModal(id);

          return;
        }

        if (action === "cash") {
          confirmCashPayment(
            id,
            nguoiDungId
          );

          return;
        }

        if (action === "injected") {
          confirmInjected(id);
        }
      }
    );
  });
}

async function loadDetailScreening(lichId) {
  detailKetQuaSangLoc.textContent = "Đang tải...";
  detailBacSiSangLoc.textContent = "—";
  detailThoiGianSangLoc.textContent = "—";
  detailGhiChuSangLoc.textContent = "—";

  try {
    const response = await fetch(
      `${API_BASE_URL}/kham-sang-loc/${lichId}`,
      {
        method: "GET",
        headers: getAuthHeaders()
      }
    );

    if (await checkAuthResponse(response)) return;

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        "Không thể tải kết quả khám sàng lọc"
      );
    }

    if (
      !detailModal.classList.contains("show") ||
      Number(detailModal.dataset.lichId) !== Number(lichId)
    ) {
      return;
    }

    const data = result.data;

    if (!data) {
      detailKetQuaSangLoc.textContent = "Chưa khám sàng lọc";
      return;
    }

    const ketQuaText = {
      DU_DIEU_KIEN: "Đủ điều kiện tiêm",
      TAM_HOAN: "Tạm hoãn tiêm",
      CHONG_CHI_DINH: "Chống chỉ định tiêm"
    };

    detailKetQuaSangLoc.textContent =
      ketQuaText[data.ket_qua] || data.ket_qua || "—";

    detailBacSiSangLoc.textContent =
      data.bac_si_kham || "—";

    const thoiGian = toLocalDateTime(data.thoi_gian_kham);

    detailThoiGianSangLoc.textContent = thoiGian
      ? `${formatDateToDDMMYYYY(thoiGian)} ${thoiGian.slice(11, 16)}`
      : "—";

    detailGhiChuSangLoc.textContent =
      data.ghi_chu?.trim() || "—";

  } catch (error) {
    console.error("Lỗi tải kết quả khám sàng lọc:", error);

    if (
      detailModal.classList.contains("show") &&
      Number(detailModal.dataset.lichId) === Number(lichId)
    ) {
      detailKetQuaSangLoc.textContent =
        "Không thể tải kết quả khám";
    }
  }
}

function openDetailModal(lichId) {
  const item =
    danhSachLich.find(
      (schedule) =>
        Number(schedule.id) ===
        Number(lichId)
    );


  if (!item) {
    alert(
      "Không tìm thấy thông tin lịch tiêm."
    );

    return;
  }


  const method =
    getPaymentMethod(item);


  const paymentStatus =
    getPaymentStatus(item);


  detailHoTen.textContent =
    item.ho_ten || "—";


  detailMoiQuanHe.textContent =
    item.moi_quan_he || "—";


  detailNgaySinh.textContent =
    formatDateToDDMMYYYY(
      item.ngay_sinh_nguoi_tiem
    ) || "—";


  detailGioiTinh.textContent =
    item.gioi_tinh_nguoi_tiem ||
    "—";

  detailSoDienThoai.textContent =
    item.so_dien_thoai || "Chưa cung cấp";

  detailEmailNguoiTiem.textContent =
    item.email_nguoi_tiem || "Chưa cung cấp";

  detailVaccine.textContent =
    item.vaccine ||
    item.ten_vaccine ||
    "—";


  detailCoSo.textContent =
    item.ten_co_so ||
    "Chưa chọn";


  detailNgayTiem.textContent =
    formatDateToDDMMYYYY(
      item.ngay_tiem
    ) || "—";


  detailGioTiem.textContent =
    formatTime(
      item.gio_tiem
    ) || "—";


  detailTrangThai.textContent =
    getStatusText(
      item.trang_thai
    );
  const daHuy = item.trang_thai === "DA_HUY";

  detailLyDoHuyRow.style.display = daHuy ? "grid" : "none";

  detailLyDoHuy.textContent = daHuy
    ? (item.ly_do_huy || item.ly_do || "Chưa có lý do hủy")
    : "—";


  detailPhuongThuc.textContent =
    getPaymentMethodText(
      method
    );


  detailThanhToan.textContent =
    getPaymentStatusText(
      paymentStatus,
      method
    );

  const refundSection =
    document.getElementById("detailRefundSection");

  const refundStatus = item.trang_thai_hoan_tien;

  if (refundSection) {
    refundSection.style.display =
      refundStatus ? "block" : "none";
  }

  if (refundStatus) {
    const refundLabels = {
      CHO_XU_LY: "Chờ xử lý hoàn tiền",
      DA_HOAN_TIEN: "Đã hoàn tiền",
      TU_CHOI: "Yêu cầu bị từ chối",
      DA_TU_CHOI: "Yêu cầu bị từ chối"
    };

    const sourceLabels = {
      KHACH_HANG: "Khách hàng",
      NHAN_VIEN_Y_TE: "Nhân viên y tế"
    };

    const requesterRole = item.vai_tro_nguoi_yeu_cau;

    document.getElementById("detailRefundSource").textContent =
      sourceLabels[requesterRole] || "Chưa xác định";

    document.getElementById("detailRefundRequester").textContent =
      item.ten_nguoi_yeu_cau || "Chưa có thông tin";

    document.getElementById("detailRefundReason").textContent =
      item.ly_do_hoan_tien || "Chưa có lý do";

    document.getElementById("detailRefundStatus").textContent =
      refundLabels[refundStatus] || refundStatus;
  }
  detailGhiChu.textContent =
    item.ghi_chu &&
      String(item.ghi_chu).trim()
      ? item.ghi_chu
      : "—";


  detailModal.dataset.lichId = String(lichId);

  detailModal.classList.add("show");

  document.body.style.overflow = "hidden";

  loadDetailScreening(lichId);
}

function closeDetailModal() {
  detailModal.classList.remove(
    "show"
  );


  if (
    !cancelModal.classList.contains(
      "show"
    )
  ) {
    document.body.style.overflow =
      "";
  }
}

function openCancelModal(lichId) {
  const item =
    danhSachLich.find(
      (schedule) =>
        Number(schedule.id) ===
        Number(lichId)
    );


  if (!item) {
    alert(
      "Không tìm thấy thông tin lịch tiêm."
    );

    return;
  }
  if (item.trang_thai_hoan_tien) {
    alert(
      item.trang_thai_hoan_tien === "CHO_XU_LY"
        ? "Lịch này đã có yêu cầu hoàn tiền đang chờ Admin xử lý."
        : "Lịch này đã có yêu cầu hoàn tiền trước đó. Vui lòng xem Chi tiết."
    );
    return;
  }

  if (
    item.trang_thai !== "CHO_DUYET" &&
    item.trang_thai !== "DA_DUYET"
  ) {
    alert(
      "Trạng thái lịch hiện tại không cho phép hủy."
    );

    return;
  }


  const method =
    getPaymentMethod(item);


  const paymentStatus =
    getPaymentStatus(item);


  const daThanhToan =
    paymentStatus ===
    "DA_THANH_TOAN";

  cancelLichId.value =
    String(item.id);

  cancelHoTen.textContent =
    item.ho_ten || "—";


  cancelVaccine.textContent =
    item.vaccine ||
    item.ten_vaccine ||
    "—";


  const ngayTiem =
    formatDateToDDMMYYYY(
      item.ngay_tiem
    ) || "—";


  const gioTiem =
    formatTime(
      item.gio_tiem
    ) || "—";


  cancelNgayGio.textContent =
    `${ngayTiem} - ${gioTiem}`;


  cancelThanhToan.textContent =
    getPaymentStatusText(
      paymentStatus,
      method
    );


  cancelPhuongThuc.textContent =
    getPaymentMethodText(
      method
    );

  if (daThanhToan) {
    cancelWarning.textContent =
      "Lịch này đã được thanh toán. Sau khi xác nhận, hệ thống sẽ tạo yêu cầu hoàn tiền để ADMIN xử lý. Lịch chưa được chuyển sang Đã hủy cho đến khi yêu cầu hoàn tiền được xử lý.";
  } else {
    cancelWarning.textContent =
      "Lịch này chưa được thanh toán. Sau khi xác nhận, lịch sẽ được chuyển sang trạng thái Đã hủy.";
  }

  cancelReason.value = "";


  cancelReason.classList.remove(
    "invalid"
  );


  cancelReasonError.textContent =
    "";


  cancelCharCount.textContent =
    "0 / 500";

  btnConfirmCancel.disabled =
    false;


  btnConfirmCancel.textContent =
    "Xác nhận hủy";

  cancelModal.classList.add(
    "show"
  );


  document.body.style.overflow =
    "hidden";


  setTimeout(() => {
    cancelReason.focus();
  }, 50);
}

function closeCancelModal() {
  cancelModal.classList.remove(
    "show"
  );


  cancelLichId.value = "";


  cancelReason.value = "";


  cancelReason.classList.remove(
    "invalid"
  );


  cancelReasonError.textContent =
    "";


  cancelCharCount.textContent =
    "0 / 500";


  btnConfirmCancel.disabled =
    false;


  btnConfirmCancel.textContent =
    "Xác nhận hủy";


  if (
    !detailModal.classList.contains(
      "show"
    )
  ) {
    document.body.style.overflow =
      "";
  }
}

function validateCancelReason() {
  const reason =
    cancelReason.value.trim();


  cancelReason.classList.remove(
    "invalid"
  );


  cancelReasonError.textContent =
    "";


  if (!reason) {
    cancelReason.classList.add(
      "invalid"
    );


    cancelReasonError.textContent =
      "Vui lòng nhập lý do hủy lịch.";


    cancelReason.focus();


    return null;
  }


  if (reason.length > 500) {
    cancelReason.classList.add(
      "invalid"
    );


    cancelReasonError.textContent =
      "Lý do hủy không được vượt quá 500 ký tự.";


    cancelReason.focus();


    return null;
  }


  return reason;
}

async function confirmCancelSchedule() {
  const id =
    Number(
      cancelLichId.value
    );


  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    alert(
      "ID lịch tiêm không hợp lệ."
    );

    return;
  }


  const item =
    danhSachLich.find(
      (schedule) =>
        Number(schedule.id) === id
    );


  if (!item) {
    alert("Không tìm thấy lịch tiêm cần hủy.");
    closeCancelModal();
    return;
  }

  if (item.trang_thai_hoan_tien) {
    closeCancelModal();

    alert(
      item.trang_thai_hoan_tien === "CHO_XU_LY"
        ? "Yêu cầu hoàn tiền đang chờ Admin xử lý. Không thể gửi lại."
        : "Lịch này đã có yêu cầu hoàn tiền trước đó."
    );

    return;
  }


  if (
    item.trang_thai !== "CHO_DUYET" &&
    item.trang_thai !== "DA_DUYET"
  ) {
    alert(
      "Trạng thái lịch hiện tại không cho phép hủy."
    );


    closeCancelModal();


    return;
  }


  const lyDo =
    validateCancelReason();


  if (!lyDo) {
    return;
  }


  btnConfirmCancel.disabled =
    true;


  btnConfirmCancel.textContent =
    "Đang xử lý...";


  try {
    const response =
      await fetch(
        `${API_BASE_URL}/lich/admin/${id}/status`,
        {
          method: "PUT",

          headers:
            getAuthHeaders(true),

          body:
            JSON.stringify({
              trang_thai:
                "DA_HUY",

              ly_do:
                lyDo
            })
        }
      );

    if (await checkAuthResponse(response)) return;

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        "Hủy lịch thất bại"
      );
    }


    closeCancelModal();


    alert(
      result.message ||
      "Xử lý hủy lịch thành công"
    );


    await loadSchedules();

  } catch (error) {
    console.error(
      "Lỗi hủy lịch:",
      error
    );


    alert(
      error.message ||
      "Lỗi khi hủy lịch"
    );


    btnConfirmCancel.disabled =
      false;


    btnConfirmCancel.textContent =
      "Xác nhận hủy";
  }
}

async function updateStatus(
  id,
  newStatus
) {
  if (newStatus !== "DA_DUYET") {
    console.warn(
      "updateStatus chỉ được sử dụng để duyệt lịch."
    );

    return;
  }


  if (
    !confirm(
      "Bạn có chắc muốn duyệt lịch này?"
    )
  ) {
    return;
  }


  try {
    const response =
      await fetch(
        `${API_BASE_URL}/lich/admin/${id}/status`,
        {
          method: "PUT",

          headers:
            getAuthHeaders(true),

          body:
            JSON.stringify({
              trang_thai:
                newStatus
            })
        }
      );

    if (await checkAuthResponse(response)) return;

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        "Cập nhật trạng thái thất bại"
      );
    }

    alert(
      result.message ||
      "Duyệt lịch thành công"
    );


    await loadSchedules();

  } catch (error) {
    console.error(
      "Lỗi cập nhật trạng thái:",
      error
    );


    alert(
      error.message ||
      "Lỗi khi cập nhật trạng thái"
    );
  }
}

async function confirmCashPayment(
  lichId,
  nguoiDungId
) {
  if (
    !confirm(
      "Xác nhận đã thu tiền mặt cho lịch tiêm này?"
    )
  ) {
    return;
  }


  try {
    const response =
      await fetch(
        `${API_BASE_URL}/thanh-toan/tien-mat/xac-nhan`,
        {
          method: "POST",

          headers:
            getAuthHeaders(true),

          body:
            JSON.stringify({

              lich_tiem_id:
                lichId,

              user_id:
                nguoiDungId
            })
        }
      );

    if (await checkAuthResponse(response)) return;

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        "Xác nhận tiền mặt thất bại"
      );
    }


    alert(
      result.message ||
      "Xác nhận thanh toán tiền mặt thành công"
    );


    await loadSchedules();

  } catch (error) {
    console.error(
      "Lỗi xác nhận tiền mặt:",
      error
    );


    alert(
      error.message ||
      "Lỗi xác nhận tiền mặt"
    );
  }
}

async function confirmInjected(
  lichId
) {
  const item =
    danhSachLich.find(
      (schedule) =>
        Number(schedule.id) ===
        Number(lichId)
    );

  if (!item) {
    alert(
      "Không tìm thấy thông tin lịch tiêm."
    );

    return;
  }

  if (isRefundPending(item)) {
    alert(
      "Lịch tiêm đang chờ Admin xử lý hoàn tiền. " +
      "Không thể xác nhận đã tiêm."
    );
    return;
  }

  if (
    item.trang_thai !== "DA_DUYET"
  ) {
    alert(
      "Chỉ lịch đã được duyệt mới có thể xác nhận đã tiêm."
    );

    return;
  }

  if (item.ket_qua_sang_loc !== "DU_DIEU_KIEN") {
    alert(
      "Khách hàng chưa được xác nhận đủ điều kiện tiêm. " +
      "Không thể xác nhận đã tiêm."
    );

    return;
  }

  if (
    getPaymentStatus(item) !==
    "DA_THANH_TOAN"
  ) {
    alert(
      "Lịch chưa thanh toán. Không thể xác nhận đã tiêm."
    );

    return;
  }

  if (!isVaccinationDateToday(item.ngay_tiem)) {
    const ngayTiem =
      formatDateToDDMMYYYY(item.ngay_tiem) || "—";

    alert(
      `Chỉ được xác nhận đã tiêm đúng ngày hẹn (${ngayTiem}).`
    );

    return;
  }

  if (
    !confirm(
      "Xác nhận khách hàng đã tiêm? Hồ sơ tiêm sẽ được tạo tự động."
    )
  ) {
    return;
  }


  try {
    const response =
      await fetch(
        `${API_BASE_URL}/lich/admin/${lichId}/xac-nhan-tiem`,
        {
          method: "POST",

          headers:
            getAuthHeaders(true)
        }
      );

    if (await checkAuthResponse(response)) return;

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        "Xác nhận đã tiêm thất bại"
      );
    }

    alert(
      result.message ||
      "Xác nhận đã tiêm thành công"
    );


    await loadSchedules();

  } catch (error) {
    console.error(
      "Lỗi xác nhận đã tiêm:",
      error
    );


    alert(
      error.message ||
      "Lỗi xác nhận đã tiêm"
    );
  }
}

btnReload.addEventListener(
  "click",
  loadSchedules
);


filterStatus.addEventListener(
  "change",
  loadSchedules
);


filterDate.addEventListener(
  "change",
  loadSchedules
);

btnCloseDetailX.addEventListener(
  "click",
  closeDetailModal
);


btnCloseDetail.addEventListener(
  "click",
  closeDetailModal
);


detailModal.addEventListener(
  "click",
  (event) => {
    if (
      event.target === detailModal
    ) {
      closeDetailModal();
    }
  }
);

btnCloseCancelX.addEventListener(
  "click",
  closeCancelModal
);


btnCloseCancel.addEventListener(
  "click",
  closeCancelModal
);


btnConfirmCancel.addEventListener(
  "click",
  confirmCancelSchedule
);

cancelReason.addEventListener(
  "input",
  () => {
    const length =
      cancelReason.value.length;


    cancelCharCount.textContent =
      `${length} / 500`;


    if (
      cancelReason.value.trim()
    ) {
      cancelReason.classList.remove(
        "invalid"
      );


      cancelReasonError.textContent =
        "";
    }
  }
);

cancelModal.addEventListener(
  "click",
  (event) => {
    if (
      event.target === cancelModal
    ) {
      closeCancelModal();
    }
  }
);

document.addEventListener(
  "click",
  (event) => {
    if (
      !event.target.closest(
        ".more-action-wrap"
      )
    ) {
      closeAllMoreMenus();
    }
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key !== "Escape"
    ) {
      return;
    }


    if (
      cancelModal.classList.contains(
        "show"
      )
    ) {
      closeCancelModal();

      return;
    }


    if (
      detailModal.classList.contains(
        "show"
      )
    ) {
      closeDetailModal();

      return;
    }


    closeAllMoreMenus();
  }
);

const screeningModal = document.getElementById("screeningModal");
const screeningForm = document.getElementById("screeningForm");
const screeningLichId = document.getElementById("screeningLichId");
const screeningBacSi = document.getElementById("screeningBacSi");
const screeningThoiGian = document.getElementById("screeningThoiGian");
const screeningKetQua = document.getElementById("screeningKetQua");
const screeningGhiChu = document.getElementById("screeningGhiChu");
const screeningError = document.getElementById("screeningError");
const btnSaveScreening = document.getElementById("btnSaveScreening");

function closeScreeningModal() {
  screeningModal.classList.remove("show");

  if (
    !detailModal.classList.contains("show") &&
    !cancelModal.classList.contains("show")
  ) {
    document.body.style.overflow = "";
  }
}

function setScreeningReadOnly(readOnly) {
  [
    screeningBacSi,
    screeningThoiGian,
    screeningKetQua,
    screeningGhiChu
  ].forEach((element) => {
    element.disabled = readOnly;
  });

  btnSaveScreening.style.display = readOnly ? "none" : "inline-flex";
}

function toLocalDateTime(value) {
  if (!value) return "";

  const str = String(value);

  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(str)) {
    return str.substring(0, 16).replace(" ", "T");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function openScreeningModal(lichId) {
  const item = danhSachLich.find(
    (lich) => Number(lich.id) === Number(lichId)
  );

  if (!item || item.trang_thai !== "DA_DUYET") {
    alert("Chỉ được khám sàng lọc cho lịch đã duyệt.");
    return;
  }
  if (isRefundPending(item)) {
    alert(
      "Lịch đang chờ xử lý hoàn tiền. " +
      "Không thể tiếp tục khám sàng lọc."
    );
    return;
  }

  if (!isVaccinationDateToday(item.ngay_tiem)) {
    alert(
      `Chỉ được khám sàng lọc đúng ngày tiêm đã đăng ký ` +
      `(${formatDateToDDMMYYYY(item.ngay_tiem)}).`
    );
    return;
  }

  screeningForm.reset();
  screeningError.textContent = "";
  screeningLichId.value = lichId;

  setScreeningReadOnly(true);

  screeningThoiGian.value = toLocalDateTime(new Date());

  document.getElementById("screeningModalTitle").textContent =
    "Khám sàng lọc";

  screeningModal.classList.add("show");
  document.body.style.overflow = "hidden";

  try {
    const response = await fetch(
      `${API_BASE_URL}/kham-sang-loc/${lichId}`,
      {
        headers: getAuthHeaders()
      }
    );

    if (await checkAuthResponse(response)) return;

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Không thể tải kết quả khám sàng lọc"
      );
    }

    const data = result.data;

    if (data) {
      screeningBacSi.value = data.bac_si_kham || "";
      screeningThoiGian.value = toLocalDateTime(
        data.thoi_gian_kham
      );
      screeningKetQua.value = data.ket_qua || "";
      screeningGhiChu.value = data.ghi_chu || "";

      document.getElementById("screeningModalTitle").textContent =
        "Xem kết quả khám sàng lọc";

      setScreeningReadOnly(true);
    } else {
      document.getElementById("screeningModalTitle").textContent =
        "Ghi nhận khám sàng lọc";

      setScreeningReadOnly(false);
    }
  } catch (error) {
    screeningError.textContent = error.message;
    setScreeningReadOnly(true);
  }
}

async function saveScreening(event) {
  event.preventDefault();

  const lichId = Number(screeningLichId.value);

  if (!Number.isInteger(lichId) || lichId <= 0) {
    screeningError.textContent = "Mã lịch tiêm không hợp lệ.";
    return;
  }

  const payload = {
    lich_tiem_id: lichId,
    bac_si_kham: screeningBacSi.value.trim(),
    thoi_gian_kham: screeningThoiGian.value,
    ket_qua: screeningKetQua.value,
    ghi_chu: screeningGhiChu.value.trim()
  };

  if (
    !payload.bac_si_kham ||
    !payload.thoi_gian_kham ||
    !payload.ket_qua
  ) {
    screeningError.textContent =
      "Vui lòng nhập đầy đủ thông tin bắt buộc.";
    return;
  }

  const bacSiRegex = /^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u;
  if (
    payload.bac_si_kham.length < 2 ||
    payload.bac_si_kham.length > 50 ||
    !bacSiRegex.test(payload.bac_si_kham)
  ) {
    screeningError.textContent =
      "Tên bác sĩ phải từ 2 đến 50 ký tự, không chứa số hoặc ký tự đặc biệt.";
    return;
  }

  const thoiGian = new Date(payload.thoi_gian_kham);

  if (
    !Number.isFinite(thoiGian.getTime()) ||
    thoiGian.getTime() > Date.now()
  ) {
    screeningError.textContent =
      "Thời gian khám không hợp lệ hoặc ở tương lai.";
    return;
  }

  const item = danhSachLich.find(
    (lich) => Number(lich.id) === lichId
  );

  if (
    !item ||
    payload.thoi_gian_kham.slice(0, 10) !==
    normalizeDateValue(item.ngay_tiem)
  ) {
    screeningError.textContent =
      "Ngày khám sàng lọc phải trùng ngày tiêm đã đăng ký.";
    return;
  }

  if (payload.ghi_chu.length > 1000) {
    screeningError.textContent =
      "Ghi chú không được vượt quá 1000 ký tự.";
    return;
  }

  if (
    ["TAM_HOAN", "CHONG_CHI_DINH"].includes(payload.ket_qua) &&
    !payload.ghi_chu
  ) {
    screeningError.textContent =
      "Vui lòng nhập lý do tạm hoãn hoặc chống chỉ định tiêm.";
    return;
  }

  screeningError.textContent = "";
  btnSaveScreening.disabled = true;
  btnSaveScreening.textContent = "Đang lưu...";

  try {
    const response = await fetch(
      `${API_BASE_URL}/kham-sang-loc`,
      {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload)
      }
    );

    if (await checkAuthResponse(response)) return;

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Không thể lưu kết quả khám sàng lọc"
      );
    }

    alert("Ghi nhận kết quả khám sàng lọc thành công!");

    closeScreeningModal();
    await loadSchedules();
  } catch (error) {
    screeningError.textContent = error.message;
  } finally {
    btnSaveScreening.disabled = false;
    btnSaveScreening.textContent = "Lưu kết quả";
  }
}

screeningForm.addEventListener("submit", saveScreening);

document
  .getElementById("btnCloseScreeningX")
  .addEventListener("click", closeScreeningModal);

document
  .getElementById("btnCloseScreening")
  .addEventListener("click", closeScreeningModal);

screeningModal.addEventListener("click", (event) => {
  if (event.target === screeningModal) {
    closeScreeningModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    screeningModal.classList.contains("show")
  ) {
    closeScreeningModal();
  }
});

loadSchedules();
