import express from "express";
import {
  getDoctorAppointments,
  getDoctorAppointmentsByElder,
  createDoctorAppointment,
  updateDoctorAppointmentStatus,
  deleteDoctorAppointment,
} from "../controllers/doctorAppointmentController.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("caregiver", "admin"));

router.get("/doctor-appointments", getDoctorAppointments);
router.get("/doctor-appointments/:elderId", getDoctorAppointmentsByElder);
router.post("/doctor-appointments", createDoctorAppointment);
router.put("/doctor-appointments/:id/status", updateDoctorAppointmentStatus);
router.delete("/doctor-appointments/:id", deleteDoctorAppointment);

export default router;