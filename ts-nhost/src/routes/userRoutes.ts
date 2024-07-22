import { Router } from "express";
import {
  createUser,
  getAllUsers,
  deleteUser,
} from "../controllers/userController";

const router = Router();

router.post("/", createUser);
router.get("/", getAllUsers);
router.delete("/:id", deleteUser);

export default router;
