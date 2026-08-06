import express from "express";
import multer from "multer";
import path from "path";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  UPLOADS_DIR,
  getRecordsDashboard,
  getMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getMedications,
  createMedication,
  updateMedication,
  getReports,
  uploadReport,
  deleteReport,
  getActivities,
} from "../controllers/elderRecordsController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF and image files are allowed."));
  },
});

router.use(authMiddleware);
router.use(requireRole("caregiver", "admin"));

router.get("/elders/:id/records/dashboard", getRecordsDashboard);
router.get("/elders/:id/records/activities", getActivities);
router.get("/elders/:id/records", getMedicalRecords);
router.post("/elders/:id/records", createMedicalRecord);
router.put("/elders/:id/records/:recordId", updateMedicalRecord);
router.delete("/elders/:id/records/:recordId", deleteMedicalRecord);

router.get("/elders/:id/medications", getMedications);
router.post("/elders/:id/medications", createMedication);
router.patch("/elders/:id/medications/:medId", updateMedication);

router.get("/elders/:id/reports", getReports);
router.post("/elders/:id/reports", upload.single("file"), uploadReport);
router.delete("/elders/:id/reports/:reportId", deleteReport);

export default router;
