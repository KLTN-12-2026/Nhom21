require("dotenv").config();
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
const tongQuanRoutes = require("./routes/tong-quan.routes");
//const coSoRoutes = require("./routes/co-so.routes");
// ================================
// MIDDLEWARE
// ================================
app.use(cors());
app.use(express.json());

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

console.log("KIỂM TRA ROUTER");

// Xác thực và người dùng
app.use("/api/auth", xacThucRoutes);
app.use("/api/users", nguoiDungRoutes);
app.use("/api/tong-quan", tongQuanRoutes);

// Thông tin cá nhân
app.use("/api/profile", thongTinCaNhanRoutes);

// Cơ sở tiêm chủng
//app.use("/api/coso", coSoRoutes);
// ================================
// ROUTE TEST BACKEND
// ================================
app.get("/", (req, res) => {
    res.send("Backend vaccine-app đang chạy...");
});
module.exports = app;
