const API_BASE_URL = "http://localhost:3000/api";
const user = JSON.parse(localStorage.getItem("user"));

const stars = document.querySelectorAll(".star");
const txtReview = document.getElementById("reviewText");
const btnSubmitReview = document.getElementById("btnSubmitReview");
const reviewErrorEl = document.getElementById("reviewError");
const reviewForm = document.getElementById("reviewForm");

const avgScoreEl = document.getElementById("avgRating");
const totalReviewEl = document.getElementById("reviewCount");
const reviewListEl = document.getElementById("reviewList");

const branchName = document.getElementById("branchName");
const branchAddress = document.getElementById("branchAddress");
const branchHotline = document.getElementById("branchHotline");
const branchHours = document.getElementById("branchHours");
const branchDescription = document.getElementById("branchDescription");
const branchMap = document.getElementById("branchMap");
const branchIndicator = document.getElementById("branchIndicator");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const userBox = document.getElementById("userBox");

const camNangToggle = document.getElementById("camNangToggle");
const camNangMenu = document.getElementById("camNangMenu");
const camNangDropdown = document.getElementById("camNangDropdown");

let selectedStars = 0;
let currentIndex = 0;
let branches = [];

if (reviewForm) {
    const token = localStorage.getItem("token");
    const vaiTro = user?.vai_tro;

    if (user && token && vaiTro === "KHACH_HANG") {
        reviewForm.style.display = "block";
    } else {
        reviewForm.style.display = "none";
    }
}
function getHeaders(includeJson = false) {
    const token = localStorage.getItem("token");

    const headers = {};

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

function getBranchIndexFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));

    const foundIndex = branches.findIndex((branch) => Number(branch.id) === id);

    return foundIndex >= 0 ? foundIndex : 0;
}

function getCurrentCoSoId() {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("id"));
}

function updateUrlByBranchId(id) {
    const newUrl = `${window.location.pathname}?id=${id}`;
    window.history.replaceState({}, "", newUrl);
}

function renderStarSelection(value) {
    stars.forEach((star) => {
        const starValue = Number(star.getAttribute("data-value"));

        if (starValue <= value) {
            star.classList.add("active");
        } else {
            star.classList.remove("active");
        }
    });
}

function renderReviewList(list = []) {
    if (!reviewListEl) return;

    if (!Array.isArray(list) || list.length === 0) {
        reviewListEl.innerHTML =
            `<div class="empty-review">Chưa có đánh giá nào</div>`;
        return;
    }

    reviewListEl.innerHTML = list.map((item) => {
        const soSao = Number(item.so_sao || 0);

        return `
            <div class="review-item">
                <div class="review-top">
                    <div>
                        <div class="review-user">
                            ${item.ten_nguoi_dung || "Người dùng"}
                        </div>

                        <div class="review-date">
                            ${formatReviewDate(item.created_at)}
                        </div>
                    </div>

                    <div class="review-stars">
                        ${"★".repeat(soSao)}${"☆".repeat(5 - soSao)}
                    </div>
                </div>

                <div class="review-content">
                    ${item.nhan_xet || ""}
                </div>
            </div>
        `;
    }).join("");
}

function formatReviewDate(dateString) {
    if (!dateString) return "";

    const [date, time] = dateString.split(" ");
    if (!date || !time) return dateString;

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year} lúc ${time.slice(0, 5)}`;
}

/* ============================
   VALIDATE FORM ĐÁNH GIÁ
============================ */
function showReviewError(message) {
    if (reviewErrorEl) {
        reviewErrorEl.textContent = message || "";
    }
}

function clearReviewError() {
    if (reviewErrorEl) {
        reviewErrorEl.textContent = "";
    }
}

function validateStars() {
    if (selectedStars < 1 || selectedStars > 5) {
        showReviewError("Vui lòng chọn số sao.");
        return false;
    }

    clearReviewError();
    return true;
}

function validateReviewText() {
    const value = txtReview?.value.trim() || "";

    if (value.length > 150) {
        showReviewError("Nhận xét không được vượt quá 150 ký tự.");
        return false;
    }

    clearReviewError();
    return true;
}

function validateReviewForm() {
    if (!validateStars()) return false;
    if (!validateReviewText()) return false;

    clearReviewError();
    return true;
}

/* ============================
   LOAD CƠ SỞ TỪ DATABASE
============================ */
async function loadBranchesFromDatabase() {
    try {
        const res = await fetch(`${API_BASE_URL}/coso`);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Không tải được danh sách cơ sở");
        }

        branches = Array.isArray(data) ? data : [];

        if (branches.length === 0) {
            alert("Chưa có cơ sở nào");
            return;
        }

        currentIndex = getBranchIndexFromUrl();
        renderBranch();

    } catch (err) {
        console.error("Lỗi load cơ sở:", err);
        alert("Không tải được thông tin cơ sở");
    }
}

/* ============================
   HIỂN THỊ CƠ SỞ
============================ */
function renderBranch() {
    const branch = branches[currentIndex];

    if (!branch) return;

    if (branchName) {
        branchName.textContent = branch.ten_co_so || "";
    }

    if (branchAddress) {
        branchAddress.textContent = branch.dia_chi || "";
    }

    if (branchHotline) {
        branchHotline.textContent =
            branch.so_dien_thoai || "Đang cập nhật";
    }

    if (branchHours) {
        branchHours.textContent =
            branch.gio_mo && branch.gio_dong
                ? `${branch.gio_mo.slice(0, 5)} - ${branch.gio_dong.slice(0, 5)}`
                : "Đang cập nhật";
    }

    if (branchDescription) {
        branchDescription.textContent = branch.mo_ta || "";
    }
    if (branchMap) {
        if (branch.ma_nhung_ban_do) {
            branchMap.innerHTML = branch.ma_nhung_ban_do;
        } else {
            branchMap.innerHTML = `<p>Chưa có bản đồ</p>`;
        }
    }

    if (branchIndicator) {
        branchIndicator.textContent =
            `Cơ sở ${currentIndex + 1} / ${branches.length}`;
    }

    updateUrlByBranchId(branch.id);

    selectedStars = 0;
    renderStarSelection(0);
    clearReviewError();
    loadReviews();
}

/* ============================
   LOAD ĐÁNH GIÁ
============================ */
async function loadReviews() {
    const coSoId = getCurrentCoSoId();

    if (!Number.isInteger(coSoId) || coSoId <= 0) {
        if (avgScoreEl) avgScoreEl.textContent = "0";
        if (totalReviewEl) totalReviewEl.textContent = "0";
        renderReviewList([]);
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/danhgia/coso/${coSoId}`);
        const text = await res.text();
        let data;

        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error("Response không phải JSON:", text);
            throw new Error("API đánh giá không trả về JSON hợp lệ");
        }

        if (!res.ok) {
            throw new Error(data.message || "Không tải được đánh giá");
        }

        if (avgScoreEl) {
            avgScoreEl.textContent =
                data.summary?.diem_trung_binh ?? 0;
        }

        if (totalReviewEl) {
            totalReviewEl.textContent =
                data.summary?.tong_danh_gia ?? 0;
        }

        renderReviewList(data.reviews || []);

    } catch (err) {
        console.error("Lỗi load đánh giá:", err);

        if (avgScoreEl) avgScoreEl.textContent = "0";
        if (totalReviewEl) totalReviewEl.textContent = "0";

        if (reviewListEl) {
            reviewListEl.innerHTML =
                `<div class="empty-review">Không tải được đánh giá</div>`;
        }
    }
}

/* ============================
   GỬI ĐÁNH GIÁ
============================ */
async function submitReview() {
    const token = localStorage.getItem("token");
    const vaiTro = user?.vai_tro;

    if (!user || !token) {
        alert("Bạn cần đăng nhập để đánh giá");
        return;
    }

    if (vaiTro !== "KHACH_HANG") {
        alert("Chỉ khách hàng mới được đánh giá cơ sở");
        return;
    }

    const coSoId = getCurrentCoSoId();

    if (!Number.isInteger(coSoId) || coSoId <= 0) {
        alert("Không xác định được cơ sở");
        return;
    }

    if (!validateReviewForm()) {
        return;
    }

    const body = {
        co_so_id: coSoId,
        so_sao: selectedStars,
        nhan_xet: txtReview?.value.trim() || ""
    };

    try {
        const res = await fetch(`${API_BASE_URL}/danhgia`, {
            method: "POST",
            headers: getHeaders(true),
            body: JSON.stringify(body)
        });
        if (await checkAuthResponse(res)) {
            return;
        }

        const text = await res.text();
        let data;

        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error("Response không phải JSON:", text);
            throw new Error("API đánh giá không trả về JSON hợp lệ");
        }

        if (!res.ok) {
            throw new Error(data.message || "Gửi đánh giá thất bại");
        }

        clearReviewError();
        alert(data.message || "Gửi đánh giá thành công");

        if (txtReview) txtReview.value = "";

        selectedStars = 0;
        renderStarSelection(0);

        await loadReviews();

    } catch (err) {
        console.error("Lỗi gửi đánh giá:", err);
        alert(err.message || "Lỗi gửi đánh giá");
    }
}

/* ============================
   EVENT
============================ */
prevBtn?.addEventListener("click", () => {
    if (branches.length === 0) return;

    currentIndex =
        (currentIndex - 1 + branches.length) % branches.length;

    renderBranch();
});

nextBtn?.addEventListener("click", () => {
    if (branches.length === 0) return;

    currentIndex =
        (currentIndex + 1) % branches.length;

    renderBranch();
});

stars.forEach((star) => {
    star.addEventListener("click", () => {
        selectedStars =
            Number(star.getAttribute("data-value"));

        renderStarSelection(selectedStars);
        validateStars();
    });
});

if (txtReview) {
    txtReview.addEventListener("input", () => {
        validateReviewText();

        const value = txtReview.value.trim();

        if (
            value.length <= 150 &&
            selectedStars >= 1 &&
            selectedStars <= 5
        ) {
            clearReviewError();
        }
    });

    txtReview.addEventListener("blur", validateReviewText);
}

if (btnSubmitReview) {
    btnSubmitReview.addEventListener("click", submitReview);
}

if (camNangToggle && camNangMenu && camNangDropdown) {
    camNangToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        camNangMenu.classList.toggle("show");
        camNangDropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
        if (!camNangDropdown.contains(e.target)) {
            camNangMenu.classList.remove("show");
            camNangDropdown.classList.remove("active");
        }
    });
}

if (userBox) {
    userBox.addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });
}

/* ============================
   INIT
============================ */
loadBranchesFromDatabase();