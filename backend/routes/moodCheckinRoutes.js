import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createMoodCheckin,
  getMoodCheckins,
  getMoodCheckinById,
  deleteMoodCheckin,
} from '../controllers/moodCheckinController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/elders/:id/mood-checkins', createMoodCheckin);
router.get('/elders/:id/mood-checkins', getMoodCheckins);
router.get('/mood-checkins/:checkinId', getMoodCheckinById);
router.delete('/mood-checkins/:checkinId', deleteMoodCheckin);

export default router;