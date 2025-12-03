
import { Hono } from 'hono';
import * as bookController from '../controllers/bookController.ts'; // ⬅️ 確保導入 controller

export const rentalsRouter = new Hono();

// 處理 POST /rentals 的請求
rentalsRouter.post('/', async (c) => {
    const { userId, bookId } = await c.req.json();
    const result = await bookController.rentBook(parseInt(userId, 10), parseInt(bookId, 10));

    if (result.error) {
        return c.json({ error: result.error }, result.status);
    }
    return c.json({ message: 'Book rented successfully!', rental: result.rental }, result.status);
});

// 未來的歸還 API (POST /rentals/return) 也會放在這裡
// rentalsRouter.post('/return', ...)