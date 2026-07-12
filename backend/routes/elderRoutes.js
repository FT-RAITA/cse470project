import express from 'express';
import { authMiddleware } from "../middleware/auth.js";
import {
  getElderById,
  createElder,
  updateElder,
  deleteElder,
  getAllElders
} from '../controllers/elderController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/elders', authMiddleware, createElder);
router.get('/elders/:id', authMiddleware, getElderById);
router.put('/elders/:id', authMiddleware, updateElder);
router.delete('/elders/:id', authMiddleware, deleteElder);
router.get('/elders', authMiddleware, getAllElders);

export default router;