import { Router } from "express";
import {
  getTodos,
  insertTodo,
  updateTodo,
  deleteTodo,
  createTable,
} from "../controllers/todoController";

const router = Router();

router.post("/createtable", createTable);
router.get("/", getTodos);
router.post("/", insertTodo);
router.put("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export default router;
