import express, { Request, Response } from 'express';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';

const redisClient = new Redis({
    host: 'redis',
    port: 6379
});

redisClient.on('error', (err: any) => console.error('Redis Client Error', err));
redisClient.on('connect', () => {
    console.log('Connected to Redis server');
    loadSampleBooks();
});

const app = express();
const port = 3000;

app.use(express.json());

async function loadSampleBooks() {
    try {
        const existingBooks = await redisClient.keys('book:*');
        if (existingBooks.length === 0) {
            const sampleData = JSON.parse(fs.readFileSync(path.join(__dirname,"../", 'sample-books.json'), 'utf-8'));
            for (const book of sampleData.books) {
                await redisClient.set(`book:${book.id}`, JSON.stringify(book));
            }
            console.log('Sample books loaded into Redis');
        } else {
            console.log('Books already exist in Redis, skipping sample data load');
        }
    } catch (error) {
        console.error('Error loading sample books:', error);
    }
}

app.get('/books', async (_req: Request, res: Response) => {
    try {
        const keys = await redisClient.keys('book:*');
        const books = [];
        for (const key of keys) {
            const book = await redisClient.get(key);
            if (book) books.push(JSON.parse(book));
        }
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving books', error });
    }
});

app.get('/books/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const book = await redisClient.get(`book:${id}`);
        if (book) {
            res.status(200).json(JSON.parse(book));
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving the book', error });
    }
});

app.post('/publish', async (req: Request, res: Response) => {
    const { id, title, author } = req.body;
    if(!id){
        return res.status(400).json({ message: 'Missing id' });
    }
    if (!title || !author) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    try {
        await redisClient.set(`book:${id}`, JSON.stringify({ id, title, author }));
        res.status(201).json({ message: 'Book published successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error publishing the book', error });
    }
});

app.delete('/books/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const deleted = await redisClient.del(`book:${id}`);
        if (deleted) {
            res.status(200).json({ message: 'Book deleted successfully' });
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting the book', error });
    }
});

app.put('/book/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, author } = req.body;
    try {
        const book = await redisClient.get(`book:${id}`);
        if (book) {
            const updatedBook = JSON.parse(book);
            if (title) updatedBook.title = title;
            if (author) updatedBook.author = author;
            await redisClient.set(`book:${id}`, JSON.stringify(updatedBook));
            res.status(200).json({ message: 'Book updated successfully' });
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating the book', error });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});