import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  getMedicationDashboard,
  createCareMedication,
  updateCareMedication,
  discontinueCareMedication,
  deleteCareMedication,
  updateDoseStatus,
  updateInventory,
} from "../controllers/medicationManagementController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("caregiver", "admin"));

router.get("/elders/:id/care-meds/dashboard", getMedicationDashboard);
router.post("/elders/:id/care-meds", createCareMedication);
router.put("/elders/:id/care-meds/:medId", updateCareMedication);
router.patch("/elders/:id/care-meds/:medId/discontinue", discontinueCareMedication);
router.delete("/elders/:id/care-meds/:medId", deleteCareMedication);
router.patch("/elders/:id/care-meds/doses/:doseId/status", updateDoseStatus);
router.patch("/elders/:id/care-meds/:medId/inventory", updateInventory);

export default router;
