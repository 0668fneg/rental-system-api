// src/controllers/rentalController.ts
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/db';
import { books, rentalSessions } from '../db/schema';
import { eq, isNull, sql } from 'drizzle-orm'; // Drizzle 提供的查詢輔助函式

// 計算到期日：預設借期 7 天
const calculateDueTime = (checkoutTime: Date): Date => {
    const dueTime = new Date(checkoutTime);
    dueTime.setDate(dueTime.getDate() + 7); // 增加 7 天
    return dueTime;
};

// =======================================================
// 1. 租借書籍邏輯 (原 bookController.rentBook 的升級版)
// =======================================================

export const createRental = async (c: Context) => {
    // 獲取並解析請求體中的數據
    const { userId, bookId } = await c.req.json();
    const parsedUserId = parseInt(userId, 10);
    const parsedBookId = parseInt(bookId, 10);
    const checkoutTime = new Date();
    const dueTime = calculateDueTime(checkoutTime);

    // 驗證輸入
    if (isNaN(parsedUserId) || isNaN(parsedBookId)) {
        throw new HTTPException(400, { message: 'Invalid User ID or Book ID format.' });
    }

    try {
        const newRental = await db.transaction(async (tx) => {
            
            // a. 查找書籍並檢查庫存
            const [book] = await tx.select().from(books)
                                    .where(eq(books.id, parsedBookId))
                                    .limit(1);

            if (!book) {
                // 📚 書籍不存在
                throw new HTTPException(404, { message: 'Book not found.' }); 
            }

            if (book.stock <= 0) {
                // 📚 庫存不足
                throw new HTTPException(409, { message: 'Book is out of stock.' }); 
            }
            
            // b. 檢查是否已有未歸還的租借記錄
            const [existingRental] = await tx.select().from(rentalSessions)
                                              .where(sql`${rentalSessions.userId} = ${parsedUserId} AND ${rentalSessions.bookId} = ${parsedBookId} AND ${rentalSessions.returnTime} IS NULL`)
                                              .limit(1);
            
            if (existingRental) {
                // 📚 重複租借
                throw new HTTPException(409, { message: 'User is already renting this book and has not returned it.' });
            }

            // c. 更新庫存（庫存 - 1）
            await tx.update(books)
                    .set({ stock: sql`${books.stock} - 1` })
                    .where(eq(books.id, parsedBookId));

            // d. 插入租借記錄
            const [rentalRecord] = await tx.insert(rentalSessions).values({
                userId: parsedUserId,
                bookId: parsedBookId,
                checkoutTime: checkoutTime,
                dueTime: dueTime,
                status: 'rented'
            }).returning();
            
            return rentalRecord;
        });

        // 成功響應 (201 Created)
        return c.json({ message: 'Book rented successfully!', rental: newRental }, 201);
        
    } catch (error) {
        // 如果是 HTTPException，直接重新拋出讓 Hono 處理
        if (error instanceof HTTPException) {
            throw error;
        }
        // 否則，捕獲未預期的系統錯誤
        console.error('Create rental error:', error);
        throw new HTTPException(500, { message: 'Internal Server Error during rental process.' });
    }
};


// =======================================================
// 2. 歸還書籍邏輯 (我們接下來要做的)
// =======================================================

export const returnBook = async (c: Context) => {
    // 📢 此處為我們上一個回覆中提供的 returnBook 函式程式碼
    // 請將那段程式碼貼到這裡，確保所有邏輯是正確的。
    
    const rentalId = c.req.param('rentalId');
    const parsedRentalId = parseInt(rentalId);

    // 驗證 ID
    if (isNaN(parsedRentalId)) {
        throw new HTTPException(400, { message: 'Invalid rental ID format.' });
    }

    // ... (請將 returnBook 的核心邏輯貼到這裡) ...

    // 由於篇幅限制，請確保您將上一個回覆中的 returnBook 邏輯貼到這裡
    try {
        const updatedRental = await db.transaction(async (tx) => {
            // ... 查找記錄、檢查是否歸還、計算費用 ...
            const rental = await tx.select().from(rentalSessions)
                .where(eq(rentalSessions.id, parsedRentalId)).limit(1);

            const session = rental[0];

            if (!session) {
                throw new HTTPException(404, { message: 'Rental session not found.' });
            }

            if (session.returnTime) {
                throw new HTTPException(409, { message: 'This book has already been returned.' });
            }
            // ... (計算逾期費用邏輯) ...
            
            const currentTime = new Date();
            let overdueFee = 0;
            // 假設逾期每天罰款 5 元
            if (currentTime > session.dueTime) {
                const overdueTimeMs = currentTime.getTime() - session.dueTime.getTime();
                const daysOverdue = Math.ceil(overdueTimeMs / (1000 * 60 * 60 * 24));
                overdueFee = daysOverdue * 5;
            }

            // 更新租借記錄
            const updateResult = await tx.update(rentalSessions)
                .set({
                    returnTime: currentTime,
                    status: 'returned',
                    overdueFee: overdueFee
                })
                .where(eq(rentalSessions.id, parsedRentalId))
                .returning();
            
            // 更新書籍庫存（庫存 + 1）
            await tx.update(books)
                .set({ stock: sql`${books.stock} + 1` })
                .where(eq(books.id, session.bookId));

            return updateResult[0];
        });

        // 返回成功響應 (200 OK)
        return c.json({
            message: 'Book successfully returned.',
            rental: updatedRental
        }, 200);

    } catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        console.error('Return book error:', error);
        throw new HTTPException(500, { message: 'Internal Server Error during book return.' });
    }
};
