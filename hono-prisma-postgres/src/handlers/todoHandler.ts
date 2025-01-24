import { Context } from "hono";
import { PrismaClient } from "@prisma/client";
import { sign, verify } from "jsonwebtoken";
import { compare, hash } from "bcrypt";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Auth middleware
export const authMiddleware = async (c: Context, next: Function) => {
  const token = c.req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string };
    c.set("userId", decoded.userId);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
};

// Auth handlers
export const register = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return c.json({ error: "Email already exists" }, 400);
    }

    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const token = sign({ userId: user.id }, JWT_SECRET);
    return c.json({ token });
  } catch (error) {
    return c.json({ error: "Registration failed" }, 500);
  }
};

export const login = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return c.json({ error: "Invalid password" }, 401);
    }

    const token = sign({ userId: user.id }, JWT_SECRET);
    return c.json({ token });
  } catch (error) {
    return c.json({ error: "Login failed" }, 500);
  }
};

// Todo handlers
export const testResponse = async (c: Context) => {
  return c.json({ message: "Hello, world!" });
};

export const createTodo = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const { title } = await c.req.json();

    const todo = await prisma.todo.create({
      data: {
        title,
        userId,
      },
    });

    return c.json(todo);
  } catch (error) {
    return c.json({ error: "Failed to create todo" }, 500);
  }
};

export const getTodos = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const todos = await prisma.todo.findMany({
      where: { userId },
    });
    return c.json(todos);
  } catch (error) {
    return c.json({ error: "Failed to fetch todos" }, 500);
  }
};

export const updateTodo = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const todoId = c.req.query("id");
    const { title, completed } = await c.req.json();

    const todo = await prisma.todo.update({
      where: {
        id: todoId,
        userId,
      },
      data: {
        title,
        completed,
      },
    });

    return c.json(todo);
  } catch (error) {
    return c.json({ error: "Failed to update todo" }, 500);
  }
};

export const deleteTodo = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const todoId = c.req.query("id");

    await prisma.todo.delete({
      where: {
        id: todoId,
        userId,
      },
    });

    return c.json({ message: "Todo deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete todo" }, 500);
  }
};
