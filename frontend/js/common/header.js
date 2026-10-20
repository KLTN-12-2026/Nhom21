
/* ======================================
   HEADER DÙNG CHUNG - VAX AI
====================================== */

async function loadSharedHeader() {
    const container = document.getElementById("header-container");

    if (!container) return;

    try {
        const response = await fetch("header.html");

        if (!response.ok) {
            throw new Error("Không tải được Header chung");
        }

        const html = await response.text();

        // innerHTML không tự áp dụng ổn định style
        // trong mọi trường hợp, nên đưa style vào head.
        const template = document.createElement("template");
        template.innerHTML = html;

        const style = template.content.querySelector("style");

        if (style) {
            const existingStyle = document.getElementById(
                "shared-header-style"
            );

            if (!existingStyle) {
                const newStyle = document.createElement("style");
                newStyle.id = "shared-header-style";
                newStyle.textContent = style.textContent;
                document.head.appendChild(newStyle);
            }

            style.remove();
        }

        container.appendChild(template.content.cloneNode(true));

        initSharedHeader();

    } catch (error) {
        console.error("Lỗi Header chung:", error);
    }
}

function initSharedHeader() {
    const userBox = document.getElementById("userBox");
    const camNangToggle = document.getElementById("camNangToggle");
    const camNangMenu = document.getElementById("camNangMenu");
    const camNangDropdown = document.getElementById("camNangDropdown");

    const notificationBox = document.getElementById("notificationBox");
    const notificationDropdown = document.getElementById(
        "notificationDropdown"
    );
    const notificationWrapper = document.querySelector(
        ".notification-wrapper"
    );
    const viewAllNotifications = document.getElementById(
        "viewAllNotifications"
    );

    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        console.error("Dữ liệu tài khoản không hợp lệ:", error);
    }

    // TÀI KHOẢN
    if (userBox) {
        userBox.addEventListener("click", () => {
            window.location.href = user
                ? "dashboard.html"
                : "../khach-hang/dangnhap.html";
        });
    }

    // CẨM NANG
    if (camNangToggle && camNangMenu && camNangDropdown) {
        camNangToggle.addEventListener("click", (event) => {
            event.stopPropagation();

            const isOpen = camNangMenu.classList.toggle("show");

            camNangDropdown.classList.toggle("active", isOpen);
            camNangToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });
    }

    // THÔNG BÁO
    if (notificationBox) {
        notificationBox.style.display = user
            ? "inline-flex"
            : "none";

        if (user && notificationDropdown) {
            notificationBox.addEventListener("click", (event) => {
                event.stopPropagation();

                notificationDropdown.classList.toggle("show");

                // API thông báo hiện chưa kích hoạt
                // nên chỉ giữ chức năng mở/đóng giao diện.
            });
        }
    }

    if (viewAllNotifications) {
        viewAllNotifications.addEventListener("click", () => {
            window.location.href = "thong-bao.html";
        });
    }

    // ĐÓNG MENU KHI CLICK RA NGOÀI
    document.addEventListener("click", (event) => {
        if (
            camNangDropdown &&
            !camNangDropdown.contains(event.target)
        ) {
            camNangMenu.classList.remove("show");
            camNangDropdown.classList.remove("active");

            camNangToggle.setAttribute("aria-expanded", "false");
        }

        if (
            notificationWrapper &&
            !notificationWrapper.contains(event.target) &&
            notificationDropdown
        ) {
            notificationDropdown.classList.remove("show");
        }
    });
}

// Chờ DOM của trang sẵn sàng
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSharedHeader);
} else {
    loadSharedHeader();
}
