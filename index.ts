
import { Hono } from 'hono';
import { usersRouter } from './src/routes/users.ts';
import { booksRouter } from './src/routes/books.ts'; 
import { rentalsRouter } from './src/routes/rentals.ts';
import { logger } from 'hono/logger';
import { dbPool } from './src/db/db.ts'; // 用於伺服器關閉時關閉連接池

// 載入環境變數
import * as dotenv from 'dotenv';
dotenv.config();

const app = new Hono();
app.use('*', logger());


// 1. 根路由 
// ----------------------------------------------------
app.get('/', (c) => {
  return c.text('Welcome to the Rental System API!');
});


// 2. 路由註冊
// ----------------------------------------------------
// 將 users.ts 中的所有路由掛載到 /users 路徑下
app.route('/users', usersRouter); 
app.route('/books', booksRouter); 
app.route('/rentals', rentalsRouter);



// 3. 伺服器啟動 (保持不變)
// ----------------------------------------------------
// ... (啟動伺服器的程式碼保持不變)

// 服務器優雅關閉邏輯 (可選，但推薦)
// process.on('SIGTERM', () => {
//     console.log('SIGTERM signal received: closing HTTP server');
//     // 關閉資料庫連接池
//     dbPool.end(() => {
//         console.log('PostgreSQL pool disconnected.');
//     });
//     // 這裡 Hono 的伺服器本身在 Bun 環境下不需要明確關閉
// });

console.log(`Server is running on http://localhost:3000`);
export default app;