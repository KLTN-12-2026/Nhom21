
const API_BASE_URL = "http://localhost:3000/api";

const user = JSON.parse(localStorage.getItem("user") || "null");
const token = localStorage.getItem("token");

if (!user || !token) {
  alert("Bạn chưa đăng nhập!");

  window.top.location.href = new URL(
    "../khach-hang/dangnhap.html",
    window.location.href
  ).href;
} else {
  const vaiTro = user.vai_tro || user.role;

  if (vaiTro !== "ADMIN") {
    alert("Bạn không có quyền truy cập chức năng này!");

    window.top.location.href = new URL(
      "../common/trangchu.html",
      window.location.href
    ).href;
  }
}

const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const reportType = document.getElementById("reportType");

const filterVaccine = document.getElementById("filterVaccine");
const filterFacility = document.getElementById("filterFacility");
const filterPaymentMethod = document.getElementById("filterPaymentMethod");

const btnReloadAll = document.getElementById("btnReloadAll");
const btnResetFilters = document.getElementById("btnResetFilters");
const btnRefreshData = document.getElementById("btnRefreshData");

const btnExportVaccineReport = document.getElementById("btnExportVaccineReport");
const btnExportRevenueReport = document.getElementById("btnExportRevenueReport");

const totalSchedules = document.getElementById("totalSchedules");
const pendingSchedules = document.getElementById("pendingSchedules");
const totalDosesInjected = document.getElementById("totalDosesInjected");
const totalStockDoses = document.getElementById("totalStockDoses");

const totalRevenue = document.getElementById("totalRevenue");
const paidRevenue = document.getElementById("paidRevenue");
const refundRevenue = document.getElementById("refundRevenue");
const totalTransactions = document.getElementById("totalTransactions");

const tblVaccineReport = document.getElementById("tblVaccineReport");
const tblRevenueReport = document.getElementById("tblRevenueReport");
const revenueTimeHeader = document.getElementById("revenueTimeHeader");

const reportMessage = document.getElementById("reportMessage");

let vaccineRows = [];
let stockRows = [];
let revenueRows = [];

let chartInjectedByVaccine = null;
let chartStockByVaccine = null;
let chartRevenueByTime = null;
let chartRevenueByMethod = null;

let appliedFilterSnapshot = "";
let reportLoadedSuccessfully = false;
let isLoadingReport = false;

function getTodayString() {
  const d = new Date();

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function getFirstDayOfMonth() {
  const d = new Date();

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-01`;
}

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function convertPeriodToDate(value, type, isEnd = false) {
  if (!value) return "";

  if (type === "year") {
    if (!/^\d{4}$/.test(value)) return "";

    const year = Number(value);

    if (year < 1900 || year > 9999) return "";

    return isEnd
      ? `${value}-12-31`
      : `${value}-01-01`;
  }

  if (type === "month") {
    if (!/^\d{4}-\d{2}$/.test(value)) return "";

    const [year, month] = value.split("-").map(Number);

    if (
      year < 1900 ||
      year > 9999 ||
      month < 1 ||
      month > 12
    ) {
      return "";
    }

    if (isEnd) {
      const lastDay = getLastDayOfMonth(year, month);

      return `${value}-${String(lastDay).padStart(2, "0")}`;
    }

    return `${value}-01`;
  }

  if (type === "day") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return "";
    }

    const [year, month, day] = value.split("-").map(Number);

    if (
      year < 1900 ||
      year > 9999 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > getLastDayOfMonth(year, month)
    ) {
      return "";
    }

    return value;
  }

  return "";
}

function convertDateToPeriod(value, type) {
  if (!value) return "";

  if (type === "year") {
    return value.slice(0, 4);
  }

  if (type === "month") {
    return value.slice(0, 7);
  }

  return value;
}

function syncDatesByReportType() {
  const type = reportType.value;

  const fromLabel = document.getElementById("fromDateLabel");
  const toLabel = document.getElementById("toDateLabel");

  const oldType = fromDate.dataset.periodType || "day";

  const oldFrom = convertPeriodToDate(
    fromDate.value,
    oldType,
    false
  );

  const oldTo = convertPeriodToDate(
    toDate.value,
    oldType,
    true
  );

  const labels = {
    day: ["Từ ngày", "Đến ngày"],
    month: ["Từ tháng", "Đến tháng"],
    year: ["Từ năm", "Đến năm"]
  };

  const inputTypes = {
    day: "date",
    month: "month",
    year: "number"
  };

  fromLabel.textContent = labels[type][0];
  toLabel.textContent = labels[type][1];

  fromDate.type = inputTypes[type];
  toDate.type = inputTypes[type];

  if (type === "year") {
    fromDate.min = "1900";
    toDate.min = "1900";

    fromDate.max = "9999";
    toDate.max = "9999";

    fromDate.step = "1";
    toDate.step = "1";

    fromDate.placeholder = "VD: 2024";
    toDate.placeholder = "VD: 2026";
  } else {
    fromDate.removeAttribute("min");
    toDate.removeAttribute("min");

    fromDate.removeAttribute("max");
    toDate.removeAttribute("max");

    fromDate.removeAttribute("step");
    toDate.removeAttribute("step");

    fromDate.removeAttribute("placeholder");
    toDate.removeAttribute("placeholder");
  }

  fromDate.value = convertDateToPeriod(oldFrom, type);
  toDate.value = convertDateToPeriod(oldTo, type);

  fromDate.dataset.periodType = type;
  toDate.dataset.periodType = type;
}

function setDefaultFilters() {
  reportType.value = "day";

  fromDate.type = "date";
  toDate.type = "date";

  fromDate.value = getFirstDayOfMonth();
  toDate.value = getTodayString();

  fromDate.dataset.periodType = "day";
  toDate.dataset.periodType = "day";

  syncDatesByReportType();
}

function validateFilters() {
  const type = reportType.value;

  if (!fromDate.value || !toDate.value) {
    alert("Vui lòng chọn đầy đủ khoảng thời gian!");
    return false;
  }

  const start = convertPeriodToDate(
    fromDate.value,
    type,
    false
  );

  const end = convertPeriodToDate(
    toDate.value,
    type,
    true
  );

  if (!start || !end) {
    alert("Ngày, tháng hoặc năm không hợp lệ!");
    return false;
  }

  if (start > end) {
    alert(
      "Thời gian bắt đầu phải nhỏ hơn hoặc bằng thời gian kết thúc!"
    );
    return false;
  }

  return true;
}

function buildQueryParams() {
  const params = new URLSearchParams();

  const type = reportType.value;

  const startDate = convertPeriodToDate(
    fromDate.value,
    type,
    false
  );

  const endDate = convertPeriodToDate(
    toDate.value,
    type,
    true
  );

  if (startDate) {
    params.append("fromDate", startDate);
  }

  if (endDate) {
    params.append("toDate", endDate);
  }

  params.append("type", type);

  if (
    filterVaccine.value &&
    filterVaccine.value !== "ALL"
  ) {
    params.append("vaccine", filterVaccine.value);
  }

  if (
    filterPaymentMethod.value &&
    filterPaymentMethod.value !== "ALL"
  ) {
    params.append(
      "paymentMethod",
      filterPaymentMethod.value
    );
  }

  if (
    filterFacility.value &&
    filterFacility.value !== "ALL"
  ) {
    params.append("co_so_id", filterFacility.value);
  }

  return params.toString();
}

function resetReportFilters() {
  if (isLoadingReport) return;

  filterFacility.value = "ALL";
  filterVaccine.value = "ALL";
  filterPaymentMethod.value = "ALL";

  setDefaultFilters();
  updateRevenueTimeHeader();

  loadReport();
}

function isCurrentFilterApplied() {
  return (
    reportLoadedSuccessfully &&
    appliedFilterSnapshot === buildQueryParams() &&
    !isLoadingReport
  );
}

function updateExportButtons() {
  const canExport = isCurrentFilterApplied();

  btnExportVaccineReport.disabled = !canExport;
  btnExportRevenueReport.disabled = !canExport;
}

function markFiltersChanged() {
  updateExportButtons();

  if (reportMessage) {
    reportMessage.textContent = "";
  }
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND"
  });
}

function formatRevenueDate(value) {
  if (!value) return "-";

  const text = String(value);

  if (/^\d{4}-\d{2}$/.test(text)) {
    const [year, month] = text.split("-");
    return `${month}/${year}`;
  }

  if (/^\d{4}$/.test(text)) {
    return text;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh"
  });
}

function safeText(value) {
  return value === undefined || value === null
    ? ""
    : String(value);
}

function escapeHtml(value) {
  return safeText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCombinedVaccineRows() {
  const vaccineMap = new Map();

  vaccineRows.forEach((item) => {
    const name = item.ten_vaccine;
    if (!name) return;

    vaccineMap.set(name, {
      ...item,
      so_lieu_con: 0,
      so_lieu_kha_dung: null
    });
  });

  stockRows.forEach((item) => {
    const name = item.ten_vaccine;
    if (!name) return;

    const current = vaccineMap.get(name) || {
      ten_vaccine: name,
      so_mui_da_tiem: 0,
      so_lich_cho_tiem: 0,
      so_lich_da_huy: 0,
      tong_lich: 0
    };

    vaccineMap.set(name, {
      ...current,
      so_lieu_con: item.so_lieu_con ?? 0,
      so_lieu_kha_dung: item.so_lieu_kha_dung ?? null
    });
  });

  return Array.from(vaccineMap.values());
}

async function fetchJson(url) {
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const currentToken = localStorage.getItem("token");

  if (!currentUser || !currentToken) {
    throw new Error("Bạn chưa đăng nhập!");
  }

  const vaiTro = currentUser.vai_tro || currentUser.role;

  if (vaiTro !== "ADMIN") {
    throw new Error(
      "Thông tin tài khoản ADMIN không hợp lệ!"
    );
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${currentToken}`
    }
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || `Lỗi API: ${res.status}`
    );
  }

  return data;
}

async function loadFacilities() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/coso`
    );

    if (!response.ok) {
      throw new Error(
        "Không thể tải danh sách cơ sở tiêm"
      );
    }

    const result = await response.json();

    const facilities = Array.isArray(result)
      ? result
      : Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.items)
          ? result.items
          : [];

    filterFacility.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "ALL";
    allOption.textContent = "Tất cả cơ sở";

    filterFacility.appendChild(allOption);

    facilities.forEach((facility) => {
      const id = facility.co_so_id ?? facility.id;
      const name = facility.ten_co_so;

      if (id == null || !name) return;

      const option = document.createElement("option");

      option.value = String(id);
      option.textContent = name;

      filterFacility.appendChild(option);
    });
  } catch (error) {
    console.error(
      "Lỗi tải danh sách cơ sở:",
      error
    );
  }
}

async function loadVaccines() {
  try {
    const data = await fetchJson(
      `${API_BASE_URL}/stats/vaccines`
    );

    filterVaccine.innerHTML =
      `<option value="ALL">Tất cả vaccine</option>`;

    data.forEach((item) => {
      if (!item.ten_vaccine) return;

      const option = document.createElement("option");

      option.value = item.ten_vaccine;
      option.textContent = item.ten_vaccine;

      filterVaccine.appendChild(option);
    });
  } catch (err) {
    console.error("Lỗi load vaccine:", err);
  }
}

async function loadVaccineStats(query) {
  try {
    const data = await fetchJson(
      `${API_BASE_URL}/stats/vaccine-report?${query}`
    );

    vaccineRows = data.vaccineStats || [];
    stockRows = data.stockStats || [];

    totalSchedules.textContent = formatNumber(
      data.overview?.totalSchedules
    );

    pendingSchedules.textContent = formatNumber(
      data.overview?.pendingSchedules
    );

    totalDosesInjected.textContent = formatNumber(
      data.overview?.totalDosesInjected
    );

    totalStockDoses.textContent = formatNumber(
      data.overview?.totalStockDoses
    );

    renderVaccineTable();
    renderVaccineCharts();

    return true;
  } catch (err) {
    console.error(
      "Lỗi load thống kê vaccine:",
      err
    );

    vaccineRows = [];
    stockRows = [];

    totalSchedules.textContent = "0";
    pendingSchedules.textContent = "0";
    totalDosesInjected.textContent = "0";
    totalStockDoses.textContent = "0";

    renderEmptyVaccine();
    renderVaccineCharts();

    return false;
  }
}

async function loadRevenueStats(query) {
  try {
    const data = await fetchJson(
      `${API_BASE_URL}/stats/revenue-report?${query}`
    );
    revenueRows = data.items || [];

    totalRevenue.textContent = formatMoney(
      data.overview?.totalRevenue
    );

    paidRevenue.textContent = formatMoney(
      data.overview?.netRevenue
    );

    refundRevenue.textContent = formatMoney(
      data.overview?.refundRevenue
    );

    totalTransactions.textContent = formatNumber(
      data.overview?.totalTransactions
    );

    renderRevenueTable();
    renderRevenueCharts(data);

    return true;
  } catch (err) {
    console.error(
      "Lỗi load thống kê doanh thu:",
      err
    );

    revenueRows = [];

    totalRevenue.textContent = formatMoney(0);
    paidRevenue.textContent = formatMoney(0);
    refundRevenue.textContent = formatMoney(0);
    totalTransactions.textContent = "0";

    renderEmptyRevenue();
    renderRevenueCharts({
      paymentMethod: {}
    });

    return false;
  }
}

function renderVaccineTable() {
  const rows = getCombinedVaccineRows();

  if (!rows.length) {
    renderEmptyVaccine();
    return;
  }

  tblVaccineReport.innerHTML = rows.map((item, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>

      <td>${escapeHtml(item.ten_vaccine)}</td>

      <td class="text-center">
        ${formatNumber(item.so_mui_da_tiem)}
      </td>

      <td class="text-center">
        ${formatNumber(item.so_lich_cho_tiem)}
      </td>

      <td class="text-center">
        ${formatNumber(item.so_lich_da_huy)}
      </td>

      <td class="text-center">
        ${formatNumber(item.tong_lich)}
      </td>

      <td class="text-center">
        ${formatNumber(item.so_lieu_con)}
      </td>

      <td class="text-center">
        ${renderStockStatus(
    item.so_lieu_kha_dung ?? item.so_lieu_con
  )}
      </td>
    </tr>
  `).join("");
}

function renderStockStatus(stock) {
  const num = Number(stock || 0);

  if (num <= 0) {
    return `<span class="status-pill status-empty">Không khả dụng</span>`;
  }

  if (num <= 20) {
    return `<span class="status-pill status-low">Sắp hết</span>`;
  }

  return `<span class="status-pill status-ok">Còn hàng</span>`;
}


function renderEmptyVaccine() {
  tblVaccineReport.innerHTML = `
    <tr>
      <td colspan="8" class="text-center">
        Chưa có dữ liệu vaccine
      </td>
    </tr>
  `;
}

const timeLabels = {
  day: "Ngày",
  month: "Tháng",
  year: "Năm"
};

function updateRevenueTimeHeader() {
  if (revenueTimeHeader) {
    revenueTimeHeader.textContent =
      timeLabels[reportType.value] || "Ngày";
  }
}

function getSortedRevenueRows() {
  return [...revenueRows].sort((a, b) => {
    return String(b.thoi_gian || "").localeCompare(
      String(a.thoi_gian || "")
    );
  });
}

function renderRevenueTable() {
  updateRevenueTimeHeader();

  if (!revenueRows.length) {
    renderEmptyRevenue();
    return;
  }

  const sortedRows = getSortedRevenueRows();

  tblRevenueReport.innerHTML = sortedRows.map((item) => `
    <tr>
      <td class="text-center">
        ${escapeHtml(formatRevenueDate(item.thoi_gian))}
      </td>

      <td>
        ${escapeHtml(item.vaccine || "Không rõ")}
      </td>

      <td class="text-center">
        ${formatNumber(item.so_giao_dich)}
      </td>

      <td class="text-center">
        ${formatMoney(item.vnpay)}
      </td>

      <td class="text-center">
        ${formatMoney(item.tien_mat)}
      </td>

      <td class="text-center money">
        ${formatMoney(item.doanh_thu)}
      </td>
    </tr>
  `).join("");
}

function renderEmptyRevenue() {
  tblRevenueReport.innerHTML = `
    <tr>
      <td colspan="6" class="text-center">
        Chưa có dữ liệu doanh thu
      </td>
    </tr>
  `;
}

function destroyChart(chart) {
  if (chart) {
    chart.destroy();
  }
}

function renderVaccineCharts() {
  destroyChart(chartInjectedByVaccine);
  destroyChart(chartStockByVaccine);

  const vaccineLabels = vaccineRows.map(
    (item) => item.ten_vaccine || ""
  );

  const injectedData = vaccineRows.map(
    (item) => Number(item.so_mui_da_tiem || 0)
  );

  chartInjectedByVaccine = new Chart(
    document.getElementById("chartInjectedByVaccine"),
    {
      type: "bar",

      data: {
        labels: vaccineLabels,

        datasets: [{
          label: "Số mũi đã tiêm",
          data: injectedData,
          backgroundColor: "#0288d1",
          maxBarThickness: 55,
          barThickness:
            vaccineLabels.length === 1 ? 45 : undefined
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            labels: {
              boxWidth: 12,
              font: {
                size: window.innerWidth <= 700 ? 10 : 12
              }
            }
          }
        },

        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit:
                window.innerWidth <= 700 ? 4 : 10,
              font: {
                size: window.innerWidth <= 700 ? 9 : 12
              }
            }
          },

          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: {
                size: window.innerWidth <= 700 ? 9 : 12
              }
            }
          }
        }
      }
    }
  );

  const stockLabels = stockRows.map(
    (item) => item.ten_vaccine || ""
  );

  const stockData = stockRows.map(
    (item) => Number(item.so_lieu_con || 0)
  );

  chartStockByVaccine = new Chart(
    document.getElementById("chartStockByVaccine"),
    {
      type: "bar",

      data: {
        labels: stockLabels,

        datasets: [{
          label: "Tồn kho",
          data: stockData,
          backgroundColor: "#43a047",
          maxBarThickness: 55,
          barThickness:
            stockLabels.length === 1 ? 45 : undefined
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    }
  );
}

function renderRevenueCharts(data) {
  destroyChart(chartRevenueByTime);
  destroyChart(chartRevenueByMethod);

  const revenueMap = {};

  revenueRows.forEach((item) => {
    const time = item.thoi_gian || "Không rõ";

    revenueMap[time] =
      (revenueMap[time] || 0) +
      Number(item.doanh_thu || 0);
  });

  const sortedTimes = Object.keys(revenueMap).sort(
    (a, b) => String(a).localeCompare(String(b))
  );

  chartRevenueByTime = new Chart(
    document.getElementById("chartRevenueByTime"),
    {
      type: "line",

      data: {
        labels: sortedTimes.map(formatRevenueDate),

        datasets: [{
          label: "Doanh thu",

          data: sortedTimes.map(
            (time) => revenueMap[time]
          ),

          borderColor: "#0288d1",
          backgroundColor: "rgba(2,136,209,0.15)",
          tension: 0.3,
          fill: true
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    }
  );

  const method = data.paymentMethod || {};

  chartRevenueByMethod = new Chart(
    document.getElementById("chartRevenueByMethod"),
    {
      type: "doughnut",

      data: {
        labels: ["VNPAY", "Tiền mặt"],

        datasets: [{
          data: [
            Number(method.VNPAY || 0),
            Number(method.TIEN_MAT || 0)
          ],

          backgroundColor: [
            "#0288d1",
            "#43a047"
          ]
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    }
  );
}

async function loadReport() {
  if (isLoadingReport) return;
  if (!validateFilters()) return;

  const query = buildQueryParams();

  isLoadingReport = true;
  reportLoadedSuccessfully = false;

  btnReloadAll.disabled = true;
  btnResetFilters.disabled = true;
  btnRefreshData.disabled = true;

  updateExportButtons();

  if (reportMessage) {
    reportMessage.textContent = "";
  }

  try {
    const results = await Promise.all([
      loadVaccineStats(query),
      loadRevenueStats(query)
    ]);

    const allSucceeded = results.every(
      (result) => result === true
    );

    if (allSucceeded) {
      appliedFilterSnapshot = query;
      reportLoadedSuccessfully = true;
    } else {
      appliedFilterSnapshot = "";
      reportLoadedSuccessfully = false;

      if (reportMessage) {
        reportMessage.textContent =
          "Không thể tải đầy đủ số liệu. Vui lòng kiểm tra kết nối và thử lại.";
      }
    }
  } catch (err) {
    console.error("Lỗi tải báo cáo:", err);

    appliedFilterSnapshot = "";
    reportLoadedSuccessfully = false;

    if (reportMessage) {
      reportMessage.textContent =
        "Có lỗi khi tải báo cáo. Vui lòng thử lại.";
    }
  } finally {
    isLoadingReport = false;

    btnReloadAll.disabled = false;
    btnResetFilters.disabled = false;
    btnRefreshData.disabled = false;

    updateExportButtons();
  }
}

function exportCsv(filename, rows) {
  const csv = rows.map((row) =>
    row.map((cell) =>
      `"${safeText(cell).replace(/"/g, '""')}"`
    ).join(",")
  ).join("\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    {
      type: "text/csv;charset=utf-8;"
    }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function exportVaccineReport() {
  if (!isCurrentFilterApplied()) {
    alert("Vui lòng áp dụng bộ lọc trước khi xuất báo cáo!");
    return;
  }

  const startDate = convertPeriodToDate(
    fromDate.value,
    reportType.value,
    false
  );

  const endDate = convertPeriodToDate(
    toDate.value,
    reportType.value,
    true
  );

  const rows = [
    ["BÁO CÁO VACCINE"],

    ["Từ ngày", startDate],
    ["Đến ngày", endDate],

    [
      "Cơ sở",
      filterFacility.selectedOptions[0]?.textContent ||
      "Tất cả cơ sở"
    ],

    [],

    [
      "STT",
      "Vaccine",
      "Số mũi đã tiêm",
      "Số lịch chờ tiêm",
      "Số lịch đã hủy",
      "Tổng lịch",
      "Tồn kho cuối kỳ",
      "Trạng thái kho"
    ]
  ];

  getCombinedVaccineRows().forEach((item, index) => {
    const stock = Number(
      item.so_lieu_kha_dung ?? item.so_lieu_con ?? 0
    );

    const status = stock <= 0
      ? "Không khả dụng"
      : stock <= 20
        ? "Sắp hết"
        : "Còn hàng";
    rows.push([
      index + 1,
      item.ten_vaccine,
      item.so_mui_da_tiem ?? 0,
      item.so_lich_cho_tiem ?? 0,
      item.so_lich_da_huy ?? 0,
      item.tong_lich ?? 0,
      item.so_lieu_con ?? 0,
      status
    ]);
  });

  exportCsv(
    `bao-cao-vaccine_${startDate}_${endDate}.csv`,
    rows
  );
}

function exportRevenueReport() {
  if (!isCurrentFilterApplied()) {
    alert("Vui lòng áp dụng bộ lọc trước khi xuất báo cáo!");
    return;
  }

  const startDate = convertPeriodToDate(
    fromDate.value,
    reportType.value,
    false
  );

  const endDate = convertPeriodToDate(
    toDate.value,
    reportType.value,
    true
  );

  const rows = [
    ["BÁO CÁO DOANH THU"],

    ["Từ ngày", startDate],
    ["Đến ngày", endDate],

    [
      "Cơ sở",
      filterFacility.selectedOptions[0]?.textContent ||
      "Tất cả cơ sở"
    ],

    [],

    [
      timeLabels[reportType.value] || "Ngày",
      "Vaccine",
      "Số giao dịch",
      "VNPAY",
      "Tiền mặt",
      "Doanh thu"
    ]
  ];

  getSortedRevenueRows().forEach((item) => {
    rows.push([
      formatRevenueDate(item.thoi_gian),
      item.vaccine || "Không rõ",
      item.so_giao_dich ?? 0,
      item.vnpay ?? 0,
      item.tien_mat ?? 0,
      item.doanh_thu ?? 0
    ]);
  });

  exportCsv(
    `bao-cao-doanh-thu_${startDate}_${endDate}.csv`,
    rows
  );
}

btnReloadAll.addEventListener(
  "click",
  loadReport
);

btnResetFilters.addEventListener(
  "click",
  resetReportFilters
);

btnRefreshData.addEventListener(
  "click",
  loadReport
);

btnExportVaccineReport.addEventListener(
  "click",
  exportVaccineReport
);

btnExportRevenueReport.addEventListener(
  "click",
  exportRevenueReport
);

reportType.addEventListener("change", () => {
  syncDatesByReportType();
  updateRevenueTimeHeader();
  markFiltersChanged();
});

fromDate.addEventListener(
  "input",
  markFiltersChanged
);

toDate.addEventListener(
  "input",
  markFiltersChanged
);

fromDate.addEventListener(
  "change",
  markFiltersChanged
);

toDate.addEventListener(
  "change",
  markFiltersChanged
);

filterVaccine.addEventListener(
  "change",
  markFiltersChanged
);

filterPaymentMethod.addEventListener(
  "change",
  markFiltersChanged
);

filterFacility.addEventListener(
  "change",
  markFiltersChanged
);

setDefaultFilters();
updateRevenueTimeHeader();
updateExportButtons();

Promise.all([
  loadFacilities(),
  loadVaccines()
]).then(() => {
  loadReport();
});
