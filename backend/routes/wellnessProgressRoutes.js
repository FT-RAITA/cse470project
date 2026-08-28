import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getWellnessProgress } from "../controllers/wellnessProgressController.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/elders/:elderId/wellness-progress", getWellnessProgress);

export default router;
