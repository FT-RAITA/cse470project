import express from "express";
import {
  getActivities,
  getActivitiesByElder,
  createActivity,
  completeActivity,
  deleteActivity,
} from "../controllers/activityController.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("caregiver", "admin"));

router.get("/activities", getActivities);
router.get("/activities/:elderId", getActivitiesByElder);
router.post("/activities", createActivity);
router.put("/activities/:id/complete", completeActivity);
router.delete("/activities/:id", deleteActivity);

export default router;
