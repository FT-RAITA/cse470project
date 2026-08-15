import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Elder from "../models/elder.js";
import MedicalRecord from "../models/medicalRecord.js";
import Medication from "../models/medication.js";
import MedicalReport from "../models/medicalReport.js";
import HealthActivity from "../models/healthActivity.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const UPLOADS_DIR = path.join(__dirname, "../uploads/medical-reports");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const assertElderOwnership = async (elderId, caregiverId) => {
  return Elder.findOne({ _id: elderId, caregiver: caregiverId });
};

const logActivity = async ({ elder, actor, type, message }) => {
  await HealthActivity.create({ elder, actor, type, message });
};

const computeHealthStatus = (records, elder) => {
  const criticalRecord = records.find((r) => r.status === "Critical");
  if (criticalRecord) return "Critical";

  const latestVitals = records.find((r) => r.category === "Vitals" && r.bpSystolic);
  if (latestVitals) {
    const { bpSystolic, bpDiastolic } = latestVitals;
    if (bpSystolic >= 180 || bpDiastolic >= 120 || bpSystolic < 90) return "Critical";
    if (bpSystolic >= 140 || bpDiastolic >= 90) return "Needs Attention";
  }

  if ((elder.allergies || []).length >= 3) return "Needs Attention";
  if ((elder.chronicDiseases || []).length >= 3) return "Needs Attention";

  const monitoring = records.some((r) => r.status === "Monitoring");
  if (monitoring) return "Needs Attention";

  return "Stable";
};

const computeProfileCompletion = (elder, recordCount, medCount, reportCount) => {
  const checks = [
    !!elder.fullName,
    !!elder.age || !!elder.dateOfBirth,
    !!elder.gender,
    !!elder.bloodGroup,
    !!elder.phone,
    !!elder.address,
    (elder.medicalHistory || []).length > 0,
    (elder.allergies || []).length > 0,
    (elder.chronicDiseases || []).length > 0,
    (elder.emergencyContacts || []).length > 0,
    !!elder.nutritionPlan?.dietType,
    recordCount > 0,
    medCount > 0,
    reportCount > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
};

const buildConditionDistribution = (elder, records) => {
  const buckets = {
    Diabetes: 0,
    Hypertension: 0,
    "Heart Disease": 0,
    Arthritis: 0,
    Others: 0,
  };

  const bump = (label) => {
    const text = (label || "").toLowerCase();
    if (text.includes("diabet")) buckets.Diabetes += 1;
    else if (text.includes("hypertens") || text.includes("blood pressure") || text.includes("bp"))
      buckets.Hypertension += 1;
    else if (text.includes("heart") || text.includes("cardio")) buckets["Heart Disease"] += 1;
    else if (text.includes("arthritis") || text.includes("joint")) buckets.Arthritis += 1;
    else buckets.Others += 1;
  };

  (elder.chronicDiseases || []).forEach(bump);
  (elder.medicalHistory || []).forEach((h) => bump(h.condition));
  records
    .filter((r) => r.category === "Diagnosis")
    .forEach((r) => bump(r.title));

  return Object.entries(buckets)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));
};

export const getRecordsDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const [records, medications, reports, activities, upcomingCheckup] =
      await Promise.all([
        MedicalRecord.find({ elder: id }).sort({ recordedAt: -1 }),
        Medication.find({ elder: id }).sort({ updatedAt: -1 }),
        MedicalReport.find({ elder: id }).sort({ createdAt: -1 }),
        HealthActivity.find({ elder: id })
          .populate("actor", "name")
          .sort({ createdAt: -1 })
          .limit(20),
        MedicalRecord.findOne({
          elder: id,
          category: "Checkup",
          recordedAt: { $gte: new Date() },
        }).sort({ recordedAt: 1 }),
      ]);

    const activeMeds = medications.filter((m) => m.status === "Active");
    const lastUpdated =
      records[0]?.updatedAt ||
      medications[0]?.updatedAt ||
      reports[0]?.updatedAt ||
      elder.updatedAt;

    const bpTrend = records
      .filter((r) => r.bpSystolic && r.bpDiastolic)
      .slice(0, 12)
      .reverse()
      .map((r) => ({
        date: r.recordedAt,
        systolic: r.bpSystolic,
        diastolic: r.bpDiastolic,
      }));

    const weightTrend = records
      .filter((r) => r.weight)
      .slice(0, 12)
      .reverse()
      .map((r) => ({
        date: r.recordedAt,
        weight: r.weight,
      }));

    res.json({
      elder: {
        _id: elder._id,
        fullName: elder.fullName,
        age: elder.age,
        gender: elder.gender,
        bloodGroup: elder.bloodGroup,
      },
      summary: {
        totalRecords: records.length,
        lastUpdated,
        activeMedications: activeMeds.length,
        uploadedReports: reports.length,
        healthStatus: computeHealthStatus(records, elder),
        upcomingCheckup: upcomingCheckup?.recordedAt || null,
        profileCompletion: computeProfileCompletion(
          elder,
          records.length,
          activeMeds.length,
          reports.length
        ),
      },
      analytics: {
        bpTrend,
        weightTrend,
        conditions: buildConditionDistribution(elder, records),
      },
      medications: activeMeds,
      reports,
      activities,
      timeline: activities,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMedicalRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const {
      search = "",
      category = "",
      status = "",
      from = "",
      to = "",
      sort = "recordedAt",
      order = "desc",
      page = 1,
      limit = 8,
    } = req.query;

    const query = { elder: id };
    if (category) query.category = category;
    if (status) query.status = status;
    if (from || to) {
      query.recordedAt = {};
      if (from) query.recordedAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.recordedAt.$lte = end;
      }
    }
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const sortField = ["recordedAt", "category", "status", "title", "createdAt"].includes(sort)
      ? sort
      : "recordedAt";
    const sortOrder = order === "asc" ? 1 : -1;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 8));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      MedicalRecord.find(query)
        .populate("updatedBy", "name")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      MedicalRecord.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const {
      category,
      title,
      description,
      status,
      bpSystolic,
      bpDiastolic,
      weight,
      recordedAt,
    } = req.body;

    if (!category || !title?.trim()) {
      return res.status(400).json({ message: "Category and title are required." });
    }

    const record = await MedicalRecord.create({
      elder: id,
      updatedBy: req.user.id,
      category,
      title: title.trim(),
      description: description?.trim() || "",
      status: status || "Active",
      bpSystolic: bpSystolic ? Number(bpSystolic) : undefined,
      bpDiastolic: bpDiastolic ? Number(bpDiastolic) : undefined,
      weight: weight ? Number(weight) : undefined,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    });

    if (category === "Allergy" && title.trim()) {
      const set = new Set([...(elder.allergies || []), title.trim()]);
      elder.allergies = [...set];
      await elder.save();
    }
    if (category === "Diagnosis" && title.trim()) {
      const set = new Set([...(elder.chronicDiseases || []), title.trim()]);
      elder.chronicDiseases = [...set];
      await elder.save();
    }

    const typeMap = {
      Vitals: "vitals_updated",
      Allergy: "allergy_added",
      Diagnosis: "diagnosis_added",
      Medication: "medication_updated",
    };

    await logActivity({
      elder: id,
      actor: req.user.id,
      type: typeMap[category] || "record_added",
      message: `${category} updated: ${title.trim()}`,
    });

    const populated = await MedicalRecord.findById(record._id).populate(
      "updatedBy",
      "name"
    );
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMedicalRecord = async (req, res) => {
  try {
    const { id, recordId } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const record = await MedicalRecord.findOneAndUpdate(
      { _id: recordId, elder: id },
      {
        ...req.body,
        updatedBy: req.user.id,
        title: req.body.title?.trim(),
        description: req.body.description?.trim(),
      },
      { new: true, runValidators: true }
    ).populate("updatedBy", "name");

    if (!record) return res.status(404).json({ message: "Record not found" });

    await logActivity({
      elder: id,
      actor: req.user.id,
      type: "record_updated",
      message: `Record modified: ${record.title}`,
    });

    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMedicalRecord = async (req, res) => {
  try {
    const { id, recordId } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const deleted = await MedicalRecord.findOneAndDelete({
      _id: recordId,
      elder: id,
    });
    if (!deleted) return res.status(404).json({ message: "Record not found" });

    await logActivity({
      elder: id,
      actor: req.user.id,
      type: "record_updated",
      message: `Record removed: ${deleted.title}`,
    });

    res.json({ message: "Record deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMedications = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const meds = await Medication.find({ elder: id })
      .populate("updatedBy", "name")
      .sort({ updatedAt: -1 });
    res.json(meds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMedication = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const { name, dosage, frequency, notes, status } = req.body;
    if (!name?.trim() || !dosage?.trim() || !frequency?.trim()) {
      return res.status(400).json({
        message: "Medication name, dosage, and frequency are required.",
      });
    }

    const med = await Medication.create({
      elder: id,
      updatedBy: req.user.id,
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      notes: notes?.trim() || "",
      status: status || "Active",
    });

    await MedicalRecord.create({
      elder: id,
      updatedBy: req.user.id,
      category: "Medication",
      title: `Medication: ${med.name}`,
      description: `${med.dosage} · ${med.frequency}`,
      status: "Active",
    });

    await logActivity({
      elder: id,
      actor: req.user.id,
      type: "medication_added",
      message: `Medicine added: ${med.name}`,
    });

    const populated = await Medication.findById(med._id).populate(
      "updatedBy",
      "name"
    );
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMedication = async (req, res) => {
  try {
    const { id, medId } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const med = await Medication.findOneAndUpdate(
      { _id: medId, elder: id },
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate("updatedBy", "name");

    if (!med) return res.status(404).json({ message: "Medication not found" });

    await logActivity({
      elder: id,
      actor: req.user.id,
      type: "medication_updated",
      message: `Medication updated: ${med.name}`,
    });

    res.json(med);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const reports = await MedicalReport.find({ elder: id })
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file." });
    }

    const { title, reportType } = req.body;
    if (!title?.trim() || !reportType) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Title and report type are required." });
    }

    const report = await MedicalReport.create({
      elder: id,
      uploadedBy: req.user.id,
      title: title.trim(),
      reportType,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    await logActivity({
      elder: id,
      actor: req.user.id,
      type: "report_uploaded",
      message: `Prescription/report uploaded: ${report.title}`,
    });

    const populated = await MedicalReport.findById(report._id).populate(
      "uploadedBy",
      "name"
    );
    res.status(201).json(populated);
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const { id, reportId } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const report = await MedicalReport.findOneAndDelete({
      _id: reportId,
      elder: id,
    });
    if (!report) return res.status(404).json({ message: "Report not found" });

    const filePath = path.join(UPLOADS_DIR, report.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await logActivity({
      elder: id,
      actor: req.user.id,
      type: "report_deleted",
      message: `Report deleted: ${report.title}`,
    });

    res.json({ message: "Report deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const activities = await HealthActivity.find({ elder: id })
      .populate("actor", "name")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
