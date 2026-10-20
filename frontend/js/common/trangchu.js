
/* ==========================================
   HOME.JS - TRANG CHỦ VAX AI
   Header được xử lý riêng trong header.js
========================================== */

const API_BASE_URL = "http://localhost:3000/api";
const SERVER_URL = "http://localhost:3000";

const DEFAULT_BRANCH_IMAGE = "../img/co-so1.jpg";

/* ==========================================
   1. THÔNG TIN NGƯỜI DÙNG VÀ ĐẶT LỊCH
========================================== */

let user = null;

try {
    user = JSON.parse(localStorage.getItem("user"));
} catch (error) {
    console.error("Dữ liệu người dùng không hợp lệ:", error);
}

const btnDatLich = document.getElementById("btnDatLich");
const welcomeText = document.getElementById("welcomeText");

if (user) {
    if (welcomeText) {
        if (user.vai_tro === "KHACH_HANG") {
            welcomeText.textContent =
                "Xin chào, " + user.ten_dang_nhap +
                " • Bạn có thể đặt lịch tiêm ngay!";

        } else if (user.vai_tro === "NHAN_VIEN_Y_TE") {
            welcomeText.textContent =
                "Xin chào, " + user.ten_dang_nhap +
                " • Nhân viên y tế";

        } else if (user.vai_tro === "ADMIN") {
            welcomeText.textContent =
                "Xin chào, " + user.ten_dang_nhap +
                " • Quản trị viên";
        }
    }

    if (btnDatLich) {
        btnDatLich.onclick = () => {
            if (user.vai_tro === "KHACH_HANG") {
                window.location.href =
                    "dashboard.html?page=datlich";
            } else {
                alert(
                    "Chức năng đặt lịch chỉ dành cho khách hàng."
                );
            }
        };
    }

} else {
    if (welcomeText) {
        welcomeText.textContent =
            "Bạn cần đăng nhập để đặt lịch tiêm.";
    }

    if (btnDatLich) {
        btnDatLich.onclick = () => {
            window.location.href = "dangnhap.html";
        };
    }
}

/* ==========================================
   2. QUẢN LÝ DANH SÁCH CƠ SỞ TRANG CHỦ
========================================== */

let allBranches = [];
let filteredBranches = [];
let currentBranchIndex = 0;

const BRANCHES_PER_PAGE = 3;

const branchSearchInput =
    document.getElementById("branchSearchInput");

const branchSearchClear =
    document.getElementById("branchSearchClear");

const branchSearchMessage =
    document.getElementById("branchSearchMessage");

const branchGrid =
    document.getElementById("branchGrid");

const branchNext =
    document.getElementById("branchNext");

const branchPrev =
    document.getElementById("branchPrev");

/* ==========================================
   3. XỬ LÝ ĐƯỜNG DẪN ẢNH CƠ SỞ
========================================== */

function getBranchImageSrc(hinhAnh) {
    if (!hinhAnh || !String(hinhAnh).trim()) {
        return DEFAULT_BRANCH_IMAGE;
    }

    const imagePath = String(hinhAnh)
        .trim()
        .replace(/\\/g, "/");

    if (/^https?:\/\//i.test(imagePath)) {
        return imagePath;
    }

    const cleanPath = imagePath.replace(/^\/+/, "");

    return `${SERVER_URL}/${cleanPath}`;
}

/* ==========================================
   4. CHUẨN HÓA TỪ KHÓA TÌM KIẾM
========================================== */

function normalizeBranchText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();
}

/* ==========================================
   5. TÌM KIẾM CƠ SỞ
========================================== */

function searchBranches() {
    const keyword = normalizeBranchText(
        branchSearchInput ? branchSearchInput.value : ""
    );

    filteredBranches = allBranches.filter(item => {
        const name = normalizeBranchText(item.ten_co_so);
        const address = normalizeBranchText(item.dia_chi);

        return (
            name.includes(keyword) ||
            address.includes(keyword)
        );
    });

    currentBranchIndex = 0;

    if (branchSearchClear) {
        branchSearchClear.style.display =
            keyword ? "block" : "none";
    }

    if (branchSearchMessage) {
        if (keyword && filteredBranches.length === 0) {
            branchSearchMessage.textContent =
                "Không tìm thấy cơ sở tiêm phù hợp.";

            branchSearchMessage.style.display = "block";

        } else if (keyword) {
            branchSearchMessage.textContent =
                `Tìm thấy ${filteredBranches.length} cơ sở phù hợp.`;

            branchSearchMessage.style.display = "block";

        } else {
            branchSearchMessage.textContent = "";
            branchSearchMessage.style.display = "none";
        }
    }

    renderBranchSlider();
}

/* ==========================================
   6. SỰ KIỆN TÌM KIẾM CƠ SỞ
========================================== */

if (branchSearchInput) {
    branchSearchInput.addEventListener(
        "input",
        searchBranches
    );
}

if (branchSearchClear) {
    branchSearchClear.addEventListener("click", () => {
        if (branchSearchInput) {
            branchSearchInput.value = "";
            branchSearchInput.focus();
        }

        searchBranches();
    });
}

/* ==========================================
   7. TẢI CƠ SỞ TỪ BACKEND
========================================== */

async function loadBranchesHome() {
    if (!branchGrid) return;

    try {
        const res = await fetch(`${API_BASE_URL}/coso`);

        if (!res.ok) {
            throw new Error("Không tải được danh sách cơ sở");
        }

        const data = await res.json();

        allBranches = Array.isArray(data) ? data : [];

        allBranches.sort(
            (a, b) => Number(a.id) - Number(b.id)
        );

        filteredBranches = [...allBranches];
        currentBranchIndex = 0;

        if (allBranches.length === 0) {
            branchGrid.innerHTML = `
                <p style="
                    grid-column: 1 / -1;
                    text-align: center;
                    color: #64748b;
                ">
                    Chưa có cơ sở nào.
                </p>
            `;

            updateBranchButtons();
            return;
        }

        if (branchSearchInput) {
            searchBranches();
        } else {
            renderBranchSlider();
        }

    } catch (error) {
        console.error(
            "Lỗi load cơ sở trang chủ:",
            error
        );

        branchGrid.innerHTML = `
            <p style="
                grid-column: 1 / -1;
                text-align: center;
                color: #ef4444;
            ">
                Không tải được danh sách cơ sở.
            </p>
        `;

        updateBranchButtons();
    }
}

/* ==========================================
   8. HIỂN THỊ SLIDER CƠ SỞ
========================================== */

function renderBranchSlider() {
    if (!branchGrid) return;

    const visibleBranches = filteredBranches.slice(
        currentBranchIndex,
        currentBranchIndex + BRANCHES_PER_PAGE
    );

    if (filteredBranches.length === 0) {
        branchGrid.innerHTML = `
            <p style="
                grid-column: 1 / -1;
                text-align: center;
                color: #64748b;
            ">
                Không tìm thấy cơ sở tiêm phù hợp.
            </p>
        `;

        updateBranchButtons();
        return;
    }

    branchGrid.innerHTML = visibleBranches.map(item => {
        const imgSrc = getBranchImageSrc(item.hinh_anh);

        return `
            <div class="branch-card">

                <div class="branch-img">
                    <img
                        src="${escapeHomeHTML(imgSrc)}"
                        alt="${escapeHomeHTML(item.ten_co_so || "Cơ sở tiêm")}"
                        onerror="this.onerror=null;this.src='${DEFAULT_BRANCH_IMAGE}'"
                    >
                </div>

                <h3>
                    ${escapeHomeHTML(item.ten_co_so || "")}
                </h3>

                <div class="branch-info">
                    <i class="fa-solid fa-location-dot"></i>

                    <span>
                        <strong>Địa chỉ:</strong>
                        ${escapeHomeHTML(item.dia_chi || "")}
                    </span>
                </div>

                <div class="branch-info">
                    <i class="fa-solid fa-phone"></i>

                    <span>
                        <strong>Hotline:</strong>
                        ${escapeHomeHTML(item.so_dien_thoai || "Đang cập nhật")}
                    </span>
                </div>

                <div class="branch-info">
                    <i class="fa-regular fa-clock"></i>

                    <span>
                        <strong>Giờ làm việc:</strong>
                        ${item.gio_mo && item.gio_dong
                ? `${escapeHomeHTML(String(item.gio_mo).slice(0, 5))} - ${escapeHomeHTML(String(item.gio_dong).slice(0, 5))}`
                : "Đang cập nhật"
            }
                    </span>
                </div>

                <div class="branch-info">
                    <i class="fa-solid fa-circle-info"></i>

                    <span>
                        <strong>Trạng thái:</strong>
                        ${item.trang_thai === "HOAT_DONG"
                ? "Hoạt động"
                : "Tạm dừng"
            }
                    </span>
                </div>

                <a
                    class="direction-btn"
                    href="chi-tiet-coso.html?id=${encodeURIComponent(item.id)}"
                >
                    <i class="fa-solid fa-location-arrow"></i>
                    Xem chi tiết
                </a>

            </div>
        `;
    }).join("");

    updateBranchButtons();
}

/* ==========================================
   9. CẬP NHẬT NÚT SLIDER
========================================== */

function updateBranchButtons() {
    const isFirst = currentBranchIndex === 0;

    const isLast =
        currentBranchIndex >=
        filteredBranches.length - BRANCHES_PER_PAGE;

    if (branchPrev) {
        branchPrev.disabled = isFirst;
        branchPrev.style.opacity =
            isFirst ? "0.4" : "1";

        branchPrev.style.cursor =
            isFirst ? "not-allowed" : "pointer";
    }

    if (branchNext) {
        branchNext.disabled = isLast;
        branchNext.style.opacity =
            isLast ? "0.4" : "1";

        branchNext.style.cursor =
            isLast ? "not-allowed" : "pointer";
    }
}

/* ==========================================
   10. CHUYỂN SLIDER CƠ SỞ
========================================== */

if (branchNext) {
    branchNext.addEventListener("click", () => {
        if (
            currentBranchIndex <
            filteredBranches.length - BRANCHES_PER_PAGE
        ) {
            currentBranchIndex++;
            renderBranchSlider();
        }
    });
}

if (branchPrev) {
    branchPrev.addEventListener("click", () => {
        if (currentBranchIndex > 0) {
            currentBranchIndex--;
            renderBranchSlider();
        }
    });
}

/* ==========================================
   11. CHỐNG LỖI HIỂN THỊ HTML
========================================== */

function escapeHomeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ==========================================
   12. XỬ LÝ ẢNH VACCINE
   ẢNH ĐƯỢC LẤY TỪ BACKEND
========================================== */

function getHomeVaccineImage(hinhAnh) {
    if (!hinhAnh || !String(hinhAnh).trim()) {
        return "";
    }

    const imagePath = String(hinhAnh)
        .trim()
        .replace(/\\/g, "/");

    if (/^https?:\/\//i.test(imagePath)) {
        return imagePath;
    }

    const cleanPath = imagePath.replace(/^\/+/, "");

    return `${SERVER_URL}/${cleanPath}`;
}

/* ==========================================
   13. HIỂN THỊ DANH SÁCH VACCINE
========================================== */

const vaccineGrid =
    document.getElementById("vaccineGrid");

function renderHomeVaccines(vaccines) {
    if (!vaccineGrid) return;

    if (vaccines.length === 0) {
        vaccineGrid.innerHTML = `
            <p style="
                grid-column: 1 / -1;
                text-align: center;
                color: #64748b;
            ">
                Chưa có vaccine để hiển thị.
            </p>
        `;
        return;
    }

    vaccineGrid.innerHTML = vaccines.map(vaccine => {
        const id = Number(vaccine.id);

        const image = escapeHomeHTML(
            getHomeVaccineImage(vaccine.hinh_anh)
        );

        const name = escapeHomeHTML(
            vaccine.ten_vaccine || "Vaccine"
        );

        const country = escapeHomeHTML(
            vaccine.nuoc_sx || "Đang cập nhật"
        );

        const disease = escapeHomeHTML(
            vaccine.phong_benh || "Đang cập nhật"
        );

        const status =
            vaccine.trang_thai === "HET"
                ? "Hết hàng"
                : "Còn hàng";

        return `
            <div class="vaccine-card">

                <div class="vaccine-img">
                    ${image
                ? `
                            <img
                                src="${image}"
                                alt="${name}"
                                loading="lazy"
                                onerror="
                                    this.onerror=null;
                                    this.style.display='none';
                                    this.nextElementSibling.style.display='flex';
                                "
                            >

                            <span
                                class="vaccine-no-image"
                                style="display:none;"
                            >
                                Chưa có hình ảnh
                            </span>
                        `
                : `
                            <span class="vaccine-no-image">
                                Chưa có hình ảnh
                            </span>
                        `
            }
                </div>

                <div class="vaccine-info">

                    <h3>${name}</h3>

                    <p class="origin">
                        <i class="fa-solid fa-earth-asia"></i>
                        ${country}
                    </p>

                    <p>
                        <strong>Phòng bệnh:</strong>
                        ${disease}
                    </p>

                    <p>
                        <strong>Trạng thái:</strong>
                        ${status}
                    </p>

                    <a
                        href="chi-tiet-vaccine.html?id=${id}"
                        class="detail-btn"
                    >
                        Xem chi tiết
                        <i class="fa-solid fa-arrow-right"></i>
                    </a>

                </div>

            </div>
        `;
    }).join("");
}

/* ==========================================
   14. TẢI DANH SÁCH VACCINE TỪ BACKEND
========================================== */

async function loadVaccinesHome() {
    if (!vaccineGrid) return;

    vaccineGrid.innerHTML = `
        <p style="
            grid-column: 1 / -1;
            text-align: center;
            color: #64748b;
        ">
            Đang tải danh sách vaccine...
        </p>
    `;

    try {
        const response = await fetch(
            `${API_BASE_URL}/vaccine`
        );

        if (!response.ok) {
            throw new Error(
                "Không tải được danh sách vaccine."
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "Dữ liệu vaccine không hợp lệ."
            );
        }

        // Không hiển thị vaccine ngừng sử dụng
        const activeVaccines = data.filter(vaccine =>
            vaccine.trang_thai !== "NGUNG" &&
            Number.isInteger(Number(vaccine.id)) &&
            Number(vaccine.id) > 0
        );

        // Trang chủ hiển thị tối đa 4 vaccine
        renderHomeVaccines(
            activeVaccines.slice(0, 4)
        );

    } catch (error) {
        console.error(
            "Lỗi tải vaccine Trang chủ:",
            error
        );

        vaccineGrid.innerHTML = `
            <p style="
                grid-column: 1 / -1;
                text-align: center;
                color: #ef4444;
            ">
                Không thể tải danh sách vaccine.
            </p>
        `;
    }
}

/* ==========================================
   15. KHỞI TẠO DỮ LIỆU TRANG CHỦ
========================================== */

loadVaccinesHome();
loadBranchesHome();
