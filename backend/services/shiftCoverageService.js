import ShiftCoverage from "../models/shiftCoverage.js";

const populateCoverage = (query) =>
  query
    .populate("elder", "fullName elderID")
    .populate("originalCaregiver", "name email")
    .populate({ path: "swapRequest", select: "handoverLog" });

// Start/end of the calendar day that contains `at` (server local time).
const startOfDay = (at) => {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (at) => {
  const d = new Date(at);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getActiveCoverageForCaregiver = async (caregiverId, at = new Date()) => {
  const dayStart = startOfDay(at);
  const dayEnd = endOfDay(at);

  return populateCoverage(
    ShiftCoverage.find({
      coveringCaregiver: caregiverId,
      startAt: { $lte: dayEnd },
      endAt: { $gte: dayStart },
    })
  ).lean();
};


export const isCoveringElder = async (caregiverId, elderId, at = new Date()) => {
  const row = await ShiftCoverage.findOne({
    coveringCaregiver: caregiverId,
    elder: elderId,
    startAt: { $lte: at },
    endAt: { $gte: at },
  }).lean();
  return row;
};


export const createCoverageForAcceptedSwap = async ({
  swapRequestId,
  requesterId,
  receiverId,
  slotStartAt,
  slotEndAt,
  Elder,
}) => {
  const elders = await Elder.find({ caregiver: requesterId }).select("_id");
  if (!elders.length) return [];

  const rows = elders.map((elder) => ({
    swapRequest: swapRequestId,
    elder: elder._id,
    originalCaregiver: requesterId,
    coveringCaregiver: receiverId,
    startAt: slotStartAt,
    endAt: slotEndAt,
  }));


  return Promise.all(
    rows.map((row) =>
      ShiftCoverage.findOneAndUpdate(
        { swapRequest: row.swapRequest, elder: row.elder },
        { $setOnInsert: row },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );
};