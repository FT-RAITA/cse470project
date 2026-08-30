import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  downloadElderDashboardPdf,
  getElderDashboard,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/elders/:elderId/dashboard", authMiddleware, getElderDashboard);
router.get(
  "/elders/:elderId/dashboard/pdf",
  authMiddleware,
  downloadElderDashboardPdf
);

export default router;
