import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  getMyPerformanceDashboard,
  getLeaderboard,
  getWeeklyWinner,
  getActivityFeed,
  downloadPerformanceReport,
} from "../controllers/caregiverPerformanceController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("caregiver", "admin"));

router.get("/caregiver-performance/dashboard", getMyPerformanceDashboard);
router.get("/caregiver-performance/leaderboard", getLeaderboard);
router.get("/caregiver-performance/weekly-winner", getWeeklyWinner);
router.get("/caregiver-performance/activity", getActivityFeed);
router.get("/caregiver-performance/report", downloadPerformanceReport);

export default router;
