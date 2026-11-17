
const API_PRICE = "http://localhost:3000/api/prices";

/* =========================
   KHỞI TẠO TRANG BẢNG GIÁ
========================= */

document.addEventListener("DOMContentLoaded", async () => {
  const sortSelect = document.getElementById("sortSelect");

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      sortTable(this.value);
    });
  }

  await loadBangGiaKhachHang();
});

/* =========================
   ĐỊNH DẠNG GIÁ TIỀN
========================= */

function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const price = Number(value);

  if (!Number.isFinite(price)) {
    return "";
  }

  return price.toLocaleString("vi-VN");
}

/* =========================
   CHUYỂN GIÁ TIỀN VỀ SỐ
========================= */

function parsePrice(text) {
  if (!text) return 0;

  const number = String(text).replace(/[^\d]/g, "");

  return Number(number) || 0;
}

/* =========================
   TẠO Ô TRONG BẢNG
========================= */

function createCell(row, value, className = "") {
  const td = document.createElement("td");

  td.textContent = value ?? "";

  if (className) {
    td.className = className;
  }

  row.appendChild(td);

  return td;
}

/* =========================
   HIỂN THỊ THÔNG BÁO
========================= */

function showTableMessage(message) {
  const tbody = document.getElementById("priceTableBody");

  if (!tbody) return;

  tbody.innerHTML = "";

  const tr = document.createElement("tr");
  const td = document.createElement("td");

  td.colSpan = 7;
  td.textContent = message;
  td.style.textAlign = "center";
  td.style.padding = "20px";
  td.style.color = "#64748b";

  tr.appendChild(td);
  tbody.appendChild(tr);
}

/* =========================
   TẢI BẢNG GIÁ TỪ BACKEND
========================= */

async function loadBangGiaKhachHang() {
  const tbody = document.getElementById("priceTableBody");

  if (!tbody) return;

  showTableMessage("Đang tải bảng giá vaccine...");

  try {
    const res = await fetch(API_PRICE);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Dữ liệu bảng giá không đúng định dạng");
    }

    tbody.innerHTML = "";

    if (data.length === 0) {
      showTableMessage("Hiện chưa có dữ liệu bảng giá vaccine.");
      return;
    }

    data.forEach((item, index) => {
      const tr = document.createElement("tr");

      let statusClass = "";
      let statusText = "";

      if (item.trang_thai === "DANG_AP_DUNG") {
        statusClass = "status-yes";
        statusText = "Đang áp dụng";
      } else if (item.trang_thai === "HET_HIEU_LUC") {
        statusClass = "status-no";
        statusText = "Hết hiệu lực";
      } else {
        statusText = "Chưa xác định";
      }

      createCell(tr, index + 1);
      createCell(tr, item.phong_benh || "");
      createCell(tr, item.ten_vaccine || "");
      createCell(tr, item.nuoc_sx || "");
      createCell(tr, formatPrice(item.gia_ban));

      createCell(
        tr,
        item.gia_uu_dai !== null &&
          item.gia_uu_dai !== undefined &&
          item.gia_uu_dai !== ""
          ? formatPrice(item.gia_uu_dai)
          : ""
      );

      createCell(tr, statusText, statusClass);

      tbody.appendChild(tr);
    });

    // Giữ lựa chọn sắp xếp nếu đã chọn
    const sortSelect = document.getElementById("sortSelect");

    if (sortSelect && sortSelect.value) {
      sortTable(sortSelect.value);
    }

  } catch (err) {
    console.error("Lỗi tải bảng giá:", err);

    showTableMessage(
      "Không thể tải bảng giá vaccine. Vui lòng thử lại sau."
    );
  }
}

/* =========================
   SẮP XẾP BẢNG GIÁ
========================= */

function sortTable(type) {
  const tbody = document.getElementById("priceTableBody");

  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll("tr"))
    .filter(row => row.children.length === 7);

  if (rows.length === 0) return;

  rows.sort((a, b) => {
    const vaccineA = a.children[2].textContent.trim();
    const vaccineB = b.children[2].textContent.trim();

    const priceA = parsePrice(
      a.children[4].textContent.trim()
    );

    const priceB = parsePrice(
      b.children[4].textContent.trim()
    );

    if (type === "name-asc") {
      return vaccineA.localeCompare(vaccineB, "vi", {
        sensitivity: "base"
      });
    }

    if (type === "price-asc") {
      return priceA - priceB;
    }

    if (type === "price-desc") {
      return priceB - priceA;
    }

    return 0;
  });

  rows.forEach((row, index) => {
    row.children[0].textContent = index + 1;
    tbody.appendChild(row);
  });
}
