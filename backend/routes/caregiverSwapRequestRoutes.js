import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  acceptCaregiverSwapRequest,
  createCaregiverSwapRequest,
  getMySwapRequests,
  rejectCaregiverSwapRequest,
} from "../controllers/caregiverSwapRequestController.js";

const router = express.Router();

router.use(authMiddleware, requireRole("caregiver"));

router.get("/", getMySwapRequests);
router.post("/", createCaregiverSwapRequest);
router.post("/:id/accept", acceptCaregiverSwapRequest);
router.post("/:id/reject", rejectCaregiverSwapRequest);

export default router;
