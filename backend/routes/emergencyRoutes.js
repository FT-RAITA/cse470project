import express from "express";

import {
  createEmergency,
  getEmergencyHistory,
} from "../controllers/emergencyController.js";

import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createEmergency);

router.get(
  "/elder/:elderId",
  authMiddleware,
  getEmergencyHistory
);

export default router;