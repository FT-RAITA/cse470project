import {
  ensureNextDaySchedule,
  getScheduleForDate,
  getSchedulerAvailability,
  setSchedulerAvailability,
  switchSlots,
  toDateKey,
} from "../services/caregiverScheduleService.js";

const normalizeDate = (value) => {
  if (typeof value !== "string") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
};

export const getSchedule = async (req, res) => {
  try {
    const dateKey = normalizeDate(req.query.date) || toDateKey(new Date());
    const schedule = await getScheduleForDate(dateKey);
    const availability = await getSchedulerAvailability(req.user._id);

    res.json({ date: dateKey, schedule, availability });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const generateNextDaySchedule = async (req, res) => {
  try {
    const schedule = await ensureNextDaySchedule();
    res.status(201).json({ schedule });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const switchScheduleSlots = async (req, res) => {
  try {
    const { date, fromSlotIndex, toSlotIndex } = req.body;
    const dateKey = normalizeDate(date);
    if (!dateKey) return res.status(400).json({ message: "A valid schedule date is required." });

    const schedule = await switchSlots({
      dateKey,
      actorId: req.user._id,
      fromSlotIndex: Number(fromSlotIndex),
      toSlotIndex: Number(toSlotIndex),
    });

    res.json({ schedule });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateScheduleAvailability = async (req, res) => {
  try {
    const { schedulerAvailable } = req.body;
    const setting = await setSchedulerAvailability(req.user._id, schedulerAvailable);
    res.json({ availability: setting.schedulerAvailable });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
