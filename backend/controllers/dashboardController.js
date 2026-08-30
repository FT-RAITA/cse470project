import mongoose from "mongoose";
import Elder from "../models/elder.js";
import { buildElderDashboard } from "../services/dashboardService.js";
import {
  dashboardPdfFilename,
  streamDashboardPdf,
} from "../services/dashboardPdfService.js";

const RANGE_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const userId = (user) => String(user?.id || user?._id || "");

const assertReadAccess = (elderId, uid) =>
  Elder.findOne({
    _id: elderId,
    $or: [{ caregiver: uid }, { "familyMembers.user": uid }],
  }).select("_id fullName elderID age gender");

const resolveDashboardRequest = async (req, res) => {
  const { elderId } = req.params;
  if (!mongoose.isValidObjectId(elderId)) {
    res.status(400).json({ message: "Invalid elder ID." });
    return null;
  }

  const rangeKey = req.query.range || "7d";
  const days = RANGE_DAYS[rangeKey];
  if (!days) {
    res.status(400).json({
      message: "Invalid range. Use 7d, 30d, or 90d.",
    });
    return null;
  }

  const elder = await assertReadAccess(elderId, userId(req.user));
  if (!elder) {
    res.status(404).json({ message: "Elder not found." });
    return null;
  }

  return { elderId, elder, rangeKey, days };
};

export const getElderDashboard = async (req, res) => {
  try {
    const resolved = await resolveDashboardRequest(req, res);
    if (!resolved) return;

    const { elderId, elder, days } = resolved;
    const dashboard = await buildElderDashboard(elderId, days);

    return res.json({
      elder: {
        _id: elder._id,
        fullName: elder.fullName,
        elderID: elder.elderID,
        age: elder.age,
        gender: elder.gender,
      },
      ...dashboard,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const downloadElderDashboardPdf = async (req, res) => {
  try {
    const resolved = await resolveDashboardRequest(req, res);
    if (!resolved) return;

    const { elderId, elder, rangeKey, days } = resolved;
    const dashboard = await buildElderDashboard(elderId, days);
    const filename = dashboardPdfFilename(elder.fullName, rangeKey);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Cache-Control", "no-store");

    streamDashboardPdf({
      res,
      elder,
      dashboard,
      rangeKey,
    });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ message: error.message });
    }
    res.end();
  }
};
