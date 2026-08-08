import express from "express";
import {
  connectToElder,
  getMyElders,
} from "../controllers/familyController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/connect", authMiddleware, connectToElder);

router.get("/my-elders", authMiddleware, getMyElders);

export default router;