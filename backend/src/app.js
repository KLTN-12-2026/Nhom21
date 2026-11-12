require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
// IMPORT ROUTES
const xacThucRoutes = require("./routes/xac-thuc.routes");
const nguoiDungRoutes = require("./routes/nguoi-dung.routes");
const lichTiemRoutes = require("./routes/lich-tiem.routes");
const vaccineRoutes = require("./routes/vaccine.routes");
const thongTinCaNhanRoutes = require("./routes/thong-tin-ca-nhan.routes");
const tongQuanRoutes = require("./routes/tong-quan.routes");
const coSoRoutes = require("./routes/co-so.routes");
const danhGiaRoutes = require("./routes/danh-gia.routes");
const khamSangLocRoutes = require("./routes/kham-sang-loc.routes");

// MIDDLEWARE
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

// MAPPING ROUTES
console.log("KIỂM TRA ROUTER");

// Xác thực và người dùng
app.use("/api/auth", xacThucRoutes);
app.use("/api/users", nguoiDungRoutes);
app.use("/api/tong-quan", tongQuanRoutes);

// Lịch tiêm và hồ sơ tiêm
app.use("/api/lich", lichTiemRoutes);

// Thông tin cá nhân
app.use("/api/profile", thongTinCaNhanRoutes);

// Vaccine và bảng giá
app.use("/api/vaccine", vaccineRoutes);
app.use("/api/prices", bangGiaVaccineRoutes);
app.use("/api/lo-vaccine", loVaccineRoutes);

// Cơ sở tiêm chủng
app.use("/api/coso", coSoRoutes);
app.use("/api/danhgia", danhGiaRoutes);

// File tải lên
app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"))
);

// Khám sàn lọc
app.use("/api/kham-sang-loc", khamSangLocRoutes);


// ROUTE TEST BACKEND
app.get("/", (req, res) => {
    res.send("Backend vaccine-app đang chạy...");
});
module.exports = app;