import Elder from "../models/elder.js";
import { buildWellnessProgress } from "../services/wellnessProgressService.js";

const userId = (user) => String(user?.id || user?._id || "");

const assertReadAccess = async (elderId, uid) =>
  Elder.findOne({
    _id: elderId,
    $or: [{ caregiver: uid }, { "familyMembers.user": uid }],
  });

export const getWellnessProgress = async (req, res) => {
  try {
    const elderId = req.params.elderId;
    const elder = await assertReadAccess(elderId, userId(req.user));
    if (!elder) return res.status(404).json({ message: "Elder not found." });

    const data = await buildWellnessProgress(elderId);
    res.json({
      elder: { id: elder._id, name: elder.fullName },
      ...data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
