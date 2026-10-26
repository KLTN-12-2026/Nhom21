
console.log("✅ dangky.js được load");

const API_BASE_URL = "http://localhost:3000/api";



const registerForm = document.getElementById("registerForm");

const inputFullName = document.getElementById("fullName");
const inputUsername = document.getElementById("username");
const inputPassword = document.getElementById("password");
const inputRePassword = document.getElementById("repassword");
const inputPhone = document.getElementById("phone");
const inputEmail = document.getElementById("email");
const inputOtp = document.getElementById("otp");

const phoneGroup = document.getElementById("phoneGroup");
const emailGroup = document.getElementById("emailGroup");

const sendPhoneOtpButton = document.getElementById("sendPhoneOtp");
const sendEmailOtpButton = document.getElementById("sendEmailOtp");
const registerButton = document.getElementById("registerButton");

const registrationMethodInputs = document.querySelectorAll(
  'input[name="registrationMethod"]'
);



const fullNameRegex =
  /^[A-Za-zÀ-ỹ]+(?:\s[A-Za-zÀ-ỹ]+)*$/;

const usernameRegex =
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d._]{6,30}$/;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])\S{8,32}$/;

const phoneRegex =
  /^0\d{9}$/;

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const otpRegex =
  /^\d{4,8}$/;

const emailOtpRegex =
  /^\d{6}$/;



let isSendingPhoneOtp = false;
let isSendingEmailOtp = false;
let isRegistering = false;



function isEmpty(value) {
  return !value || !value.trim();
}



function getRegistrationMethod() {
  const selectedMethod = document.querySelector(
    'input[name="registrationMethod"]:checked'
  );

  if (!selectedMethod) {
    return "PHONE";
  }

  return selectedMethod.value === "EMAIL"
    ? "EMAIL"
    : "PHONE";
}



function isEmailRegistration() {
  return getRegistrationMethod() === "EMAIL";
}



function getOrCreateErrorElement(input) {



  let errorEl =
    registerForm.querySelector(
      `.error-message[data-for="${input.id}"]`
    );



  if (!errorEl) {

    errorEl =
      document.createElement("div");

    errorEl.className =
      "error-message";

    errorEl.setAttribute(
      "data-for",
      input.id
    );



    if (
      input.parentElement &&
      input.parentElement.classList.contains("otp-row")
    ) {

      input.parentElement.insertAdjacentElement(
        "afterend",
        errorEl
      );

    } else {

      input.parentElement.appendChild(
        errorEl
      );
    }
  }

  return errorEl;
}



function showError(input, message) {

  const errorEl =
    getOrCreateErrorElement(input);

  errorEl.textContent =
    message;

  input.style.borderColor =
    "#e53935";

  input.style.boxShadow =
    "0 0 0 2px rgba(229,57,53,0.12)";
}



function clearError(input) {

  const errorEl =
    registerForm.querySelector(
      `.error-message[data-for="${input.id}"]`
    );

  if (errorEl) {
    errorEl.textContent = "";
  }

  input.style.borderColor = "";
  input.style.boxShadow = "";
}



function validateFullName() {

  const value =
    inputFullName.value;

  if (isEmpty(value)) {

    showError(
      inputFullName,
      "Vui lòng nhập họ và tên."
    );

    return false;
  }

  if (
    value !==
    value.trim()
  ) {

    showError(
      inputFullName,
      "Họ và tên không được có khoảng trắng ở đầu hoặc cuối."
    );

    return false;
  }

  if (
    value.length < 2 ||
    value.length > 50
  ) {

    showError(
      inputFullName,
      "Họ và tên phải từ 2 đến 50 ký tự."
    );

    return false;
  }

  if (
    !fullNameRegex.test(
      value.trim()
    )
  ) {

    showError(
      inputFullName,
      "Họ và tên không được chứa số hoặc ký tự đặc biệt."
    );

    return false;
  }

  clearError(
    inputFullName
  );

  return true;
}



function validateUsername() {

  const value =
    inputUsername.value;

  if (isEmpty(value)) {

    showError(
      inputUsername,
      "Vui lòng nhập tài khoản."
    );

    return false;
  }

  if (
    value !==
    value.trim()
  ) {

    showError(
      inputUsername,
      "Tài khoản không được có khoảng trắng ở đầu hoặc cuối."
    );

    return false;
  }

  if (
    /\s/.test(value)
  ) {

    showError(
      inputUsername,
      "Tài khoản không được chứa khoảng trắng."
    );

    return false;
  }

  if (
    !usernameRegex.test(value)
  ) {

    showError(
      inputUsername,
      "Tài khoản phải từ 6-30 ký tự, chỉ gồm chữ, số, dấu chấm hoặc dấu gạch dưới, và phải có ít nhất 1 chữ và 1 số."
    );

    return false;
  }

  clearError(
    inputUsername
  );

  return true;
}



function validatePassword() {

  const value =
    inputPassword.value;

  if (isEmpty(value)) {

    showError(
      inputPassword,
      "Vui lòng nhập mật khẩu."
    );

    return false;
  }

  if (
    value !==
    value.trim()
  ) {

    showError(
      inputPassword,
      "Mật khẩu không được có khoảng trắng ở đầu hoặc cuối."
    );

    return false;
  }

  if (
    /\s/.test(value)
  ) {

    showError(
      inputPassword,
      "Mật khẩu không được chứa khoảng trắng."
    );

    return false;
  }

  if (
    !passwordRegex.test(value)
  ) {

    showError(
      inputPassword,
      "Mật khẩu phải từ 8-32 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)."
    );

    return false;
  }

  clearError(
    inputPassword
  );

  return true;
}



function validateRePassword() {

  const value =
    inputRePassword.value;

  if (isEmpty(value)) {

    showError(
      inputRePassword,
      "Vui lòng nhập lại mật khẩu."
    );

    return false;
  }

  if (
    value !==
    inputPassword.value
  ) {

    showError(
      inputRePassword,
      "Mật khẩu nhập lại không khớp."
    );

    return false;
  }

  clearError(
    inputRePassword
  );

  return true;
}



function validatePhone() {

  const value =
    inputPhone.value.trim();

  if (isEmpty(value)) {

    showError(
      inputPhone,
      "Vui lòng nhập số điện thoại."
    );

    return false;
  }

  if (
    !phoneRegex.test(value)
  ) {

    showError(
      inputPhone,
      "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0."
    );

    return false;
  }

  clearError(
    inputPhone
  );

  return true;
}



function validateEmail() {

  const value =
    inputEmail.value.trim();

  if (isEmpty(value)) {

    showError(
      inputEmail,
      "Vui lòng nhập Gmail."
    );

    return false;
  }

  if (
    inputEmail.value !==
    inputEmail.value.trim()
  ) {

    showError(
      inputEmail,
      "Gmail không được có khoảng trắng ở đầu hoặc cuối."
    );

    return false;
  }

  if (
    !emailRegex.test(value) ||
    value.length > 254
  ) {

    showError(
      inputEmail,
      "Địa chỉ email không hợp lệ."
    );

    return false;
  }



  if (
    !value.toLowerCase().endsWith("@gmail.com")
  ) {

    showError(
      inputEmail,
      "Vui lòng sử dụng địa chỉ @gmail.com."
    );

    return false;
  }

  clearError(
    inputEmail
  );

  return true;
}



function validateOtp() {

  const value =
    inputOtp.value.trim();

  if (isEmpty(value)) {

    showError(
      inputOtp,
      "Vui lòng nhập mã OTP."
    );

    return false;
  }



  if (isEmailRegistration()) {

    if (
      !emailOtpRegex.test(value)
    ) {

      showError(
        inputOtp,
        "Mã OTP Gmail phải gồm 6 chữ số."
      );

      return false;
    }

  } else {

    if (
      !otpRegex.test(value)
    ) {

      showError(
        inputOtp,
        "Mã OTP không hợp lệ."
      );

      return false;
    }
  }

  clearError(
    inputOtp
  );

  return true;
}



function validateRegisterForm() {

  const fullNameValid =
    validateFullName();

  const usernameValid =
    validateUsername();

  const passwordValid =
    validatePassword();

  const rePasswordValid =
    validateRePassword();



  let contactValid;

  if (isEmailRegistration()) {

    contactValid =
      validateEmail();

  } else {

    contactValid =
      validatePhone();
  }

  const otpValid =
    validateOtp();

  return (
    fullNameValid &&
    usernameValid &&
    passwordValid &&
    rePasswordValid &&
    contactValid &&
    otpValid
  );
}



function changeRegistrationMethod() {

  const emailMode =
    isEmailRegistration();



  if (phoneGroup) {
    phoneGroup.hidden = emailMode;
  }

  if (emailGroup) {
    emailGroup.hidden = !emailMode;
  }



  if (inputPhone) {
    inputPhone.required = !emailMode;
  }

  if (inputEmail) {
    inputEmail.required = emailMode;
  }



  inputOtp.value = "";



  clearError(inputPhone);
  clearError(inputEmail);
  clearError(inputOtp);
}



async function sendOtp() {

  if (isSendingPhoneOtp || isRegistering) {
    return;
  }

  const so_dien_thoai =
    inputPhone.value.trim();

  if (
    !validatePhone()
  ) {

    inputPhone.focus();

    return;
  }

  isSendingPhoneOtp = true;

  if (sendPhoneOtpButton) {
    sendPhoneOtpButton.disabled = true;
  }

  try {

    const res =
      await fetch(
        `${API_BASE_URL}/auth/send-otp`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              so_dien_thoai
            })
        }
      );

    const data =
      await res.json();

    if (!res.ok) {

      throw new Error(
        data.message ||
        "Gửi OTP thất bại"
      );
    }

    alert(
      data.message ||
      "Đã gửi OTP thành công"
    );



    if (!isEmailRegistration()) {
      inputOtp.focus();
    }

  } catch (err) {

    console.error(
      "❌ Lỗi gửi OTP:",
      err
    );

    alert(
      "Không thể gửi OTP.\n" +
      err.message
    );

  } finally {

    isSendingPhoneOtp = false;

    if (sendPhoneOtpButton) {
      sendPhoneOtpButton.disabled = false;
    }
  }
}



async function sendEmailOtp() {

  if (isSendingEmailOtp || isRegistering) {
    return;
  }

  const email =
    inputEmail.value.trim().toLowerCase();

  if (
    !validateEmail()
  ) {

    inputEmail.focus();

    return;
  }

  isSendingEmailOtp = true;

  if (sendEmailOtpButton) {
    sendEmailOtpButton.disabled = true;
  }

  try {

    const res =
      await fetch(
        `${API_BASE_URL}/auth/dang-ky-email/gui-otp`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              email
            })
        }
      );

    const data =
      await res.json();

    if (!res.ok) {



      if (data.field === "email") {

        showError(
          inputEmail,
          data.message ||
          "Gmail không hợp lệ."
        );

        return;
      }

      throw new Error(
        data.message ||
        "Gửi OTP Gmail thất bại"
      );
    }

    alert(
      data.message ||
      "Đã gửi mã OTP về Gmail."
    );

    if (isEmailRegistration()) {
      inputOtp.focus();
    }

  } catch (err) {

    console.error(
      "❌ Lỗi gửi OTP Gmail:",
      err
    );

    alert(
      "Không thể gửi OTP Gmail.\n" +
      err.message
    );

  } finally {

    isSendingEmailOtp = false;

    if (sendEmailOtpButton) {
      sendEmailOtpButton.disabled = false;
    }
  }
}



registrationMethodInputs.forEach(
  (radio) => {

    radio.addEventListener(
      "change",
      changeRegistrationMethod
    );
  }
);




if (sendPhoneOtpButton) {

  if (
    !sendPhoneOtpButton.hasAttribute("onclick")
  ) {

    sendPhoneOtpButton.addEventListener(
      "click",
      sendOtp
    );
  }
}

if (sendEmailOtpButton) {

  if (
    !sendEmailOtpButton.hasAttribute("onclick")
  ) {

    sendEmailOtpButton.addEventListener(
      "click",
      sendEmailOtp
    );
  }
}



inputFullName.addEventListener(
  "blur",
  validateFullName
);

inputUsername.addEventListener(
  "blur",
  validateUsername
);

inputPassword.addEventListener(
  "blur",
  validatePassword
);

inputRePassword.addEventListener(
  "blur",
  validateRePassword
);

inputPhone.addEventListener(
  "blur",
  () => {

    if (!isEmailRegistration()) {
      validatePhone();
    }
  }
);

inputEmail.addEventListener(
  "blur",
  () => {

    if (isEmailRegistration()) {
      validateEmail();
    }
  }
);

inputOtp.addEventListener(
  "blur",
  validateOtp
);



inputFullName.addEventListener(
  "input",
  () => {

    if (
      inputFullName.value
    ) {

      validateFullName();

    } else {

      clearError(
        inputFullName
      );
    }
  }
);



inputUsername.addEventListener(
  "input",
  () => {

    if (
      inputUsername.value
    ) {

      validateUsername();

    } else {

      clearError(
        inputUsername
      );
    }
  }
);



inputPassword.addEventListener(
  "input",
  () => {

    if (
      inputPassword.value
    ) {

      validatePassword();

    } else {

      clearError(
        inputPassword
      );
    }

    if (
      inputRePassword.value
    ) {

      validateRePassword();
    }
  }
);



inputRePassword.addEventListener(
  "input",
  () => {

    if (
      inputRePassword.value
    ) {

      validateRePassword();

    } else {

      clearError(
        inputRePassword
      );
    }
  }
);



inputPhone.addEventListener(
  "input",
  () => {

    if (isEmailRegistration()) {
      return;
    }

    if (
      inputPhone.value
    ) {

      validatePhone();

    } else {

      clearError(
        inputPhone
      );
    }
  }
);



inputEmail.addEventListener(
  "input",
  () => {

    if (!isEmailRegistration()) {
      return;
    }

    if (
      inputEmail.value
    ) {

      validateEmail();

    } else {

      clearError(
        inputEmail
      );
    }
  }
);



inputOtp.addEventListener(
  "input",
  () => {

    if (
      inputOtp.value
    ) {

      validateOtp();

    } else {

      clearError(
        inputOtp
      );
    }
  }
);



if (!registerForm) {

  console.error(
    "❌ Không tìm thấy form #registerForm"
  );

} else {

  registerForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      if (isRegistering) {
        return;
      }

      if (
        !validateRegisterForm()
      ) {
        return;
      }

    
      const data = {

        ho_ten:
          inputFullName.value.trim(),

        ten_dang_nhap:
          inputUsername.value.trim(),

        mat_khau:
          inputPassword.value,

        xac_nhan_mat_khau:
          inputRePassword.value,

        otp:
          inputOtp.value.trim()
      };

   
      if (isEmailRegistration()) {

        data.phuong_thuc = "EMAIL";

        data.email =
          inputEmail.value.trim().toLowerCase();

      } else {

        data.so_dien_thoai =
          inputPhone.value.trim();
      }

      isRegistering = true;

      if (registerButton) {
        registerButton.disabled = true;
      }

      try {

        const res =
          await fetch(
            `${API_BASE_URL}/auth/register`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(data)
            }
          );

        const result =
          await res.json();

        console.log(
          "🔹 Kết quả đăng ký:",
          result
        );



        if (!res.ok) {

          if (
            result.field ===
            "ho_ten"
          ) {

            showError(
              inputFullName,
              result.message
            );

          } else if (
            result.field ===
            "ten_dang_nhap"
          ) {

            showError(
              inputUsername,
              result.message
            );

          } else if (
            result.field ===
            "mat_khau"
          ) {

            showError(
              inputPassword,
              result.message
            );

          } else if (
            result.field ===
            "xac_nhan_mat_khau"
          ) {

            showError(
              inputRePassword,
              result.message
            );

          } else if (
            result.field ===
            "so_dien_thoai"
          ) {

            showError(
              inputPhone,
              result.message
            );

          } else if (
            result.field ===
            "email"
          ) {



            showError(
              inputEmail,
              result.message
            );

          } else if (
            result.field ===
            "otp"
          ) {

            showError(
              inputOtp,
              result.message
            );

          } else {

            alert(
              "❌ " +
              (
                result.message ||
                "Đăng ký thất bại"
              )
            );
          }

          return;
        }

  
        alert(
          result.message ||
          "Đăng ký thành công!"
        );

        window.location.href =
          "dangnhap.html";

      } catch (err) {

        console.error(
          "❌ Lỗi đăng ký:",
          err
        );

        alert(
          "⚠ Không kết nối được server!"
        );

      } finally {

        isRegistering = false;

        if (registerButton) {
          registerButton.disabled = false;
        }
      }
    }
  );
}



if (
  registerForm &&
  inputPhone &&
  inputEmail &&
  inputOtp
) {

  changeRegistrationMethod();
}
