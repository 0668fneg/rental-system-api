import {
  pgTable,
  serial,
  varchar,
  timestamp,
  numeric,
  integer,
  // 引入 Drizzle 的 enum 相關工具
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ------------------------------------------
// 1. 定義 Status Enum (練習在停車場專案中遇到的狀態機)
// ------------------------------------------

// 目的: 限制 RentalSession 的 status 只能是這三個值，避免輸入錯誤。
// 作用: 在資料庫層級保證數據一致性，並在 TypeScript 程式碼中提供強型別。
export const rentalStatusEnum = pgEnum('rental_status', [
  'rented', // 已借出
  'returned', // 已歸還
  'overdue', // 逾期未歸還
]);


// ------------------------------------------
// 2. User (用戶) 資料表
// ------------------------------------------
export const users = pgTable('users', {
  id: serial('id').primaryKey(), // serial: 自動遞增主鍵
  name: varchar('name', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }).notNull().unique(), // email 應該是唯一的
  passwordHash: varchar('password_hash', { length: 256 }).notNull(),
  // 使用 numeric 類型來儲存餘額，確保小數點精度
  balance: numeric('balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


// ------------------------------------------
// 3. Book (圖書) 資料表
// ------------------------------------------
export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 256 }).notNull(),
  author: varchar('author', { length: 256 }).notNull(),
  // 庫存量，用於在借出/歸還時更新
  stock: integer('stock').notNull().default(0), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


// ------------------------------------------
// 4. RentalSession (租借會話) 資料表 (核心業務邏輯)
// ------------------------------------------
export const rentalSessions = pgTable('rental_sessions', {
  id: serial('id').primaryKey(),

  // 外鍵：關聯到 users 表。onDelete('cascade') 表示如果用戶被刪除，其租借記錄也應刪除。
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // 外鍵：關聯到 books 表。
  bookId: integer('book_id').references(() => books.id).notNull(),

  // 業務時間戳
  checkoutTime: timestamp('checkout_time').defaultNow().notNull(),
  dueTime: timestamp('due_time').notNull(), // 應歸還時間
  returnTime: timestamp('return_time'), // 實際歸還時間 (可空)

  // 使用我們定義的 enum 確保狀態有效
  status: rentalStatusEnum('status').notNull().default('rented'),

  // 逾期費用 (與停車場的 total_fee 概念相似)
  overdueFee: numeric('overdue_fee', { precision: 10, scale: 2 }).default('0.00').notNull(),
}, (table) => {
    return {
        // 建立索引：方便快速查詢某個用戶的所有租借記錄
        userIdIdx: index("user_id_idx").on(table.userId),
        
        // 建立索引：方便快速查詢當前所有未歸還/逾期的記錄 (按狀態)
        statusIdx: index("status_idx").on(table.status),
    }
});
