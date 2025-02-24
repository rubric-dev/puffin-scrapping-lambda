import { Pool } from "pg";
import * as dotenv from "dotenv";

// 로컬 환경에서만 .env 파일 로드
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }, // RDS에서는 보통 SSL 필요
});

export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};
