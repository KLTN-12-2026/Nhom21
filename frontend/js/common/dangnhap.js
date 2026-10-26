console.log("✅ dangnhap.js được load");

// ================================
// HÀM ĐIỀU HƯỚNG THEO ROLE
// ================================
function redirectByRole(user) {
  if (!user || !user.vai_tro) {
    window.location.href = "dangnhap.html";
    return;
  }

  if (
    user.vai_tro === "ADMIN" ||
    user.vai_tro === "NHAN_VIEN_Y_TE"
  ) {
    window.location.href = "dashboard.html";
  } else if (user.vai_tro === "KHACH_HANG") {
    window.location.href = "trangchu.html";
  } else {
    alert("⚠ Role không hợp lệ!");

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "dangnhap.html";
  }
}

// ================================
// REGEX VALIDATE KHỚP BACKEND
// ================================
const usernameRegex =
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,30}$/;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])\S{8,32}$/;

// ================================
// HÀM HIỂN THỊ / XÓA LỖI
// ================================
function getOrCreateErrorElement(input) {
  let errorEl =
    input.parentElement.querySelector(
      `.error-message[data-for="${input.id}"]`
    );

  if (!errorEl) {
    errorEl = document.createElement("div");

    errorEl.className = "error-message";

    errorEl.setAttribute(
      "data-for",
      input.id
    );

    errorEl.style.color = "#e53935";
    errorEl.style.fontSize = "12px";
    errorEl.style.marginTop = "4px";
    errorEl.style.lineHeight = "1.4";

    input.parentElement.appendChild(
      errorEl
    );
  }

  return errorEl;
}

function showError(input, message) {
  const errorEl =
    getOrCreateErrorElement(input);

  errorEl.textContent = message;

  input.style.borderColor =
    "#e53935";

  input.style.boxShadow =
    "0 0 0 2px rgba(229,57,53,0.12)";
}

function clearError(input) {
  const errorEl =
    input.parentElement.querySelector(
      `.error-message[data-for="${input.id}"]`
    );

  if (errorEl) {
    errorEl.textContent = "";
  }

  input.style.borderColor = "";
  input.style.boxShadow = "";
}

// ================================
// VALIDATE TÀI KHOẢN
// ================================
function validateUsername() {
  const usernameInput =
    document.getElementById("username");

  const username =
    usernameInput.value;

  if (!username.trim()) {
    showError(
      usernameInput,
      "Vui lòng nhập tài khoản."
    );

    return false;
  }

  if (
    username !==
    username.trim()
  ) {
    showError(
      usernameInput,
      "Tài khoản không được có khoảng trắng ở đầu hoặc cuối."
    );

    return false;
  }

  if (/\s/.test(username)) {
    showError(
      usernameInput,
      "Tài khoản không được chứa khoảng trắng."
    );

    return false;
  }

  if (
    !usernameRegex.test(username)
  ) {
    showError(
      usernameInput,
      "Tài khoản phải từ 6-30 ký tự, chỉ gồm chữ và số, và phải có ít nhất 1 chữ và 1 số."
    );

    return false;
  }

  clearError(usernameInput);

  return true;
}

// ================================
// VALIDATE MẬT KHẨU
// ================================
function validatePassword() {
  const passwordInput =
    document.getElementById("password");

  const password =
    passwordInput.value;

  if (!password.trim()) {
    showError(
      passwordInput,
      "Vui lòng nhập mật khẩu."
    );

    return false;
  }

  if (
    password !==
    password.trim()
  ) {
    showError(
      passwordInput,
      "Mật khẩu không được có khoảng trắng ở đầu hoặc cuối."
    );

    return false;
  }

  if (/\s/.test(password)) {
    showError(
      passwordInput,
      "Mật khẩu không được chứa khoảng trắng."
    );

    return false;
  }

  if (
    !passwordRegex.test(password)
  ) {
    showError(
      passwordInput,
      "Mật khẩu phải từ 8-32 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*)."
    );

    return false;
  }

  clearError(passwordInput);

  return true;
}

function validateLoginForm() {
  const isUsernameValid =
    validateUsername();

  const isPasswordValid =
    validatePassword();

  return (
    isUsernameValid &&
    isPasswordValid
  );
}

// ================================
// 1. TỰ ĐỘNG CHUYỂN NẾU ĐÃ ĐĂNG NHẬP
// ================================

const existedUser = localStorage.getItem("user");
const existedToken = localStorage.getItem("token");

if (existedUser && existedToken) {

  try {
    const u =
      JSON.parse(existedUser);

    console.log(
      "🔹 User đã đăng nhập:",
      u
    );

    const path =
      window.location.pathname;

    const isLoginPage =
      path.endsWith(
        "dangnhap.html"
      ) ||
      path === "/" ||
      path === "" ||
      path.endsWith(
        "/frontend/"
      );

    if (isLoginPage) {
      redirectByRole(u);
    }
  } catch (error) {
    console.error(
      "❌ Lỗi đọc user từ localStorage:",
      error
    );

    localStorage.removeItem(
      "user"
    );
  }
}

// ================================
// 2. REALTIME VALIDATION
// ================================
const form =
  document.getElementById(
    "loginForm"
  );

const usernameInput =
  document.getElementById(
    "username"
  );

const passwordInput =
  document.getElementById(
    "password"
  );

if (usernameInput) {
  usernameInput.addEventListener(
    "blur",
    validateUsername
  );

  usernameInput.addEventListener(
    "input",
    () => {
      if (
        usernameInput.value.trim()
      ) {
        validateUsername();
      } else {
        clearError(
          usernameInput
        );
      }
    }
  );
}

if (passwordInput) {
  passwordInput.addEventListener(
    "blur",
    validatePassword
  );

  passwordInput.addEventListener(
    "input",
    () => {
      if (passwordInput.value) {
        validatePassword();
      } else {
        clearError(
          passwordInput
        );
      }
    }
  );
}

// ================================
// 3. XỬ LÝ ĐĂNG NHẬP
// ================================
if (!form) {
  console.error(
    "❌ Không tìm thấy form #loginForm"
  );
} else {
  form.addEventListener(
    "submit",
    async (e) => {
      e.preventDefault();

      if (!validateLoginForm()) {
        return;
      }

      const ten_dang_nhap =
        usernameInput.value.trim();

      const mat_khau =
        passwordInput.value;

      try {
        const res =
          await fetch(
            "http://localhost:3000/api/auth/login",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                ten_dang_nhap,
                mat_khau
              })
            }
          );

        const data =
          await res.json();

        console.log(
          "🔹 Kết quả từ server:",
          data
        );

        if (!res.ok) {
          if (
            data.field ===
            "ten_dang_nhap"
          ) {
            showError(
              usernameInput,
              data.message ||
              "Tài khoản không hợp lệ"
            );
          } else if (
            data.field ===
            "mat_khau"
          ) {
            showError(
              passwordInput,
              data.message ||
              "Mật khẩu không hợp lệ"
            );
          } else {
            alert(
              "❌ " +
              (
                data.message ||
                "Đăng nhập thất bại"
              )
            );
          }

          return;
        }

        if (
          !data.user ||
          !data.user.vai_tro
        ) {
          alert(
            "⚠ Server chưa trả về đầy đủ thông tin người dùng!"
          );

          return;
        }


        if (!data.token) {
          alert("Server chưa trả về token xác thực!");
          return;
        }

        // Lưu thông tin người dùng
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        // Lưu JWT để sử dụng cho các API cần xác thực
        localStorage.setItem(
          "token",
          data.token
        );


        alert(
          "✅ Đăng nhập thành công!"
        );

        console.log(
          "User lưu vào localStorage:",
          data.user
        );

        redirectByRole(
          data.user
        );
      } catch (err) {
        console.error(
          "❌ Lỗi API:",
          err
        );

        alert(
          "⚠ Không kết nối được server!"
        );
      }
    }
  );
}