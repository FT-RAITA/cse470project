import express from "express";
import { getDailyRoutine } from "../controllers/dailyRoutineController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/elders/:elderId/daily-routine", getDailyRoutine);

export default router;