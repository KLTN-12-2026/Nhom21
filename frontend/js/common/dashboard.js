
const user = JSON.parse(localStorage.getItem("user") || "null");
const token = localStorage.getItem("token");

if (!user || !token) {
    alert("Bạn chưa đăng nhập!");
    window.location.href = "dangnhap.html";
    throw new Error("Chưa đăng nhập");
}

const VALID_ROLES = [
    "ADMIN",
    "NHAN_VIEN_Y_TE",
    "KHACH_HANG"
];

if (!VALID_ROLES.includes(user.vai_tro)) {
    alert("Tài khoản không có quyền truy cập Dashboard!");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "dangnhap.html";
    throw new Error("Role không hợp lệ");
}

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


const MENU_CONFIG = {
    ADMIN: [
        {
            title: "Quản lý tài khoản",
            page: "../admin/quanly-tai-khoan.html",
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
            page: "../admin/thongke-baocao.html",
            icon: "analytics"
        }
    ],

    NHAN_VIEN_Y_TE: [
        {
            title: "Quản lý lịch tiêm",
            page: "../nhan-vien-y-te/quanly-lich.html",
            icon: "calendar_month"
        },
        {
            title: "Quản lý hồ sơ tiêm chủng",
            page: "../nhan-vien-y-te/quanly-hoso.html",
            icon: "folder_open"
        },
        {
            title: "Nhắc lịch tiêm",
            page: "../nhan-vien-y-te/nhaclichtiem.html",
            icon: "notifications_active"
        },
        {
            title: "Thống kê báo cáo",
            page: "../nhan-vien-y-te/thongke-baocao.html",
            icon: "bar_chart"
        }
    ],

    KHACH_HANG: [
        {
            title: "Quản lý thông tin cá nhân",
            page: "../khach-hang/thongtin-canhan.html",
            icon: "folder_open"
        },
        {
            title: "Lịch tiêm",
            page: "../khach-hang/lich-tiem.html",
            icon: "calendar_month"
        },
        {
            title: "Đặt lịch tiêm",
            page: "../khach-hang/dat-lich-tiem.html",
            icon: "add_circle",
            key: "datlich"
        },
        {
            title: "Thanh toán",
            page: "../khach-hang/thanhtoan.html",
            icon: "payments",
            key: "thanhtoan"
        },
        {
            title: "Lịch sử tiêm",
            page: "../khach-hang/lichsu-tiemchung.html",
            icon: "history"
        }
    ]
};

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
            },
            {
                label: "Chờ thanh toán",
                icon: "payments",
                apiKey: "thanhToanChoXuLy"
            }
        ]
    }
};

const currentRoleConfig = ROLE_CONFIG[user.vai_tro];
const currentMenu = MENU_CONFIG[user.vai_tro];

const displayName =
    user.ten_dang_nhap ||
    currentRoleConfig.defaultName;

const storageUserKey =
    user.id ||
    user.ten_dang_nhap ||
    user.vai_tro;

const CURRENT_PAGE_KEY =
    `dashboard_${storageUserKey}_current_page`;

function renderUserInfo() {
    usernameDisplay.textContent = displayName;
    userBoxTitle.textContent = currentRoleConfig.userBoxTitle;
    menuTitle.textContent = currentRoleConfig.menuTitle;
}

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

function setActiveMenu(selectedItem) {
    document.querySelectorAll(".menu-item").forEach((item) => {
        item.classList.remove("active");
    });

    if (selectedItem) {
        selectedItem.classList.add("active");
    }
}

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


function renderWelcomePanels() {
    welcomePanels.innerHTML = "";

    const role = user.vai_tro;
    const overviewConfig = OVERVIEW_CONFIG[role];

    if (!overviewConfig) return;

    const mainLayout = document.createElement("div");
    mainLayout.className = "overview-main-layout";

    const statsSection = document.createElement("section");
    statsSection.className = "overview-stats-section";

    const statsTitle = document.createElement("h3");
    statsTitle.className = "overview-section-title";
    statsTitle.textContent = "Tổng quan";

    const statsGrid = document.createElement("div");
    statsGrid.className = "overview-stats-grid";

    overviewConfig.stats.forEach((stat) => {
        const card = createOverviewStat(stat);
        statsGrid.appendChild(card);
    });

    statsSection.appendChild(statsTitle);
    statsSection.appendChild(statsGrid);


    const sidePanel = document.createElement("section");
    sidePanel.className = "overview-side-panel";

    const sideTitle = document.createElement("h3");
    sideTitle.className = "overview-side-title";

    const sideContent = document.createElement("div");
    sideContent.className = "overview-side-content";

    if (role === "ADMIN") {
        sideTitle.textContent = "Công việc cần xử lý";

        const label = document.createElement("p");
        label.textContent = "Hoàn tiền chờ xử lý";

        const value = document.createElement("div");
        value.className = "overview-side-value";
        value.dataset.statKey = "hoanTienChoXuLy";
        value.textContent = "—";

        const link = document.createElement("a");
        link.href = "#";
        link.textContent = "Quản lý thanh toán →";

        link.addEventListener("click", (event) => {
            event.preventDefault();

            openOverviewMenuPage(
                "../admin/quanly-thanhtoan.html"
            );
        });

        sideContent.append(label, value, link);
    }

    if (role === "NHAN_VIEN_Y_TE") {
        sideTitle.textContent = "Công việc cần xử lý";

        const tasks = [
            {
                label: "Lịch chờ xử lý",
                key: "lichChoXuLy",
                page: "../nhan-vien-y-te/quanly-lich.html"
            },
            {
                label: "Lịch cần nhắc",
                key: "lichCanNhac",
                page: "../nhan-vien-y-te/nhaclichtiem.html"
            }
        ];

        tasks.forEach((task) => {
            const item = document.createElement("div");
            item.className = "overview-task-item";

            const label = document.createElement("span");
            label.textContent = task.label;

            const value = document.createElement("strong");
            value.dataset.statKey = task.key;
            value.textContent = "—";

            const link = document.createElement("a");
            link.href = "#";
            link.textContent = "Xem chi tiết →";

            link.addEventListener("click", (event) => {
                event.preventDefault();
                openOverviewMenuPage(task.page);
            });

            item.append(label, value, link);
            sideContent.appendChild(item);
        });
    }

    if (role === "KHACH_HANG") {
        sideTitle.textContent = "Lịch tiêm của tôi";

        const appointment = document.createElement("div");
        appointment.id = "overviewNearestAppointment";
        appointment.className = "overview-appointment";
        appointment.textContent = "Đang tải lịch tiêm...";

        const link = document.createElement("a");
        link.href = "#";
        link.textContent = "Xem tất cả lịch tiêm →";

        link.addEventListener("click", (event) => {
            event.preventDefault();

            openOverviewMenuPage(
                "../khach-hang/lich-tiem.html"
            );
        });

        sideContent.append(appointment, link);
    }

    sidePanel.appendChild(sideTitle);
    sidePanel.appendChild(sideContent);

    mainLayout.appendChild(statsSection);
    mainLayout.appendChild(sidePanel);

    welcomePanels.appendChild(mainLayout);
}

function openOverviewMenuPage(page) {
    const menuConfig = findMenuConfig(page);
    const menuElement = findMenuElement(page);

    if (!menuConfig || !menuElement) {
        return;
    }

    loadPage(
        menuConfig.page,
        menuElement,
        menuConfig.title,
        ""
    );
}


function updateOverviewStats(data) {
    if (!data || typeof data !== "object") {
        return;
    }

    document.querySelectorAll(
        "[data-stat-key]"
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

        if (
            note &&
            element.classList.contains("overview-stat-value")
        ) {
            note.textContent = "Dữ liệu hệ thống";
        }
    });
}
function updateNearestAppointment(appointment) {
    const container = document.getElementById(
        "overviewNearestAppointment"
    );

    if (!container) return;

    container.replaceChildren();
    if (!appointment) {
        container.textContent =
            "Bạn chưa có lịch tiêm sắp tới.";
        return;
    }

    const dateValue = String(
        appointment.ngay_tiem || ""
    ).slice(0, 10);

    const dateParts = dateValue.split("-");

    const formattedDate = dateParts.length === 3
        ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
        : "Chưa có";
    const statusLabels = {
        CHO_DUYET: "Chờ duyệt",
        DA_DUYET: "Đã duyệt"
    };

    const details = [
        [
            "Vaccine",
            appointment.vaccine || "Chưa có"
        ],
        [
            "Ngày tiêm",
            formattedDate
        ],
        [
            "Giờ tiêm",
            appointment.gio_tiem || "Chưa có"
        ],
        [
            "Trạng thái",
            statusLabels[appointment.trang_thai] ||
            appointment.trang_thai ||
            "Chưa xác định"
        ]
    ];

    details.forEach(([label, value]) => {
        const row = document.createElement("div");
        row.className = "overview-appointment-row";

        const labelElement = document.createElement("span");
        labelElement.textContent = label + ":";

        const valueElement = document.createElement("strong");
        valueElement.textContent = value;

        row.appendChild(labelElement);
        row.appendChild(valueElement);

        container.appendChild(row);
    });
}

async function loadOverviewStats() {
    try {
        const response = await fetch(
            "http://localhost:3000/api/tong-quan/overview",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            }
        );
        if (await checkAuthResponse(response)) {
            return;
        }
        if (!response.ok) {
            throw new Error(
                `Không thể lấy dữ liệu tổng quan: ${response.status}`
            );
        }

        const data = await response.json();

        updateOverviewStats(data);
        if (user.vai_tro === "KHACH_HANG") {
            updateNearestAppointment(data.lichTiemGanNhat);
        }
    } catch (error) {
        console.error("Lỗi tải Tổng quan:", error);

        document.querySelectorAll(
            ".overview-stat-note"
        ).forEach((note) => {
            note.textContent = "Không thể tải dữ liệu";
        });

        const appointment = document.getElementById(
            "overviewNearestAppointment"
        );

        if (appointment) {
            appointment.textContent = "Không thể tải lịch tiêm.";
        }
    }
}

function getWelcomeTitle() {
    if (user.vai_tro === "KHACH_HANG") {
        return `Xin chào, ${displayName}`;
    }

    return currentRoleConfig.welcomeTitle;
}

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

function findMenuElement(page) {
    return Array.from(
        document.querySelectorAll(".menu-item")
    ).find((item) => item.dataset.page === page);
}


function findMenuConfig(page) {
    return currentMenu.find((menu) => menu.page === page);
}

function restoreCurrentPage() {
    const savedPage = localStorage.getItem(CURRENT_PAGE_KEY);

    if (!savedPage) {
        return false;
    }

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

function handlePageFromURL() {
    const params = new URLSearchParams(window.location.search);
    const requestedPage = params.get("page");

    if (!requestedPage) {
        return false;
    }

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

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem(CURRENT_PAGE_KEY);
    alert("Đã đăng xuất");
    window.location.href = "dangnhap.html";
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
