const path = require("path");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

// Đọc file backend/.env
dotenv.config({
    path: path.resolve(__dirname, "../../.env")
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;