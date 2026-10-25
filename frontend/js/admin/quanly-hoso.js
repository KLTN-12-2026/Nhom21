const API_BASE_URL = "http://localhost:3000/api";

const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

if (!user || !token) {
  alert("Vui lòng đăng nhập để tiếp tục!");

  window.top.location.href = new URL(
    "../khach-hang/dangnhap.html",
    window.location.href
  ).href;

} else if (user.vai_tro !== "ADMIN") {
  alert("Bạn không có quyền truy cập trang này!");

  window.top.location.href = new URL(
    "../common/trangchu.html",
    window.location.href
  ).href;
}

const profileBody = document.getElementById("profileBody");
const keywordProfile = document.getElementById("keywordProfile");

const detailModal = document.getElementById("detailModal");
const detailModalTitle = document.getElementById("detailModalTitle");
const detailBody = document.getElementById("detailBody");

let profiles = [];



function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`
  };
}



function formatDate(value) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
}

function showValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Chưa cập nhật";
  }

  return value;
}




async function loadProfiles() {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: "GET",
      headers: getHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể tải danh sách hồ sơ");
    }

    profiles = Array.isArray(data) ? data : data.data || [];

    renderProfiles(profiles);
  } catch (error) {
    console.error("Lỗi load hồ sơ:", error);

    profileBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;color:#d32f2f;">
          Không thể tải danh sách hồ sơ
        </td>
      </tr>
    `;
  }
}




function renderProfiles(list) {
  profileBody.innerHTML = "";

  if (!list || list.length === 0) {
    profileBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;">
          Không có hồ sơ người dùng
        </td>
      </tr>
    `;
    return;
  }

  list.forEach((item, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td data-label="STT" style="text-align:center;">
        ${index + 1}
      </td>

      <td data-label="Tên đăng nhập">
        ${showValue(item.ten_dang_nhap)}
      </td>

      <td data-label="Họ tên">
        ${showValue(item.ho_ten)}
      </td>

      <td data-label="Ngày sinh" style="text-align:center;">
        ${formatDate(item.ngay_sinh)}
      </td>

      <td data-label="Giới tính" style="text-align:center;">
        ${showValue(item.gioi_tinh)}
      </td>

      <td data-label="SĐT" style="text-align:center;">
        ${showValue(item.so_dien_thoai)}
      </td>

      <td data-label="Địa chỉ">
        ${showValue(item.dia_chi)}
      </td>

      <td data-label="Thao tác">
        <div class="action-wrap">
          <button
            type="button"
            class="btn btn-outline"
            onclick="viewDetail(${item.id})"
          >
            <span class="material-symbols-rounded">visibility</span>
            <span>Xem hồ sơ</span>
          </button>
        </div>
      </td>
    `;

    profileBody.appendChild(row);
  });
}



/* =========================
   TÌM KIẾM
========================= */

function filterProfiles() {
  const keyword = keywordProfile.value.trim().toLowerCase();

  if (!keyword) {
    renderProfiles(profiles);
    return;
  }

  const filtered = profiles.filter(item => {
    const hoTen = String(item.ho_ten || "").toLowerCase();

    const soDienThoai = String(
      item.so_dien_thoai || ""
    ).toLowerCase();

    return (
      hoTen.includes(keyword) ||
      soDienThoai.includes(keyword)
    );
  });

  renderProfiles(filtered);
}

keywordProfile.addEventListener("input", filterProfiles);



async function viewDetail(nguoiDungId) {
  if (!nguoiDungId) {
    alert("Không xác định được người dùng!");
    return;
  }

  detailModal.classList.add("show");

  detailModalTitle.textContent = "Chi tiết hồ sơ tiêm chủng";

  detailBody.innerHTML = `
    <tr>
      <td colspan="8" class="empty-detail">
        Đang tải dữ liệu...
      </td>
    </tr>
  `;

  try {
    const response = await fetch(
      `${API_BASE_URL}/hoso/user/${nguoiDungId}`,
      {
        method: "GET",
        headers: getHeaders()
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Không thể tải hồ sơ tiêm chủng"
      );
    }

    const vaccines = Array.isArray(data)
      ? data
      : data.data || [];

    renderDetail(vaccines);
  } catch (error) {
    console.error("Lỗi xem hồ sơ:", error);

    detailBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-detail" style="color:#d32f2f;">
          Không thể tải hồ sơ tiêm chủng
        </td>
      </tr>
    `;
  }
}




function renderDetail(vaccines) {
  detailBody.innerHTML = "";

  if (!vaccines || vaccines.length === 0) {
    detailBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-detail">
          Người dùng chưa có lịch sử tiêm chủng
        </td>
      </tr>
    `;
    return;
  }

  vaccines.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td data-label="Người được tiêm">
        ${showValue(item.ho_ten)}
      </td>

      <td data-label="Mối quan hệ" style="text-align:center;">
        ${showValue(item.moi_quan_he)}
      </td>

      <td data-label="Ngày sinh" style="text-align:center;">
        ${formatDate(item.ngay_sinh)}
      </td>

      <td data-label="Giới tính" style="text-align:center;">
        ${showValue(item.gioi_tinh)}
      </td>

      <td data-label="Vaccine">
        ${showValue(item.ten_vaccine)}
      </td>

      <td data-label="Mũi số" style="text-align:center;">
        ${showValue(item.mui_so)}
      </td>

      <td data-label="Ngày tiêm" style="text-align:center;">
        ${formatDate(item.ngay_tiem)}
      </td>

      <td data-label="Cơ sở tiêm">
        ${showValue(item.ten_co_so)}
      </td>
    `;

    detailBody.appendChild(row);
  });
}




function closeDetail() {
  detailModal.classList.remove("show");

  detailBody.innerHTML = `
    <tr>
      <td colspan="8" class="empty-detail">
        Chưa có dữ liệu hồ sơ tiêm chủng
      </td>
    </tr>
  `;
}



window.addEventListener("click", event => {
  if (event.target === detailModal) {
    closeDetail();
  }
});



document.addEventListener("keydown", event => {
  if (
    event.key === "Escape" &&
    detailModal.classList.contains("show")
  ) {
    closeDetail();
  }
});



loadProfiles();
