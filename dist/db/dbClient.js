"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
const pg_1 = require("pg");
const dotenv = require("dotenv");
// 로컬 환경에서만 .env 파일 로드
if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "dev") {
    dotenv.config();
    console.log("tt");
}
const pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }, // RDS에서는 보통 SSL 필요
});
const query = async (text, params) => {
    const client = await pool.connect();
    try {
        return await client.query(text, params);
    }
    finally {
        client.release();
    }
};
exports.query = query;
