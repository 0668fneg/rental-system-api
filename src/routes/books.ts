
import { Hono } from 'hono';
import * as bookController from '../controllers/bookController.ts'; // ⬅️ 導入 Controller

export const booksRouter = new Hono();

// 1. 新增書籍 API (POST /books)
booksRouter.post('/', async (c) => {
    const { title, author, stock } = await c.req.json();
    const parsedStock = parseInt(stock, 10); // 確保 stock 是數字
    
    const result = await bookController.addBook(title, author, parsedStock);
    
    if (result.error) {
        return c.json({ error: result.error }, result.status);
    }
    return c.json({ message: 'Book added successfully!', book: result.book }, result.status);
});

// 2. 獲取書籍列表 API (GET /books)
booksRouter.get('/', async (c) => {
    const result = await bookController.getAllBooks();

    return c.json({ 
        message: 'Successfully retrieved book list.',
        books: result.books,
        count: result.books.length,
    }, result.status);
});

// 3. 租借書籍 API (POST /rentals)
booksRouter.post('/rentals', async (c) => {
    const { userId, bookId } = await c.req.json();

    const result = await bookController.rentBook(parseInt(userId, 10), parseInt(bookId, 10)); // 確保是數字

    if (result.error) {
        return c.json({ error: result.error }, result.status);
    }
    return c.json({ message: 'Book rented successfully!', rental: result.rental }, result.status);
});