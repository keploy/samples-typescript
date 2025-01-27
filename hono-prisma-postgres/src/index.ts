import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  register,
  login,
  authMiddleware,
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
  testResponse,
} from "./handlers/todoHandler";

const app = new Hono();

// Middleware
app.use("/*", cors());

// Auth routes
app.get("/", testResponse);
app.post("/register", register);
app.post("/login", login);

// Protected todo routes
app.post("/todos", authMiddleware, createTodo);
app.get("/todos", authMiddleware, getTodos);
app.put("/todos", authMiddleware, updateTodo);
app.delete("/todos", authMiddleware, deleteTodo);

export default app;
