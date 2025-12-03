// /src/db/db.ts

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema'; // 從同一個資料夾導入 schema.ts

// 載入環境變數（雖然在 index.ts 也載入了，這裡再載入一次確保獨立運行時也能工作）
dotenv.config();

// 創建 PostgreSQL 連接池
// 連接字串來自 .env 檔案
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// 使用連接池創建 Drizzle 客戶端實例
// 傳入 schema 讓 Drizzle 能夠提供強型別
export const db = drizzle(pool, { schema, logger: true });

// 導出連接池，用於程式優雅退出時關閉連接
export const dbPool = pool;