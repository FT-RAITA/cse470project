import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

import {
  getBookableElders,
  getAvailableSlots,
  createAppointment,
  getAppointments,
  getAppointmentById,
  getAppointmentStats,
  updateAppointmentStatus,
  updateAppointment,
} from "../controllers/appointmentController.js";

const router = express.Router();

router.use(authMiddleware);

// GET
router.get("/elders", getBookableElders);
router.get("/slots", getAvailableSlots);
router.get("/stats", getAppointmentStats);
router.get("/", getAppointments);
router.get("/:id", getAppointmentById);

// POST
router.post("/", createAppointment);

// PATCH
router.patch("/:id/status", updateAppointmentStatus);

// PUT
router.put(
  "/:id",
  requireRole("caregiver", "admin"),
  updateAppointment
);

export default router;
