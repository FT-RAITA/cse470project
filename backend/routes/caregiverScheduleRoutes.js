import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  generateNextDaySchedule,
  getSchedule,
  updateScheduleAvailability,
} from "../controllers/caregiverScheduleController.js";

const router = express.Router();

router.use(authMiddleware, requireRole("caregiver"));
router.get("/", getSchedule);
router.post("/generate-next-day", generateNextDaySchedule);
router.patch("/availability", updateScheduleAvailability);

export default router;
