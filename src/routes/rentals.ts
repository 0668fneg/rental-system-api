// src/routes/rentals.ts (最終簡化版)

import { Hono } from 'hono';
import { createRental, returnBook } from '../controllers/rentalController.ts'; 

export const rentalsRouter = new Hono();

// POST /rentals - 創建租借記錄 (直接調用 createRental，錯誤會被 HTTPException 處理)
rentalsRouter.post('/', createRental);

// PATCH /rentals/:rentalId - 歸還書籍 (新的歸還路由)
rentalsRouter.patch('/:rentalId', returnBook);

// 導出路由
export default rentalsRouter;