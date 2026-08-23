import CaregiverSchedule from "../../models/caregiverSchedule.js";
import ShiftCoverage from "../../models/shiftCoverage.js";
import Task from "../../models/task.js";
import { findSeedByKey, findSeedByName } from "./seedData.js";
import { pct } from "./scoreCalculator.js";

const emptyMetrics = (source = "database") => ({
  source,
  shiftsScheduled: 0,
  shiftsCompleted: 0,
  shiftsMissed: 0,
  shiftsLate: 0,
  attendanceRate: 100,
  coverageShifts: 0,
});

const overlapsRange = (startAt, endAt, from, to) =>
  new Date(startAt) <= to && new Date(endAt) >= from;

const classifyPastSlot = async ({ caregiverId, elderIds, startAt, endAt, now }) => {
  const query = {
    dueAt: { $gte: startAt, $lte: endAt },
  };
  if (elderIds?.length) query.elder = { $in: elderIds };
  else query.caregiver = caregiverId;

  const tasks = await Task.find(query).select("status dueAt").lean();
  if (!tasks.length) return "completed";

  let done = 0;
  let missed = 0;
  for (const t of tasks) {
    const status = String(t.status || "").toLowerCase();
    if (status === "completed") done += 1;
    else if (status === "incomplete" || (status === "pending" && new Date(t.dueAt) < now)) {
      missed += 1;
    }
  }

  if (missed > 0 && missed >= done) return "missed";
  return "completed";
};

export const getCaregiverShiftMetrics = async (caregiverId, range = {}, caregiverName = "") => {
  if (String(caregiverId).startsWith("seed-")) {
    const seed = findSeedByKey(caregiverId) || findSeedByName(caregiverName);
    if (!seed) return emptyMetrics("seed");
    return {
      source: "seed",
      shiftsScheduled: seed.shiftsScheduled,
      shiftsCompleted: seed.shiftsCompleted,
      shiftsMissed: seed.shiftsMissed,
      shiftsLate: seed.shiftsLate,
      attendanceRate: pct(seed.shiftsCompleted, seed.shiftsScheduled),
      coverageShifts: 0,
    };
  }

  const from = range?.from ? new Date(range.from) : new Date(Date.now() - 6 * 86400000);
  const to = range?.to ? new Date(range.to) : new Date();
  const now = new Date();

  const schedules = await CaregiverSchedule.find({
    $or: [
      { scheduleDate: { $gte: new Date(from.getTime() - 86400000), $lte: new Date(to.getTime() + 86400000) } },
      { "slots.startAt": { $gte: from, $lte: to } },
    ],
  }).lean();

  let shiftsScheduled = 0;
  let shiftsCompleted = 0;
  let shiftsMissed = 0;
  let futureAssigned = 0;

  for (const schedule of schedules) {
    for (const slot of schedule.slots || []) {
      if (!slot.caregiver || String(slot.caregiver) !== String(caregiverId)) continue;
      if (!overlapsRange(slot.startAt, slot.endAt, from, to)) continue;

      shiftsScheduled += 1;
      const endAt = new Date(slot.endAt);
      if (endAt > now) {
        futureAssigned += 1;
        continue;
      }

      const outcome = await classifyPastSlot({
        caregiverId,
        startAt: new Date(slot.startAt),
        endAt,
        now,
      });
      if (outcome === "missed") shiftsMissed += 1;
      else shiftsCompleted += 1;
    }
  }

  const coverages = await ShiftCoverage.find({
    coveringCaregiver: caregiverId,
    startAt: { $lte: to },
    endAt: { $gte: from },
  })
    .select("swapRequest elder startAt endAt")
    .lean();

  const coverageByShift = new Map();
  for (const row of coverages) {
    const key = String(row.swapRequest || `${row.startAt}-${row.endAt}`);
    if (!coverageByShift.has(key)) {
      coverageByShift.set(key, {
        startAt: new Date(row.startAt),
        endAt: new Date(row.endAt),
        elderIds: [],
      });
    }
    coverageByShift.get(key).elderIds.push(row.elder);
  }

  let coverageShifts = 0;
  for (const shift of coverageByShift.values()) {
    coverageShifts += 1;
    shiftsScheduled += 1;
    if (shift.endAt > now) {
      futureAssigned += 1;
      continue;
    }
    const outcome = await classifyPastSlot({
      caregiverId,
      elderIds: shift.elderIds,
      startAt: shift.startAt,
      endAt: shift.endAt,
      now,
    });
    if (outcome === "missed") shiftsMissed += 1;
    else shiftsCompleted += 1;
  }

  if (!shiftsScheduled) return emptyMetrics("database");

  const pastCounted = shiftsCompleted + shiftsMissed;
  const attendanceRate =
    pastCounted > 0
      ? pct(shiftsCompleted, pastCounted)
      : futureAssigned > 0
        ? 100
        : 0;

  return {
    source: "database",
    shiftsScheduled,
    shiftsCompleted,
    shiftsMissed,
    shiftsLate: 0,
    attendanceRate,
    coverageShifts,
  };
};
