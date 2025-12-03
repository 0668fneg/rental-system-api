import { Hono } from 'hono';
import { createBook, getAllBooks } from '../controllers/bookController.ts';

export const booksRouter = new Hono();

// 1. 新增書籍 API (POST /books)
booksRouter.post('/', createBook);

// 2. 獲取書籍列表 API (GET /books)
booksRouter.get('/', getAllBooks);

export default booksRouter;