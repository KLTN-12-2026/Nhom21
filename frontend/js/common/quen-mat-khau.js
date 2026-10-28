
const API_BASE_URL = "http://localhost:3000/api";

const forgotForm = document.getElementById("forgotForm");

const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");

const emailGroup = document.getElementById("emailGroup");
const phoneGroup = document.getElementById("phoneGroup");

const btnMethodEmail = document.getElementById("btnMethodEmail");
const btnMethodPhone = document.getElementById("btnMethodPhone");

const otpInput = document.getElementById("otp");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const btnSendOtp = document.getElementById("btnSendOtp");
const successMessage = document.getElementById("successMessage");

const submitButton = forgotForm.querySelector('button[type="submit"]');

const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])\S{8,32}$/;

const phoneRegex = /^0\d{9}$/;

let currentMethod = "PHONE";
let otpRequestId = null;
let otpSentMethod = null;
let otpSentIdentifier = null;

let isSendingOtp = false;
let isResettingPassword = false;



function showError(input, message) {
    const errorEl = document.querySelector(
        `.error-message[data-for="${input.id}"]`
    );

    if (errorEl) {
        errorEl.textContent = message;
    }

    input.classList.remove("input-success");
    input.classList.add("input-error");
}

function showSuccess(input) {
    const errorEl = document.querySelector(
        `.error-message[data-for="${input.id}"]`
    );

    if (errorEl) {
        errorEl.textContent = "";
    }

    input.classList.remove("input-error");
    input.classList.add("input-success");
}

function clearError(input) {
    const errorEl = document.querySelector(
        `.error-message[data-for="${input.id}"]`
    );

    if (errorEl) {
        errorEl.textContent = "";
    }

    input.classList.remove("input-error", "input-success");
}


function getCurrentIdentifier() {
    return currentMethod === "EMAIL"
        ? emailInput.value.trim()
        : phoneInput.value.trim();
}

function clearOtpRequest() {
    otpRequestId = null;
    otpSentMethod = null;
    otpSentIdentifier = null;

    otpInput.value = "";
    clearError(otpInput);
}

function switchMethod(method) {
    if (isSendingOtp || isResettingPassword) {
        return;
    }

    if (method !== "EMAIL" && method !== "PHONE") {
        return;
    }

    const changed = currentMethod !== method;

    currentMethod = method;

    const isEmailMethod = method === "EMAIL";

   
    btnMethodEmail.checked = isEmailMethod;
    btnMethodPhone.checked = !isEmailMethod;

  
    emailGroup.hidden = !isEmailMethod;
    phoneGroup.hidden = isEmailMethod;

    if (changed) {
        clearOtpRequest();
        clearError(emailInput);
        clearError(phoneInput);
        successMessage.textContent = "";
    }
}


btnMethodEmail.addEventListener("change", () => {
    if (btnMethodEmail.checked) {
        switchMethod("EMAIL");
    }
});

btnMethodPhone.addEventListener("change", () => {
    if (btnMethodPhone.checked) {
        switchMethod("PHONE");
    }
});


switchMethod(
    btnMethodEmail.checked ? "EMAIL" : "PHONE"
);



function isEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateEmail() {
    const email = emailInput.value.trim();

    if (!email) {
        showError(emailInput, "Vui lòng nhập Gmail.");
        return false;
    }

    if (
        !isEmail(email) ||
        !email.toLowerCase().endsWith("@gmail.com")
    ) {
        showError(emailInput, "Gmail không hợp lệ.");
        return false;
    }

    showSuccess(emailInput);
    return true;
}



function validatePhone() {
    const phone = phoneInput.value.trim();

    if (!phone) {
        showError(phoneInput, "Vui lòng nhập số điện thoại.");
        return false;
    }

    if (!phoneRegex.test(phone)) {
        showError(
            phoneInput,
            "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0."
        );
        return false;
    }

    showSuccess(phoneInput);
    return true;
}

function validateIdentifier() {
    return currentMethod === "EMAIL"
        ? validateEmail()
        : validatePhone();
}



function validateOtp() {
    const otp = otpInput.value.trim();

    if (!otp) {
        showError(otpInput, "Vui lòng nhập mã OTP.");
        return false;
    }

    if (!/^\d{6}$/.test(otp)) {
        showError(otpInput, "OTP phải gồm 6 chữ số.");
        return false;
    }

    showSuccess(otpInput);
    return true;
}


function validatePassword() {
    const password = newPasswordInput.value;

    if (!password) {
        showError(
            newPasswordInput,
            "Vui lòng nhập mật khẩu mới."
        );
        return false;
    }

    if (password !== password.trim()) {
        showError(
            newPasswordInput,
            "Mật khẩu không được có khoảng trắng đầu hoặc cuối."
        );
        return false;
    }

    if (/\s/.test(password)) {
        showError(
            newPasswordInput,
            "Mật khẩu không được chứa khoảng trắng."
        );
        return false;
    }

    if (!passwordRegex.test(password)) {
        showError(
            newPasswordInput,
            "Mật khẩu 8-32 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt."
        );
        return false;
    }

    showSuccess(newPasswordInput);
    return true;
}

function validateConfirmPassword() {
    const password = newPasswordInput.value;
    const confirm = confirmPasswordInput.value;

    if (!confirm) {
        showError(
            confirmPasswordInput,
            "Vui lòng xác nhận mật khẩu."
        );
        return false;
    }

    if (confirm !== password) {
        showError(
            confirmPasswordInput,
            "Mật khẩu xác nhận không khớp."
        );
        return false;
    }

    showSuccess(confirmPasswordInput);
    return true;
}


emailInput.addEventListener("input", () => {
    if (currentMethod !== "EMAIL") return;

    if (emailInput.value.trim()) {
        validateEmail();
    } else {
        clearError(emailInput);
    }

    clearOtpRequest();
    successMessage.textContent = "";
});

phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value
        .replace(/\D/g, "")
        .slice(0, 10);

    if (currentMethod !== "PHONE") return;

    if (phoneInput.value.trim()) {
        validatePhone();
    } else {
        clearError(phoneInput);
    }

    clearOtpRequest();
    successMessage.textContent = "";
});

otpInput.addEventListener("input", () => {
    otpInput.value = otpInput.value
        .replace(/\D/g, "")
        .slice(0, 6);

    if (!otpInput.value) {
        clearError(otpInput);
        return;
    }

    validateOtp();
});

newPasswordInput.addEventListener("input", () => {
    if (newPasswordInput.value) {
        validatePassword();
    } else {
        clearError(newPasswordInput);
    }

    if (confirmPasswordInput.value) {
        validateConfirmPassword();
    }
});

confirmPasswordInput.addEventListener("input", () => {
    if (confirmPasswordInput.value) {
        validateConfirmPassword();
    } else {
        clearError(confirmPasswordInput);
    }
});


btnSendOtp.addEventListener("click", async () => {
    successMessage.textContent = "";

    if (isSendingOtp || isResettingPassword) return;
    if (!validateIdentifier()) return;

    const method = currentMethod;
    const identifier = getCurrentIdentifier();

    const endpoint = method === "EMAIL"
        ? "/auth/quen-mat-khau/gui-otp"
        : "/auth/quen-mat-khau-sdt/gui-otp";

    const payload = method === "EMAIL"
        ? { email: identifier }
        : { so_dien_thoai: identifier };

    isSendingOtp = true;

    btnSendOtp.disabled = true;
    btnMethodEmail.disabled = true;
    btnMethodPhone.disabled = true;

    btnSendOtp.textContent = "Đang gửi...";

  
    clearOtpRequest();

    try {
        const res = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.message || "Gửi OTP thất bại."
            );
        }

   
        if (method === "PHONE" && !data.ma_yeu_cau) {
            throw new Error(
                "Không nhận được mã yêu cầu OTP từ hệ thống."
            );
        }

        otpRequestId = method === "PHONE"
            ? data.ma_yeu_cau
            : null;

        otpSentMethod = method;
        otpSentIdentifier = identifier;

        otpInput.value = "";
        clearError(otpInput);

        successMessage.textContent =
            data.message || "Đã gửi mã OTP thành công.";

    } catch (err) {
        clearOtpRequest();
        alert("Lỗi: " + err.message);

    } finally {
        isSendingOtp = false;

        btnSendOtp.disabled = false;
        btnMethodEmail.disabled = false;
        btnMethodPhone.disabled = false;

        btnSendOtp.textContent = "Gửi mã";
    }
});



forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isSendingOtp || isResettingPassword) return;

    successMessage.textContent = "";

    const identifierValid = validateIdentifier();
    const otpValid = validateOtp();
    const passwordValid = validatePassword();
    const confirmValid = validateConfirmPassword();

    if (
        !identifierValid ||
        !otpValid ||
        !passwordValid ||
        !confirmValid
    ) {
        return;
    }

    const method = currentMethod;
    const identifier = getCurrentIdentifier();

    if (
        otpSentMethod !== method ||
        otpSentIdentifier !== identifier
    ) {
        alert(
            "Vui lòng gửi mã OTP cho thông tin hiện tại."
        );
        return;
    }

    if (method === "PHONE" && !otpRequestId) {
        alert(
            "Chưa có mã yêu cầu OTP. Vui lòng gửi OTP lại."
        );
        return;
    }

    const endpoint = method === "EMAIL"
        ? "/auth/quen-mat-khau/dat-lai"
        : "/auth/quen-mat-khau-sdt/dat-lai";

    const payload = method === "EMAIL"
        ? {
            email: identifier,
            otp: otpInput.value.trim(),
            mat_khau_moi: newPasswordInput.value
        }
        : {
            so_dien_thoai: identifier,
            ma_yeu_cau: otpRequestId,
            otp: otpInput.value.trim(),
            mat_khau_moi: newPasswordInput.value
        };

    isResettingPassword = true;

    submitButton.disabled = true;
    btnSendOtp.disabled = true;
    btnMethodEmail.disabled = true;
    btnMethodPhone.disabled = true;

    try {
        const res = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.message || "Đặt lại mật khẩu thất bại."
            );
        }

        alert(
            data.message || "Đặt lại mật khẩu thành công."
        );

        window.location.href = "dangnhap.html";

    } catch (err) {
        alert("Lỗi: " + err.message);

    } finally {
        isResettingPassword = false;

        submitButton.disabled = false;
        btnSendOtp.disabled = false;
        btnMethodEmail.disabled = false;
        btnMethodPhone.disabled = false;
    }
});
