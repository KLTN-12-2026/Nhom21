const API_PRICE = "http://localhost:3000/api/prices";
const API_VACCINE = "http://localhost:3000/api/vaccine";

// ======================================================
// KIỂM TRA ĐĂNG NHẬP + QUYỀN ADMIN
// ======================================================

const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

if (!user || !token) {
  window.top.location.href = new URL(
    "../khach-hang/dangnhap.html",
    window.location.href
  ).href;
} else if (user.vai_tro !== "ADMIN") {
  window.top.location.href = new URL(
    "../common/trangchu.html",
    window.location.href
  ).href;
}

// ======================================================
// DOM
// ======================================================

const tbody = document.querySelector("#priceTable tbody");
const vaccineSelect = document.getElementById("vaccine_id");
const giaBanInput = document.getElementById("gia_ban");
const giaUuDaiInput = document.getElementById("gia_uu_dai");

let toastTimer;

// ======================================================
// HÀM DÙNG CHUNG
// ======================================================

function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    value.toString().trim() === ""
  );
}

function isPositiveInteger(value) {
  return (
    Number.isInteger(Number(value)) &&
    Number(value) > 0
  );
}

function formatMoney(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return Number(value).toLocaleString("vi-VN") + " đ";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("vi-VN");
}

function hienThiTrangThai(val) {
  if (val === "DANG_AP_DUNG") {
    return "Đang áp dụng";
  }

  if (val === "HET_HIEU_LUC") {
    return "Hết hiệu lực";
  }

  return "Không xác định";
}
function showToast(message, type = "success") {
  alert(message);
}

// ======================================================
// VALIDATE GIÁ
// ======================================================

function validatePricePayload(payload) {
  if (
    !payload.vaccine_id ||
    Number(payload.vaccine_id) <= 0
  ) {
    return "Vui lòng chọn vaccine";
  }

  if (!isPositiveInteger(payload.gia_ban)) {
    return "Giá bán phải là số nguyên dương lớn hơn 0";
  }

  if (payload.gia_ban > 100000000) {
    return "Giá bán không được vượt quá 100.000.000";
  }

  if (payload.gia_uu_dai !== null) {
    if (!isPositiveInteger(payload.gia_uu_dai)) {
      return "Giá ưu đãi phải là số nguyên dương lớn hơn 0";
    }

    if (
      payload.gia_uu_dai >=
      payload.gia_ban
    ) {
      return "Giá ưu đãi phải nhỏ hơn giá bán";
    }

    if (payload.gia_uu_dai > 100000000) {
      return "Giá ưu đãi không được vượt quá 100.000.000";
    }
  }

  return "";
}

// ======================================================
// LOAD VACCINE VÀO SELECT THÊM GIÁ
// ======================================================

async function loadVaccinesToSelect() {
  try {
    const [vaccineRes, priceRes] =
      await Promise.all([
        fetch(API_VACCINE),
        fetch(API_PRICE)
      ]);

    if (!vaccineRes.ok) {
      throw new Error(
        "Không tải được danh sách vaccine"
      );
    }

    if (!priceRes.ok) {
      throw new Error(
        "Không tải được danh sách bảng giá"
      );
    }

    const vaccines = await vaccineRes.json();
    const prices = await priceRes.json();

    /*
      API /prices của Admin trả giá gần nhất
      của từng vaccine.

      Những vaccine đã từng có giá sẽ không
      xuất hiện trong form "Thêm bảng giá".

      Nếu vaccine từng NGUNG rồi kích hoạt lại,
      Admin sử dụng nút "Đổi giá" trên bảng
      để tạo giá DANG_AP_DUNG mới.
    */

    const vaccineDaCoGia = new Set(
      prices.map((item) =>
        Number(item.vaccine_id)
      )
    );

    vaccineSelect.innerHTML =
      `<option value="">Chọn vaccine</option>`;

    vaccines.forEach((item) => {
      // Vaccine đã từng có giá
      // -> không thêm giá lần đầu nữa
      if (
        vaccineDaCoGia.has(Number(item.id))
      ) {
        return;
      }

      // Vaccine NGUNG không được thêm giá
      if (item.trang_thai === "NGUNG") {
        return;
      }

      const option =
        document.createElement("option");

      option.value = item.id;
      option.textContent = item.ten_vaccine;

      vaccineSelect.appendChild(option);
    });
  } catch (err) {
    console.error(
      "LỖI TẢI DANH SÁCH VACCINE:",
      err
    );

    showToast(err.message, "error");
  }
}

// ======================================================
// LOAD BẢNG GIÁ ADMIN
// ======================================================

async function loadBangGia() {
  try {
    const res = await fetch(API_PRICE);

    if (!res.ok) {
      throw new Error(
        "Không tải được dữ liệu bảng giá"
      );
    }

    const data = await res.json();

    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td
            colspan="9"
            class="readonly-cell"
            style="text-align:center"
          >
            Chưa có dữ liệu bảng giá
          </td>
        </tr>
      `;

      return;
    }

    data.forEach((item, index) => {
      const tr = document.createElement("tr");

      /*
        QUAN TRỌNG:

        Backend phải trả:
        item.trang_thai_vaccine

        Ví dụ:
        CON
        HET
        NGUNG

        Khi gọi moDoiGia(), truyền trạng thái
        vaccine vào để kiểm tra trước khi mở modal.
      */


      tr.innerHTML = `
  <td data-label="STT">
    ${index + 1}
  </td>

  <td data-label="Vaccine" class="readonly-cell">
    ${item.ten_vaccine || ""}
  </td>

  <td data-label="Phòng bệnh" class="readonly-cell">
    ${item.phong_benh || ""}
  </td>

  <td data-label="Nước SX" class="readonly-cell">
    ${item.nuoc_sx || ""}
  </td>

  <td data-label="Giá bán" class="readonly-cell">
    ${formatMoney(item.gia_ban)}
  </td>

  <td data-label="Giá ưu đãi" class="readonly-cell">
    ${formatMoney(item.gia_uu_dai)}
  </td>

  <td data-label="Áp dụng từ" class="readonly-cell">
    ${formatDate(item.ngay_bat_dau)}
  </td>

  <td data-label="Trạng thái" class="readonly-cell">
    ${hienThiTrangThai(item.trang_thai)}
  </td>

  <td data-label="Thao tác">
    <div class="action-group">

      <button
        class="small-btn save-btn"
        onclick="moDoiGia(
          ${item.id},
          ${item.vaccine_id},
          ${item.gia_ban},
          ${item.gia_uu_dai ?? "null"},
          '${encodeURIComponent(item.ten_vaccine || "")}',
          '${item.trang_thai_vaccine || ""}'
        )"
      >
        Đổi giá
      </button>

      <button
        class="small-btn history-btn"
        onclick="xemLichSuGia(
          ${item.vaccine_id},
          '${encodeURIComponent(item.ten_vaccine || "")}'
        )"
      >
        Lịch sử
      </button>

    </div>
  </td>
`;


      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(
      "LỖI TẢI BẢNG GIÁ:",
      err
    );

    showToast(
      "Không tải được dữ liệu bảng giá",
      "error"
    );
  }
}

// ======================================================
// THÊM BẢNG GIÁ
// ======================================================

async function themBangGia() {
  const payload = {
    vaccine_id: Number(vaccineSelect.value),

    gia_ban: isEmpty(giaBanInput.value)
      ? 0
      : Number(giaBanInput.value),

    gia_uu_dai: isEmpty(
      giaUuDaiInput.value
    )
      ? null
      : Number(giaUuDaiInput.value)
  };

  const errorMessage =
    validatePricePayload(payload);

  if (errorMessage) {
    showToast(
      errorMessage,
      "warning"
    );

    return;
  }

  try {
    const res = await fetch(API_PRICE, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },

      body: JSON.stringify(payload)
    });
    if (await checkAuthResponse(res)) return;
    const result = await res.json();

    if (!res.ok) {
      throw new Error(
        result.message ||
        "Thêm bảng giá thất bại"
      );
    }

    showToast(
      result.message ||
      "Thêm bảng giá thành công",
      "success"
    );

    vaccineSelect.value = "";
    giaBanInput.value = "";
    giaUuDaiInput.value = "";

    await loadBangGia();
    await loadVaccinesToSelect();
  } catch (err) {
    console.error(
      "LỖI THÊM BẢNG GIÁ:",
      err
    );

    showToast(
      "Lỗi thêm bảng giá: " +
      err.message,
      "error"
    );
  }
}

// ======================================================
// MỞ MODAL ĐỔI GIÁ
// ======================================================

function moDoiGia(
  id,
  vaccineId,
  giaBanHienTai,
  giaUuDaiHienTai,
  encodedTenVaccine,
  trangThaiVaccine
) {
  /*
    ====================================================
    NGHIỆP VỤ:

    Vaccine NGUNG:
    - Vẫn hiển thị nút Đổi giá.
    - Nhưng không cho mở modal.
    - Yêu cầu Admin kích hoạt vaccine trước.
    ====================================================
  */

  if (trangThaiVaccine === "NGUNG") {
    alert(
      "Vaccine này đã ngừng sử dụng.\n" +
      "Vui lòng kích hoạt lại vaccine trước khi đổi giá."
    );

    return;
  }

  const tenVaccine =
    decodeURIComponent(encodedTenVaccine);

  document.getElementById(
    "doi_gia_id"
  ).value = id;

  document.getElementById(
    "doi_gia_vaccine_id"
  ).value = vaccineId;

  document.getElementById(
    "doi_gia_ten_vaccine"
  ).textContent = tenVaccine;

  document.getElementById(
    "doi_gia_hien_tai"
  ).textContent =
    formatMoney(giaBanHienTai);

  document.getElementById(
    "doi_gia_uu_dai_hien_tai"
  ).textContent =
    formatMoney(giaUuDaiHienTai);

  document.getElementById(
    "doi_gia_ban"
  ).value = giaBanHienTai;

  document.getElementById(
    "doi_gia_uu_dai"
  ).value =
    giaUuDaiHienTai ?? "";

  document.getElementById(
    "doiGiaModal"
  ).classList.add("show");
}

// ======================================================
// ĐÓNG MODAL ĐỔI GIÁ
// ======================================================

function dongModalDoiGia() {
  document.getElementById(
    "doiGiaModal"
  ).classList.remove("show");

  document.getElementById(
    "doi_gia_id"
  ).value = "";

  document.getElementById(
    "doi_gia_vaccine_id"
  ).value = "";

  document.getElementById(
    "doi_gia_ban"
  ).value = "";

  document.getElementById(
    "doi_gia_uu_dai"
  ).value = "";
}

// ======================================================
// XÁC NHẬN ĐỔI GIÁ
// ======================================================

async function xacNhanDoiGia() {
  const id = Number(
    document.getElementById(
      "doi_gia_id"
    ).value
  );

  const vaccineId = Number(
    document.getElementById(
      "doi_gia_vaccine_id"
    ).value
  );

  const rawGiaBan =
    document.getElementById(
      "doi_gia_ban"
    ).value;

  const rawGiaUuDai =
    document.getElementById(
      "doi_gia_uu_dai"
    ).value;

  const payload = {
    vaccine_id: vaccineId,

    gia_ban: isEmpty(rawGiaBan)
      ? 0
      : Number(rawGiaBan),

    gia_uu_dai: isEmpty(rawGiaUuDai)
      ? null
      : Number(rawGiaUuDai)
  };

  const errorMessage =
    validatePricePayload(payload);

  if (errorMessage) {
    showToast(
      errorMessage,
      "warning"
    );

    return;
  }

  try {
    const res = await fetch(
      `${API_PRICE}/${id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },

        body: JSON.stringify(payload)
      }
    );

    if (await checkAuthResponse(res)) return;

    const result = await res.json();

    if (!res.ok) {
      throw new Error(
        result.message ||
        "Đổi giá thất bại"
      );
    }

    dongModalDoiGia();

    showToast(
      result.message ||
      "Đổi giá thành công",
      "success"
    );

    await loadBangGia();
    await loadVaccinesToSelect();
  } catch (err) {
    console.error(
      "LỖI ĐỔI GIÁ:",
      err
    );

    showToast(
      "Lỗi đổi giá: " +
      err.message,
      "error"
    );
  }
}

// ======================================================
// XEM LỊCH SỬ GIÁ
// ======================================================

async function xemLichSuGia(
  vaccineId,
  encodedTenVaccine
) {
  const tenVaccine =
    decodeURIComponent(encodedTenVaccine);

  const modal =
    document.getElementById(
      "lichSuGiaModal"
    );

  const title =
    document.getElementById(
      "lichSuGiaTitle"
    );

  const historyBody =
    document.getElementById(
      "historyTableBody"
    );

  title.innerHTML = `
    <span class="modal-icon">🕘</span>
    Lịch sử giá - ${tenVaccine}
  `;

  historyBody.innerHTML = `
    <tr>
      <td
        colspan="6"
        style="text-align:center"
      >
        Đang tải dữ liệu...
      </td>
    </tr>
  `;

  modal.classList.add("show");

  try {
    const res = await fetch(
      `${API_PRICE}/history/${vaccineId}`,
      {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    if (await checkAuthResponse(res)) return;

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
        "Không tải được lịch sử giá"
      );
    }

    historyBody.innerHTML = "";

    if (data.length === 0) {
      historyBody.innerHTML = `
        <tr>
          <td
            colspan="6"
            style="text-align:center"
          >
            Chưa có lịch sử giá
          </td>
        </tr>
      `;

      return;
    }

    data.forEach((item, index) => {
      const tr =
        document.createElement("tr");

      tr.innerHTML = `
  <td data-label="STT">
    ${index + 1}
  </td>

  <td data-label="Giá bán">
    ${formatMoney(item.gia_ban)}
  </td>

  <td data-label="Giá ưu đãi">
    ${formatMoney(item.gia_uu_dai)}
  </td>

  <td data-label="Bắt đầu">
    ${formatDate(item.ngay_bat_dau)}
  </td>

  <td data-label="Kết thúc">
    ${formatDate(item.ngay_ket_thuc)}
  </td>

  <td data-label="Trạng thái">
    ${hienThiTrangThai(item.trang_thai)}
  </td>
`;

      historyBody.appendChild(tr);
    });
  } catch (err) {
    console.error(
      "LỖI LẤY LỊCH SỬ GIÁ:",
      err
    );

    historyBody.innerHTML = `
      <tr>
        <td
          colspan="6"
          style="text-align:center"
        >
          Không tải được lịch sử giá
        </td>
      </tr>
    `;

    showToast(
      "Lỗi lấy lịch sử giá: " +
      err.message,
      "error"
    );
  }
}

// ======================================================
// ĐÓNG MODAL LỊCH SỬ
// ======================================================

function dongModalLichSuGia() {
  document.getElementById(
    "lichSuGiaModal"
  ).classList.remove("show");
}

// ======================================================
// RELOAD KHI QUAY LẠI TAB
// ======================================================

window.addEventListener(
  "focus",
  async () => {
    await loadVaccinesToSelect();
    await loadBangGia();
  }
);

document.addEventListener(
  "visibilitychange",
  async () => {
    if (!document.hidden) {
      await loadVaccinesToSelect();
      await loadBangGia();
    }
  }
);

// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.themBangGia =
  themBangGia;

window.moDoiGia =
  moDoiGia;

window.dongModalDoiGia =
  dongModalDoiGia;

window.xacNhanDoiGia =
  xacNhanDoiGia;

window.xemLichSuGia =
  xemLichSuGia;

window.dongModalLichSuGia =
  dongModalLichSuGia;

// ======================================================
// INIT
// ======================================================

async function initPage() {
  await loadVaccinesToSelect();
  await loadBangGia();
}

initPage();