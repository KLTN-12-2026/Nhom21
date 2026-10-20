// backend/src/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ================================
// IMPORT ROUTES
// ================================
const xacThucRoutes = require("./routes/xac-thuc.routes");
const nguoiDungRoutes = require("./routes/nguoi-dung.routes");
const thongTinCaNhanRoutes = require("./routes/thong-tin-ca-nhan.routes");
// Chưa kích hoạt - giữ nguyên trạng thái hiện tại
// const thongBaoRoutes = require("./routes/thong-bao.routes");
const tongQuanRoutes = require("./routes/tong-quan.routes");

// ================================
// MIDDLEWARE
// ================================
app.use(cors());
app.use(express.json());

// ================================
// PHỤC VỤ FILE TĨNH FRONTEND
// ================================
app.use(
    express.static(
        path.join(__dirname, "../../frontend")
    )
);

app.get("/frontend/:page", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "../../frontend",
            req.params.page
        )
    );
});

// ================================
// MAPPING ROUTES
// GIỮ NGUYÊN URL API HIỆN TẠI
// ================================

console.log("===== KIỂM TRA ROUTER =====");

// Xác thực và người dùng
app.use("/api/auth", xacThucRoutes);
app.use("/api/users", nguoiDungRoutes);
app.use("/api/tong-quan", tongQuanRoutes);

// Thông tin cá nhân
app.use("/api/profile", thongTinCaNhanRoutes);


// ================================
// ROUTE TEST BACKEND
// ================================
app.get("/", (req, res) => {
    res.send("Backend vaccine-app đang chạy...");
});

// ================================
// EXPORT APP
// ================================
module.exports = app;
