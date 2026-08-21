import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {getTodayTasks, regenerateForElder, completeTask, } from "../controllers/taskController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/tasks/today", getTodayTasks);
router.post("/tasks/generate/:elderId", regenerateForElder);
router.patch("/tasks/:id/complete", completeTask);

export default router;