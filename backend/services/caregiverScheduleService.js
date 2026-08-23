import mongoose from "mongoose";
import User from "../models/user.js";
import CaregiverSchedule from "../models/caregiverSchedule.js";
import CaregiverScheduleSettings from "../models/caregiverScheduleSettings.js";

const SLOT_HOURS = 4;
const SLOT_COUNT = 6;
const REQUIRED_CAREGIVERS = 6; // one caregiver per 4-hour slot
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
    const caregiver = rotated[index] || null;
    return {
      ...slot,
      initialCaregiver: caregiver,
      caregiver,
      switchCount: 0,
    };
  });
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
