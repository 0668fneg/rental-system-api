// src/controllers/bookController.ts
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/db';
import { books } from '../db/schema';

// 1. 獲取所有書籍列表
export const getAllBooks = async (c: Context) => {
    try {
        // 🚨 這裡使用 Drizzle 語法：選擇所有書籍
        const bookList = await db.select().from(books);

        return c.json({
            message: 'Successfully retrieved book list.',
            books: bookList,
            count: bookList.length
        }, 200);

    } catch (error) {
        console.error('Error fetching book list:', error);
        throw new HTTPException(500, { message: 'Failed to fetch book list.' });
    }
};

// 2. 創建書籍 (POST /books)
export const createBook = async (c: Context) => {
    const { title, author, stock } = await c.req.json();
    
    // 簡單的輸入驗證
    if (!title || !author || typeof stock !== 'number' || stock < 0) {
        throw new HTTPException(400, { message: 'Invalid input for creating book.' });
    }

    try {
        const [newBook] = await db.insert(books).values({
            title: title,
            author: author,
            stock: stock,
            createdAt: new Date()
        }).returning();

        return c.json({
            message: 'Book added successfully!',
            book: newBook
        }, 201);
    } catch (error) {
        console.error('Error creating book:', error);
        throw new HTTPException(500, { message: 'Failed to create book.' });
    }
};