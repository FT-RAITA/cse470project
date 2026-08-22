import mongoose from "mongoose";
import User from "../models/user.js";
import CaregiverSchedule from "../models/caregiverSchedule.js";
import CaregiverScheduleSettings from "../models/caregiverScheduleSettings.js";

const SLOT_HOURS = 4;
const SLOT_COUNT = 6;
const REQUIRED_CAREGIVERS = 3;
const DEFAULT_UTC_OFFSET_MINUTES = 360; // Asia/Dhaka; override with SCHEDULE_UTC_OFFSET_MINUTES if needed.

const getOffsetMinutes = () => {
  const value = Number(process.env.SCHEDULE_UTC_OFFSET_MINUTES);
  return Number.isFinite(value) && value >= -720 && value <= 840
    ? value
    : DEFAULT_UTC_OFFSET_MINUTES;
};

const pad = (value) => String(value).padStart(2, "0");

export const toDateKey = (date) => {
  const shifted = new Date(date.getTime() + getOffsetMinutes() * 60_000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
};

export const parseDateKey = (dateKey) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    return null;
  }
  return utc;
};

export const addDaysToDateKey = (dateKey, amount) => {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return null;
  parsed.setUTCDate(parsed.getUTCDate() + amount);
  return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}`;
};

export const dateKeyToScheduleStart = (dateKey) => {
  const localMidnightAsUtc = parseDateKey(dateKey);
  if (!localMidnightAsUtc) return null;
  return new Date(localMidnightAsUtc.getTime() - getOffsetMinutes() * 60_000);
};

export const buildSlots = (dateKey) => {
  const dayStart = dateKeyToScheduleStart(dateKey);
  if (!dayStart) return null;

  return Array.from({ length: SLOT_COUNT }, (_, slotIndex) => {
    const startAt = new Date(dayStart.getTime() + slotIndex * SLOT_HOURS * 60 * 60_000);
    const endAt = new Date(startAt.getTime() + SLOT_HOURS * 60 * 60_000);
    return {
      slotIndex,
      startAt,
      endAt,
      initialCaregiver: null,
      caregiver: null,
      switchCount: 0,
    };
  });
};

export const formatSlotLabel = (slotIndex) => {
  const startHour = slotIndex * SLOT_HOURS;
  const endHour = startHour + SLOT_HOURS;
  const formatHour = (hour) => {
    if (hour === 0) return "12:00 AM";
    if (hour === 12) return "12:00 PM";
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };
  return `${formatHour(startHour)} – ${formatHour(endHour)}`;
};

export const assignCaregiversToSlots = (slots, caregiverIds, dateKey) => {
  const ids = caregiverIds.map((id) => String(id));
  if (!ids.length) return slots;

  // Rotate the starting caregiver by calendar day so eligible caregivers share shifts over time.
  const dayNumber = Math.floor(parseDateKey(dateKey).getTime() / 86_400_000);
  const rotation = ((dayNumber % ids.length) + ids.length) % ids.length;
  const rotated = [...ids.slice(rotation), ...ids.slice(0, rotation)];
  const selected = rotated.slice(0, Math.min(REQUIRED_CAREGIVERS, rotated.length));

  return slots.map((slot, index) => {
    const caregiver = selected[Math.floor(index / 2)] || null;
    return {
      ...slot,
      initialCaregiver: caregiver,
      caregiver,
      switchCount: 0,
    };
  });
};

const serializeId = (value) => (value ? String(value) : null);

export const validateSwap = ({ schedule, actorId, fromSlotIndex, toSlotIndex }) => {
  if (!schedule) return { ok: false, message: "Schedule not found." };
  if (schedule.scheduleDate <= new Date()) {
    return { ok: false, message: "This schedule is no longer open for switching." };
  }
  if (fromSlotIndex === toSlotIndex) {
    return { ok: false, message: "Choose a different slot." };
  }

  const fromSlot = schedule.slots[fromSlotIndex];
  const toSlot = schedule.slots[toSlotIndex];
  if (!fromSlot || !toSlot) return { ok: false, message: "Invalid slot." };
  if (serializeId(fromSlot.caregiver) !== String(actorId)) {
    return { ok: false, message: "You can only move one of your own assigned slots." };
  }

  const actorSlots = schedule.slots.filter(
    (slot) => serializeId(slot.caregiver) === String(actorId)
  ).length;
  if (actorSlots !== 2) {
    return { ok: false, message: "Schedule integrity check failed: a caregiver must have exactly two slots." };
  }

  // A caregiver gets exactly one switch opportunity per daily schedule.
  // The rule is intentionally tied to the schedule itself, so it survives page refreshes and retries.
  const alreadySwitched = (schedule.switchHistory || []).some(
    (entry) => serializeId(entry.actorCaregiver) === String(actorId)
  );
  if (alreadySwitched) {
    return { ok: false, message: "You have already used your one schedule switch for this day." };
  }

  // Switches can only move a caregiver's own assigned slot into a currently unassigned slot.
  // Another caregiver's slot can never be taken or exchanged.
  if (toSlot.caregiver) {
    return { ok: false, message: "You can only switch into an unassigned available slot." };
  }

  return { ok: true, fromSlot, toSlot };
};

const getEligibleCaregivers = async () => {
  const caregivers = await User.find({ role: "caregiver" })
    .select("_id name email")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  if (!caregivers.length) return [];

  const settings = await CaregiverScheduleSettings.find({
    caregiver: { $in: caregivers.map((caregiver) => caregiver._id) },
    schedulerAvailable: true,
  })
    .select("caregiver")
    .lean();

  const explicitlyConfigured = new Set(settings.map((setting) => String(setting.caregiver)));
  const configuredIds = await CaregiverScheduleSettings.find({
    caregiver: { $in: caregivers.map((caregiver) => caregiver._id) },
  })
    .select("caregiver schedulerAvailable")
    .lean();
  const availabilityMap = new Map(
    configuredIds.map((setting) => [String(setting.caregiver), setting.schedulerAvailable])
  );

  return caregivers.filter((caregiver) => {
    const id = String(caregiver._id);
    if (!availabilityMap.has(id)) return true;
    return explicitlyConfigured.has(id);
  });
};

export const ensureScheduleForDate = async (dateKey) => {
  if (!parseDateKey(dateKey)) throw new Error("Invalid schedule date.");
  const scheduleStart = dateKeyToScheduleStart(dateKey);

  const existing = await CaregiverSchedule.findOne({ scheduleDate: scheduleStart });
  if (existing) return existing;

  const caregivers = await getEligibleCaregivers();
  const slots = assignCaregiversToSlots(
    buildSlots(dateKey),
    caregivers.map((caregiver) => caregiver._id),
    dateKey
  );

  const status = caregivers.length >= REQUIRED_CAREGIVERS ? "generated" : "needs-caregivers";

  try {
    return await CaregiverSchedule.create({
      scheduleDate: scheduleStart,
      status,
      slots,
      switchHistory: [],
    });
  } catch (error) {
    if (error?.code === 11000) {
      return CaregiverSchedule.findOne({ scheduleDate: scheduleStart });
    }
    throw error;
  }
};

export const ensureNextDaySchedule = async (now = new Date()) => {
  const todayKey = toDateKey(now);
  const nextDayKey = addDaysToDateKey(todayKey, 1);
  return ensureScheduleForDate(nextDayKey);
};

export const getScheduleForDate = async (dateKey) => {
  const scheduleStart = dateKeyToScheduleStart(dateKey);
  if (!scheduleStart) throw new Error("Invalid schedule date.");
  return CaregiverSchedule.findOne({ scheduleDate: scheduleStart })
    .populate("slots.caregiver", "name email")
    .populate("slots.initialCaregiver", "name email")
    .populate("switchHistory.actorCaregiver", "name email")
    .lean();
};

export const switchSlots = async ({ dateKey, actorId, fromSlotIndex, toSlotIndex }) => {
  if (!Number.isInteger(fromSlotIndex) || !Number.isInteger(toSlotIndex)) {
    throw new Error("Invalid slot selection.");
  }

  const scheduleStart = dateKeyToScheduleStart(dateKey);
  if (!scheduleStart) throw new Error("Invalid schedule date.");

  const actor = await User.findOne({ _id: actorId, role: "caregiver" }).select("_id").lean();
  if (!actor) throw new Error("Caregiver account not found.");

  const schedule = await CaregiverSchedule.findOne({ scheduleDate: scheduleStart });
  const validation = validateSwap({ schedule, actorId, fromSlotIndex, toSlotIndex });
  if (!validation.ok) throw new Error(validation.message);

  const nextSlots = schedule.slots.map((slot) => ({ ...slot.toObject() }));
  const fromSlot = nextSlots[fromSlotIndex];
  const toSlot = nextSlots[toSlotIndex];
  const fromCaregiverBefore = serializeId(fromSlot.caregiver);
  const toCaregiverBefore = serializeId(toSlot.caregiver);

  if (toSlot.caregiver) {
    fromSlot.caregiver = toCaregiverBefore;
    toSlot.caregiver = fromCaregiverBefore;
  } else {
    toSlot.caregiver = fromCaregiverBefore;
    fromSlot.caregiver = null;
  }
  fromSlot.switchCount = Number(fromSlot.switchCount || 0) + 1;
  toSlot.switchCount = Number(toSlot.switchCount || 0) + 1;

  const actorCurrentSlots = nextSlots.filter(
    (slot) => serializeId(slot.caregiver) === String(actorId)
  ).length;
  if (actorCurrentSlots !== 2) throw new Error("Switch rejected because it would break the two-slot rule.");

  const expectedVersion = schedule.__v;
  const updated = await CaregiverSchedule.findOneAndUpdate(
    {
      _id: schedule._id,
      __v: expectedVersion,
      switchHistory: { $not: { $elemMatch: { actorCaregiver: actorId } } },
      slots: { $elemMatch: { slotIndex: fromSlotIndex, caregiver: actorId } },
      $and: [
        { slots: { $elemMatch: { slotIndex: toSlotIndex, caregiver: null } } },
      ],
    },
    {
      $set: {
        slots: nextSlots,
        status: nextSlots.every((slot) => slot.caregiver) ? "generated" : "needs-caregivers",
      },
      $push: {
        switchHistory: {
          fromSlotIndex,
          toSlotIndex,
          actorCaregiver: actorId,
          fromCaregiver: fromCaregiverBefore,
          toCaregiver: toCaregiverBefore,
        },
      },
      $inc: { __v: 1 },
    },
    { new: true }
  );

  if (!updated) {
    throw new Error("The schedule changed while you were switching. Refresh and try again.");
  }

  return getScheduleForDate(dateKey);
};

export const setSchedulerAvailability = async (caregiverId, schedulerAvailable) => {
  if (typeof schedulerAvailable !== "boolean") {
    throw new Error("schedulerAvailable must be true or false.");
  }

  return CaregiverScheduleSettings.findOneAndUpdate(
    { caregiver: new mongoose.Types.ObjectId(caregiverId) },
    { $set: { schedulerAvailable } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
};

export const getSchedulerAvailability = async (caregiverId) => {
  const setting = await CaregiverScheduleSettings.findOne({ caregiver: caregiverId }).lean();
  return setting?.schedulerAvailable ?? true;
};

export const startCaregiverScheduleScheduler = () => {
  const run = async () => {
    try {
      await ensureNextDaySchedule();
    } catch (error) {
      console.error("Caregiver schedule scheduler error:", error.message);
    }
  };

  // The job is idempotent. Running on startup also recovers from a restart that occurred around midnight.
  setTimeout(run, 5_000);
  const timer = setInterval(run, 60_000);
  timer.unref?.();
  return timer;
};

export const _internal = {
  SLOT_HOURS,
  SLOT_COUNT,
  REQUIRED_CAREGIVERS,
  getOffsetMinutes,
  buildSlots,
  assignCaregiversToSlots,
};
