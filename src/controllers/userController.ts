// /src/controllers/userController.ts

import { db } from '../db/db.ts'; // ⬅️ 導入數據庫連接
import { users } from '../db/schema.ts'; // ⬅️ 導入 Schema
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

// 註冊業務邏輯
export async function registerUser(name: string, email: string, password: string) {
    // 1. 查找用戶是否存在 (業務邏輯)
    const [existingUser] = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (existingUser) {
        // 返回一個標準化的錯誤物件，Controller 不處理 HTTP 響應
        return { error: 'User with this email already exists.', status: 409 }; 
    }

    // 2. 雜湊密碼 (業務邏輯)
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. 插入新用戶 (業務邏輯)
    const [newUser] = await db.insert(users).values({
        name: name,
        email: email,
        passwordHash: passwordHash,
    }).returning({
        id: users.id,
        email: users.email,
        name: users.name,
    });
    
    // 返回成功結果
    return { user: newUser, status: 201 };
}

// 登入業務邏輯
export async function loginUser(email: string, password: string) {
    // ... 登入的邏輯 (查找用戶、bcrypt.compare 等)
    // ...
}