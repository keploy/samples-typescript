import { Hono } from "hono";
import { addTodo,toggleTodoStatus,deleteTodo,getTodos } from "../controllers/todoController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const todoRoutes = new Hono();

todoRoutes.use(authMiddleware);

todoRoutes.post("/add-todo", addTodo);
todoRoutes.get("/get-todos", getTodos);
todoRoutes.put("/toggle-todo-status", toggleTodoStatus);
todoRoutes.delete("/delete-todo", deleteTodo);

export default todoRoutes;







