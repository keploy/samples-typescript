import mongoose from "mongoose";
import request from "supertest";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Book } from "../models/Book.Model.js"; // Update this to your actual path
import { DB } from "../utils/DB.js"; // Update this to your actual path

let server;

// Initialize DB and App
beforeAll(async () => {
  await DB(); // Connect to the database

  const app = new Hono();

  // Define the API routes
  app.get("/books", async (c) => {
    const books = await Book.find();
    return c.json(books);
  });

  app.get("/books/:id", async (c) => {
    const { id } = c.req.param();
    const book = await Book.findById(id);
    if (!book) {
      return c.json({ message: "Book not found" }, 404);
    }
    return c.json(book);
  });

  app.put("/books/:id", async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const book = await Book.findByIdAndUpdate(id, updates, { new: true });
    if (!book) {
      return c.json({ message: "Book not found" }, 404);
    }
    return c.json(book);
  });

  app.delete("/books/:id", async (c) => {
    const { id } = c.req.param();
    const book = await Book.findByIdAndDelete(id);
    if (!book) {
      return c.json({ message: "Book not found" }, 404);
    }
    return c.json({ message: "Book deleted successfully" });
  });

  server = serve({ fetch: app.fetch, port: 0 });
});

afterAll(async () => {
  await mongoose.connection.close(); // Close the database connection
  server.close(); // Stop the server
});

describe("Books API", () => {
  let testBook;

  beforeEach(async () => {
    // Add a test book to the database
    testBook = await Book.create({
      name: "Test Book",
      description: "A test book description",
      author: "Test Author",
      rating: 4,
    });
  });

  afterEach(async () => {
    // Clean up the database
    await Book.deleteMany({});
  });

  it("should fetch all books", async () => {
    const res = await request(server).get("/books");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Test Book");
  });

  it("should fetch a single book by ID", async () => {
    const res = await request(server).get(`/books/${testBook._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Test Book");
  });

  it("should return 404 for a non-existent book", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(server).get(`/books/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Book not found");
  });

  it("should update a book", async () => {
    const updates = { name: "Updated Test Book" };
    const res = await request(server).put(`/books/${testBook._id}`).send(updates);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Updated Test Book");
  });

  it("should delete a book", async () => {
    const res = await request(server).delete(`/books/${testBook._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Book deleted successfully");

    const check = await Book.findById(testBook._id);
    expect(check).toBeNull();
  });
});
