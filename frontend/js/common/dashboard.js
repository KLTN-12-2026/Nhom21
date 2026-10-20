
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    alert("Bạn chưa đăng nhập!");
    window.location.href = "../khach-hang/dangnhap.html";
    throw new Error("Chưa đăng nhập");
}

// ==========================================
// 1. KIỂM TRA VAI TRÒ
// ==========================================

const VALID_ROLES = [
    "ADMIN",
    "NHAN_VIEN_Y_TE",
    "KHACH_HANG"
];

if (!VALID_ROLES.includes(user.vai_tro)) {
    alert("Tài khoản không có quyền truy cập Dashboard!");
    localStorage.removeItem("user");
    window.location.href = "../khach-hang/dangnhap.html";
    throw new Error("Role không hợp lệ");
}

// ==========================================
// 2. LẤY CÁC PHẦN TỬ HTML
// ==========================================

const usernameDisplay = document.getElementById("usernameDisplay");
const userBoxTitle = document.getElementById("userBoxTitle");
const menuTitle = document.getElementById("menuTitle");
const menuList = document.getElementById("menuList");
const contentTitle = document.getElementById("contentTitle");
const contentSubtitle = document.getElementById("contentSubtitle");
const welcomeBox = document.getElementById("welcomeBox");
const welcomePanels = document.getElementById("welcomePanels");
const pageFrame = document.getElementById("pageFrame");
const logoutBtn = document.getElementById("logout");

// ==========================================
// 3. CẤU HÌNH NỘI DUNG THEO VAI TRÒ
// ==========================================

const ROLE_CONFIG = {
    ADMIN: {
        menuTitle: "Quản trị hệ thống",
        userBoxTitle: "Tài khoản:",
        defaultName: "Admin",
        welcomeTitle: "Xin chào Admin",
        welcomePanels: [
            {
                title: "Chức năng chính",
                items: [
                    "Quản lý tài khoản",
                    "Quản lý hồ sơ người dùng",
                    "Quản lý bảng giá",
                    "Quản lý vaccine"
                ]
            },
            {
                title: "Gợi ý",
                items: [
                    "Kiểm tra tài khoản mới",
                    "Cập nhật bảng giá",
                    "Quản lý danh mục vaccine"
                ]
            }
        ]
    },

    NHAN_VIEN_Y_TE: {
        menuTitle: "Nhân viên y tế",
        userBoxTitle: "Nhân viên y tế:",
        defaultName: "Nhân viên y tế",
        welcomeTitle: "Xin chào nhân viên y tế",
        welcomePanels: [
            {
                title: "Công việc hôm nay",
                items: [
                    "Kiểm tra danh sách lịch tiêm cần xử lý.",
                    "Xem và cập nhật hồ sơ tiêm chủng của khách hàng.",
                    "Theo dõi các lịch cần nhắc hoặc cần xác nhận."
                ]
            },
            {
                title: "Thông báo",
                items: [
                    "Dữ liệu được đồng bộ thường xuyên để đảm bảo chính xác.",
                    "Vui lòng kiểm tra trạng thái lịch tiêm trước khi xử lý.",
                    "Nếu có lỗi hệ thống, hãy tải lại trang hoặc liên hệ quản trị viên.",
                    "Một số chức năng nâng cao sẽ được cập nhật trong phiên bản tiếp theo."
                ]
            }
        ]
    },

    KHACH_HANG: {
        menuTitle: "Khách hàng",
        userBoxTitle: "Tài khoản:",
        defaultName: "Khách hàng",
        welcomeTitle: null,
        welcomePanels: [
            {
                title: "Gợi ý",
                items: [
                    "Kiểm tra lịch tiêm hoặc lịch làm việc trong ngày.",
                    "Theo dõi số mũi đã tiêm và xem các mũi cần tiêm tiếp.",
                    "Kiểm tra thông báo mới từ hệ thống khi có cập nhật."
                ]
            },
            {
                title: "Thông báo",
                items: [
                    "Dữ liệu được đồng bộ mỗi ngày để đảm bảo thông tin luôn chính xác.",
                    "Vui lòng kiểm tra và cập nhật hồ sơ cá nhân khi có thay đổi.",
                    "Một số tính năng nâng cao sẽ được cập nhật trong phiên bản tiếp theo.",
                    "Nếu gặp lỗi, hãy thử tải lại trang hoặc liên hệ hỗ trợ."
                ]
            }
        ]
    }
};

// ==========================================
// 4. CẤU HÌNH MENU
// ==========================================

const MENU_CONFIG = {
    ADMIN: [
        {
            title: "Quản lý tài khoản",
            page: "../admin/quanly-taikhoan.html",
            icon: "manage_accounts"
        },
        {
            title: "Quản lý hồ sơ người dùng",
            page: "../admin/quanly-hoso.html",
            icon: "person_edit"
        },
        {
            title: "Quản lý bảng giá",
            page: "../admin/quanly-banggia.html",
            icon: "payments"
        },
        {
            title: "Quản lý vaccine",
            page: "../admin/quanly-vaccine.html",
            icon: "vaccines"
        },
        {
            title: "Quản lý lô vaccine",
            page: "../admin/quanly-lovaccine.html",
            icon: "inventory_2"
        },
        {
            title: "Quản lý cơ sở tiêm",
            page: "../admin/quanly-coso.html",
            icon: "local_hospital"
        },
        {
            title: "Quản lý thanh toán",
            page: "../admin/quanly-thanhtoan.html",
            icon: "receipt_long"
        },
        {
            title: "Thống kê báo cáo",
            page: "../admin/thongke-admin.html",
            icon: "analytics"
        }
    ],

    NHAN_VIEN_Y_TE: [
        {
            title: "Quản lý lịch tiêm",
            page: "../nhan-vien-y-te/quanly-lichtiem.html",
            icon: "calendar_month"
        },
        {
            title: "Quản lý hồ sơ tiêm chủng",
            page: "../nhan-vien-y-te/quanly-hoso-tiemchung.html",
            icon: "folder_open"
        },
        {
            title: "Nhắc lịch tiêm",
            page: "../nhan-vien-y-te/nhaclich-tiem.html",
            icon: "notifications_active"
        },
        {
            title: "Thống kê báo cáo",
            page: "../nhan-vien-y-te/thongke-nhanvienyte.html",
            icon: "bar_chart"
        }
    ],

    KHACH_HANG: [
        {
            title: "Quản lý thông tin cá nhân",
            page: "../khach-hang/quanly-thongtin-canhan.html",
            icon: "folder_open"
        },
        {
            title: "Lịch tiêm",
            page: "../khach-hang/lich-tiem.html",
            icon: "calendar_month"
        },
        {
            title: "Đặt lịch tiêm",
            page: "../khach-hang/datlichtiem.html",
            icon: "add_circle",
            key: "datlich"
        },
        {
            title: "Lịch sử tiêm",
            page: "../khach-hang/lich-su-tiem.html",
            icon: "history"
        }
    ]
};

// ==========================================
// 5. CẤU HÌNH THỐNG KÊ TỔNG QUAN
// ==========================================

const OVERVIEW_CONFIG = {
    ADMIN: {
        sectionTitle: "Thông tin quản trị",
        stats: [
            {
                label: "Tổng tài khoản",
                icon: "groups",
                apiKey: "tongTaiKhoan"
            },
            {
                label: "Tổng vaccine",
                icon: "vaccines",
                apiKey: "tongVaccine"
            },
            {
                label: "Cơ sở tiêm",
                icon: "local_hospital",
                apiKey: "tongCoSo"
            },
            {
                label: "Tổng lịch tiêm",
                icon: "calendar_month",
                apiKey: "tongLichTiem"
            },
            {
                label: "Hoàn tiền chờ xử lý",
                icon: "payments",
                apiKey: "hoanTienChoXuLy"
            }
        ]
    },

    NHAN_VIEN_Y_TE: {
        sectionTitle: "Công việc và thông báo",
        stats: [
            {
                label: "Lịch tiêm hôm nay",
                icon: "calendar_today",
                apiKey: "lichHomNay"
            },
            {
                label: "Lịch chờ xử lý",
                icon: "pending_actions",
                apiKey: "lichChoXuLy"
            },
            {
                label: "Lịch đã hoàn thành",
                icon: "task_alt",
                apiKey: "lichHoanThanh"
            },
            {
                label: "Lịch cần nhắc",
                icon: "notifications_active",
                apiKey: "lichCanNhac"
            }
        ]
    },

    KHACH_HANG: {
        sectionTitle: "Thông tin tiêm chủng",
        stats: [
            {
                label: "Lịch tiêm sắp tới",
                icon: "event_upcoming",
                apiKey: "lichSapToi"
            },
            {
                label: "Mũi đã tiêm",
                icon: "vaccines",
                apiKey: "muiDaTiem"
            },
            {
                label: "Lịch sử tiêm",
                icon: "history",
                apiKey: "tongLichSuTiem"
            }
        ]
    }
};

// ==========================================
// 6. THÔNG TIN VAI TRÒ HIỆN TẠI
// ==========================================

const currentRoleConfig = ROLE_CONFIG[user.vai_tro];
const currentMenu = MENU_CONFIG[user.vai_tro];

const displayName =
    user.ten_dang_nhap ||
    currentRoleConfig.defaultName;

// ==========================================
// 7. KEY LƯU TRANG ĐANG MỞ
// ==========================================

const storageUserKey =
    user.id ||
    user.ten_dang_nhap ||
    user.vai_tro;

const CURRENT_PAGE_KEY =
    `dashboard_${storageUserKey}_current_page`;

// ==========================================
// 8. HIỂN THỊ THÔNG TIN USER
// ==========================================

function renderUserInfo() {
    usernameDisplay.textContent = displayName;
    userBoxTitle.textContent = currentRoleConfig.userBoxTitle;
    menuTitle.textContent = currentRoleConfig.menuTitle;
}

// ==========================================
// 9. TẠO MENU
// ==========================================

function renderMenu() {
    menuList.innerHTML = "";

    const overviewItem = document.createElement("li");

    overviewItem.className = "menu-item active";
    overviewItem.dataset.page = "welcome";

    overviewItem.innerHTML = `
        <span class="material-symbols-rounded">
            dashboard
        </span>
        <span>Tổng quan</span>
    `;

    overviewItem.addEventListener("click", () => {
        showWelcome(overviewItem);
    });

    menuList.appendChild(overviewItem);

    currentMenu.forEach((menu) => {
        const item = document.createElement("li");

        item.className = "menu-item";
        item.dataset.page = menu.page;

        const icon = document.createElement("span");
        icon.className = "material-symbols-rounded";
        icon.textContent = menu.icon;

        const label = document.createElement("span");
        label.textContent = menu.title;

        item.appendChild(icon);
        item.appendChild(label);

        item.addEventListener("click", () => {
            loadPage(
                menu.page,
                item,
                menu.title,
                ""
            );
        });

        menuList.appendChild(item);
    });
}

// ==========================================
// 10. ACTIVE MENU
// ==========================================

function setActiveMenu(selectedItem) {
    document.querySelectorAll(".menu-item").forEach((item) => {
        item.classList.remove("active");
    });

    if (selectedItem) {
        selectedItem.classList.add("active");
    }
}

// ==========================================
// 11. TẠO THẺ THỐNG KÊ
// ==========================================

function createOverviewStat(stat) {
    const card = document.createElement("div");
    card.className = "overview-stat-card";

    const top = document.createElement("div");
    top.className = "overview-stat-top";

    const label = document.createElement("span");
    label.className = "overview-stat-label";
    label.textContent = stat.label;

    const icon = document.createElement("span");
    icon.className =
        "material-symbols-rounded overview-stat-icon";
    icon.textContent = stat.icon;

    top.appendChild(label);
    top.appendChild(icon);

    const value = document.createElement("div");
    value.className = "overview-stat-value";
    value.dataset.statKey = stat.apiKey;
    value.textContent = "—";

    const note = document.createElement("div");
    note.className = "overview-stat-note";
    note.textContent = "Chưa kết nối dữ liệu";

    card.appendChild(top);
    card.appendChild(value);
    card.appendChild(note);

    return card;
}

// ==========================================
// 12. HIỂN THỊ TỔNG QUAN
// ==========================================

function renderWelcomePanels() {
    welcomePanels.innerHTML = "";

    const overviewConfig = OVERVIEW_CONFIG[user.vai_tro];

    if (!overviewConfig) {
        return;
    }

    // Khu vực thống kê
    const statsSection = document.createElement("section");
    statsSection.className = "overview-stats-section";

    const statsTitle = document.createElement("h3");
    statsTitle.className = "overview-section-title";
    statsTitle.textContent = "Tổng quan";

    const statsGrid = document.createElement("div");
    statsGrid.className = "overview-stats-grid";

    overviewConfig.stats.forEach((stat) => {
        statsGrid.appendChild(createOverviewStat(stat));
    });

    statsSection.appendChild(statsTitle);
    statsSection.appendChild(statsGrid);

    welcomePanels.appendChild(statsSection);

}
// ==========================================
// 13. CẬP NHẬT SỐ LIỆU TỪ API
// ==========================================

// Hàm này chỉ cập nhật dữ liệu khi được gọi.
// Chưa tự gọi API vì chưa xác định endpoint backend.
//
// Ví dụ sau khi có dữ liệu Admin:
// updateOverviewStats({
//     tongTaiKhoan: 100,
//     tongVaccine: 20,
//     tongCoSo: 5,
//     tongLichTiem: 120,
//     hoanTienChoXuLy: 2
// });

function updateOverviewStats(data) {
    if (!data || typeof data !== "object") {
        return;
    }

    document.querySelectorAll(
        ".overview-stat-value[data-stat-key]"
    ).forEach((element) => {
        const key = element.dataset.statKey;
        const value = data[key];

        if (
            typeof value !== "number" ||
            !Number.isFinite(value) ||
            value < 0
        ) {
            return;
        }

        element.textContent = value.toLocaleString("vi-VN");

        const note = element.parentElement.querySelector(
            ".overview-stat-note"
        );

        if (note) {
            note.textContent = "Dữ liệu hệ thống";
        }
    });
}


async function loadOverviewStats() {
    try {
        const response = await fetch(
            "http://localhost:3000/api/tong-quan/overview",
            {
                method: "GET",
                headers: {
                    "x-user-id": String(user.id),
                    "x-role": user.vai_tro
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Không thể lấy dữ liệu tổng quan: ${response.status}`
            );
        }

        const data = await response.json();

        updateOverviewStats(data);

    } catch (error) {
        console.error("Lỗi tải Tổng quan:", error);

        document.querySelectorAll(
            ".overview-stat-note"
        ).forEach((note) => {
            note.textContent = "Không thể tải dữ liệu";
        });
    }
}


// ==========================================
// 14. TIÊU ĐỀ WELCOME
// ==========================================

function getWelcomeTitle() {
    if (user.vai_tro === "KHACH_HANG") {
        return `Xin chào, ${displayName}`;
    }

    return currentRoleConfig.welcomeTitle;
}

// ==========================================
// 15. HIỂN THỊ TRANG TỔNG QUAN
// ==========================================

function showWelcome(selectedItem) {
    setActiveMenu(selectedItem);

    contentTitle.textContent = getWelcomeTitle();
    contentSubtitle.textContent =
        "Chọn chức năng ở bên trái để sử dụng.";

    welcomeBox.style.display = "block";

    pageFrame.style.display = "none";
    pageFrame.src = "";

    localStorage.removeItem(CURRENT_PAGE_KEY);
}

// ==========================================
// 16. LOAD TRANG VÀO IFRAME
// ==========================================

function loadPage(
    page,
    selectedItem,
    title,
    subtitle = ""
) {
    setActiveMenu(selectedItem);

    contentTitle.textContent = title || "";
    contentSubtitle.textContent = subtitle || "";

    welcomeBox.style.display = "none";

    pageFrame.style.display = "block";
    pageFrame.src = page + "?t=" + Date.now();

    localStorage.setItem(CURRENT_PAGE_KEY, page);
}

// ==========================================
// 17. TÌM MENU THEO PAGE
// ==========================================

function findMenuElement(page) {
    return Array.from(
        document.querySelectorAll(".menu-item")
    ).find((item) => item.dataset.page === page);
}

// ==========================================
// 18. TÌM CONFIG MENU THEO PAGE
// ==========================================

function findMenuConfig(page) {
    return currentMenu.find((menu) => menu.page === page);
}

// ==========================================
// 19. KHÔI PHỤC TRANG ĐANG MỞ
// ==========================================

function restoreCurrentPage() {
    const savedPage = localStorage.getItem(CURRENT_PAGE_KEY);

    if (!savedPage) {
        return false;
    }

    // Chỉ khôi phục trang thuộc menu vai trò hiện tại
    const menuConfig = findMenuConfig(savedPage);

    if (!menuConfig) {
        localStorage.removeItem(CURRENT_PAGE_KEY);
        return false;
    }

    const menuElement = findMenuElement(savedPage);

    loadPage(
        menuConfig.page,
        menuElement,
        menuConfig.title,
        ""
    );

    return true;
}

// ==========================================
// 20. XỬ LÝ ?page=...
// ==========================================

function handlePageFromURL() {
    const params = new URLSearchParams(window.location.search);
    const requestedPage = params.get("page");

    if (!requestedPage) {
        return false;
    }

    // Ví dụ: dashboard.html?page=datlich
    const menuConfig = currentMenu.find((menu) => {
        return menu.key === requestedPage;
    });

    if (!menuConfig) {
        return false;
    }

    const menuElement = findMenuElement(menuConfig.page);

    loadPage(
        menuConfig.page,
        menuElement,
        menuConfig.title,
        ""
    );

    return true;
}

// ==========================================
// 21. ĐĂNG XUẤT
// ==========================================

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");

    alert("Đã đăng xuất");

    window.location.href = "../khach-hang/dangnhap.html";
});

// ==========================================
// 22. KHỞI TẠO DASHBOARD
// ==========================================

function initDashboard() {
    renderUserInfo();
    renderMenu();
    renderWelcomePanels();
    loadOverviewStats();

    contentTitle.textContent = getWelcomeTitle();
    contentSubtitle.textContent =
        "Chọn chức năng ở bên trái để sử dụng.";

    // Ưu tiên yêu cầu từ URL
    if (handlePageFromURL()) {
        return;
    }

    // Khôi phục trang đã mở trước đó
    if (restoreCurrentPage()) {
        return;
    }

    // Mặc định hiển thị Tổng quan
    const overviewItem = document.querySelector(
        '[data-page="welcome"]'
    );

    showWelcome(overviewItem);
}

// ==========================================
// CHẠY DASHBOARD
// ==========================================

initDashboard();
