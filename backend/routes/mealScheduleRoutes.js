import express from "express";
import {
  createMealSchedule,
    updateMealSchedule,
    deleteMealSchedule,
    getMealSchedulesByElder
} from "../controllers/mealScheduleController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/meal-schedules", authMiddleware, createMealSchedule);
router.get("/meal-schedules/elder/:elderid", authMiddleware, getMealSchedulesByElder);
router.put("/meal-schedules/:mealid", authMiddleware, updateMealSchedule);
router.delete("/meal-schedules/:mealid", authMiddleware, deleteMealSchedule);

export default router;