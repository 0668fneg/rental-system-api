

import { Hono } from 'hono';
import { registerUser, loginUser } from '../controllers/userController.ts'; // ⬅️ 導入 Controller 函式

export const usersRouter = new Hono();

// 1. 用戶註冊 API (POST /users/register)
usersRouter.post('/register', async (c) => {
    const { name, email, password } = await c.req.json();

    // 接收數據後，將業務邏輯全部交給 Controller
    const result = await registerUser(name, email, password);

    // 根據 Controller 返回的狀態決定 HTTP 響應
    if (result.error) {
        return c.json({ error: result.error }, result.status);
    }

    return c.json({ message: 'Registration successful!', user: result.user }, result.status);
});

// 2. 用戶登入 API (POST /users/login)
usersRouter.post('/login', async (c) => {
    // ... (同樣的模式：接收數據 -> 調用 Controller -> 構造響應)
});