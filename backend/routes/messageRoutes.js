import express from "express";

import {
  getMessages,
  sendMessage,
} from "../controllers/messageController.js";

import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

// Get conversation history
router.post("/", sendMessage);

// Get messages between two users for a specific elder
router.get(
  "/:elderId/:otherUserId",
  getMessages
);

export default router;