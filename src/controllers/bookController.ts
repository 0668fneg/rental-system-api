// /src/controllers/bookController.ts

import { db } from '../db/db.ts';
import { books, rentalSessions } from '../db/schema.ts';
import { and, eq, sql, isNull } from 'drizzle-orm';

// ----------------------------------------------------
// 1. 新增書籍 (Controller)
// ----------------------------------------------------
export async function addBook(title: string, author: string, stock: number) {
    if (!title || !author || stock === undefined || isNaN(stock) || stock < 0) {
        return { error: 'Invalid input for book fields.', status: 400 };
    }
    
    const [newBook] = await db.insert(books).values({
        title: title,
        author: author,
        stock: stock,
    }).returning();

    return { book: newBook, status: 201 };
}

// ----------------------------------------------------
// 2. 獲取書籍列表 (Controller)
// ----------------------------------------------------
export async function getAllBooks() {
    const allBooks = await db.select().from(books);
    
    return { books: allBooks, status: 200 };
}

// ----------------------------------------------------
// 3. 租借書籍 (Controller)
// ----------------------------------------------------
export async function rentBook(userId: number, bookId: number) {
    // 檢查輸入是否為有效數字
    if (isNaN(userId) || isNaN(bookId)) {
        return { error: 'Invalid User ID or Book ID.', status: 400 };
    }

    let result = { error: 'Internal Server Error', status: 500 };
    
    // 使用 Drizzle Transaction 確保原子性
    await db.transaction(async (tx) => {
        
        // 1. 查找書籍並檢查庫存 (邏輯來自我們之前在 index.ts 中的程式碼)
        const [book] = await tx.select().from(books)
                               .where(eq(books.id, bookId))
                               .limit(1);

        if (!book) {
            result = { error: 'Book not found.', status: 404 };
            tx.rollback();
            return; 
        }

        if (book.stock <= 0) {
            result = { error: 'Book is out of stock.', status: 409 };
            tx.rollback();
            return;
        }

        // 2. 檢查重複租借
        const [existingRental] = await tx.select()
                                         .from(rentalSessions)
                                         .where(and(
                                             eq(rentalSessions.userId, userId),
                                             eq(rentalSessions.bookId, bookId),
                                             isNull(rentalSessions.returnTime),
                                         ))
                                         .limit(1);
        
        if (existingRental) {
            result = { error: 'User is already renting this book.', status: 409 };
            tx.rollback();
            return;
        }

        // 3. 執行租借 (a: 插入租借記錄)
        const checkoutTime = new Date();
        const dueTime = new Date(checkoutTime.getTime());
        dueTime.setDate(dueTime.getDate() + 7); // 預設借期 7 天

        const [newRental] = await tx.insert(rentalSessions).values({
            userId,
            bookId,
            checkoutTime,
            dueTime,
        }).returning();

        // 4. 執行租借 (b: 減少庫存)
        await tx.update(books)
                .set({ stock: sql`${books.stock} - 1` }) 
                .where(eq(books.id, bookId));

        // 成功，設置結果
        result = { rental: newRental, status: 201 };
    });
    
    return result; 
}
