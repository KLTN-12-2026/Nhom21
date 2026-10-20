
// backend/src/server.js

require("dotenv").config();

const app = require("./app");

// ================================
// CẤU HÌNH PORT
// ================================
const PORT = process.env.PORT || 3000;

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
    console.log(
        `🚀 Backend đang chạy tại: http://localhost:${PORT}`
    );
});
