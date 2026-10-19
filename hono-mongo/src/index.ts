import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { DB } from './utils/DB.js'
import { Book } from './models/Book.Model.js'


const app = new Hono()


DB()

// Get all books
app.get("/books", async (c) => {
  try {
    const books = await Book.find();
    return c.json(books);
  } catch (error) {
    return c.json({ message: "Error fetching books"}, 500);
  }
});

// Get a single book by ID
app.get("/books/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const book = await Book.findById(id);
    if (!book) {
      return c.json({ message: "Book not found" }, 404);
    }
    return c.json(book);
  } catch (error) {
    return c.json({ message: "Error fetching the book"}, 500);
  }
});

// Update a book by ID
app.put("/books/:id", async (c) => {
  const { id } = c.req.param();
  const updates = await c.req.json();
  try {
    const book = await Book.findByIdAndUpdate(id, updates, { new: true });
    if (!book) {
      return c.json({ message: "Book not found" }, 404);
    }
    return c.json(book);
  } catch (error) {
    return c.json({ message: "Error updating the book"}, 500);
  }
});

// Delete a book by ID
app.delete("/books/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const book = await Book.findByIdAndDelete(id);
    if (!book) {
      return c.json({ message: "Book not found" }, 404);
    }
    return c.json({ message: "Book deleted successfully" });
  } catch (error) {
    return c.json({ message: "Error deleting the book"}, 500);
  }
});

// Root route
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
