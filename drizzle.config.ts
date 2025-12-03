// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// 作用: 載入 .env 檔案中的變數，讓 drizzle-kit 能夠讀取 DATABASE_URL
dotenv.config(); 

export default defineConfig({
    dialect: 'postgresql',
    schema: "./src/db/schema.ts", // 指定 Schema 檔案的路徑
    out: "./drizzle", // 指定 Drizzle 產生的 Migration 檔案的存放資料夾
    dbCredentials: {
        url: process.env.DATABASE_URL!, // 告訴 Drizzle 使用 .env 中讀取的 DATABASE_URL
    },
    // 讓 Drizzle 知道我們的 schema 使用了 enum
    // 如果您在 schema 中沒有使用 enum，可以省略此行
    // checks: {
    //     force: true, // 强制执行数据库检查
    // },
});