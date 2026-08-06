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

router.get("/appointments/elders", getBookableElders);
router.get("/appointments/slots", getAvailableSlots);
router.get("/appointments/stats", getAppointmentStats);

router.post("/appointments", createAppointment);
router.get("/appointments", getAppointments);
router.get("/appointments/:id", getAppointmentById);

router.patch("/appointments/:id/status", updateAppointmentStatus);
router.put(
  "/appointments/:id",
  requireRole("caregiver", "admin"),
  updateAppointment
);

export default router;
