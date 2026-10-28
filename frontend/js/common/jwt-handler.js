// ==========================================
// XỬ LÝ PHIÊN ĐĂNG NHẬP JWT
// ==========================================

function handleExpiredToken() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");

    window.top.location.href = new URL(
        "dangnhap.html",
        window.top.location.href
    ).href;
}
async function checkAuthResponse(response) {
    if (response.status !== 401) {
        return false;
    }

    const data = await response.clone().json().catch(() => ({}));

    if (data.message === "Phiên đăng nhập đã hết hạn") {
        handleExpiredToken();
        return true;
    }

    return false;
}