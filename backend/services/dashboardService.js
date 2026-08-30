import Medication from "../models/medication.js";
import MedicationDoseLog from "../models/medicationDoseLog.js";
import DoctorAppointment from "../models/DoctorAppointment.js";
import MoodCheckin from "../models/MoodCheckin.js";
import Activity from "../models/activity.js";
import HealthActivity from "../models/healthActivity.js";
import MealSchedule from "../models/mealSchedule.js";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MOOD_SCORES = {
  "Very Low": 1,
  Low: 2,
  Okay: 3,
  Good: 4,
  Great: 5,
};

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const dateKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const shortDateLabel = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const combineDateAndTime = (date, time = "00:00") => {
  const result = startOfDay(date);
  const [hours, minutes] = String(time).split(":").map(Number);
  result.setHours(hours || 0, minutes || 0, 0, 0);
  return result;
};

// This intentionally mirrors the medication feature's existing fallback
// scheduling behavior without changing that working controller.
const defaultTimesForFrequency = (frequency = "") => {
  const f = frequency.toLowerCase();
  if (f.includes("three") || f.includes("3")) return ["08:00", "14:00", "20:00"];
  if (f.includes("twice") || f.includes("2") || f.includes("two")) return ["08:00", "20:00"];
  if (f.includes("bed") || f.includes("night")) return ["21:00"];
  if (f.includes("morning")) return ["08:00"];
  return ["09:00"];
};

const isMedicationActiveForDate = (med, day) => {
  if (med.status !== "Active") return false;
  const dayStart = startOfDay(day);
  if (med.startDate && startOfDay(med.startDate) > dayStart) return false;
  if (med.endDate && startOfDay(med.endDate) < dayStart) return false;
  return true;
};

const roundPercent = (part, whole) => {
  if (!whole) return null;
  return Math.round((part / whole) * 1000) / 10;
};

const buildDateRange = (days) => {
  const to = endOfDay(new Date());
  const from = startOfDay(new Date());
  from.setDate(from.getDate() - (days - 1));
  return { from, to };
};

const buildMedicationSummary = async (elderId, from, to) => {
  const now = new Date();
  const logs = await MedicationDoseLog.find({
    elder: elderId,
    scheduledDate: { $gte: from, $lte: to },
  })
    .select("scheduledDate scheduledTime status")
    .sort({ scheduledDate: 1, scheduledTime: 1 })
    .lean();

  const buckets = new Map();
  for (let cursor = startOfDay(from); cursor <= startOfDay(to); cursor.setDate(cursor.getDate() + 1)) {
    const key = dateKey(cursor);
    buckets.set(key, {
      date: key,
      label: shortDateLabel(cursor),
      taken: 0,
      missed: 0,
      skipped: 0,
      pending: 0,
      overduePending: 0,
      recorded: 0,
      adherence: null,
    });
  }

  let taken = 0;
  let missed = 0;
  let skipped = 0;
  let pending = 0;
  let overduePending = 0;

  for (const log of logs) {
    const scheduledAt = combineDateAndTime(log.scheduledDate, log.scheduledTime);
    const isPastOrNow = scheduledAt <= now;
    const key = dateKey(log.scheduledDate);
    const bucket = buckets.get(key);
    if (!bucket) continue;

    if (log.status === "Taken" && isPastOrNow) {
      taken += 1;
      bucket.taken += 1;
      bucket.recorded += 1;
    } else if (log.status === "Missed" && isPastOrNow) {
      missed += 1;
      bucket.missed += 1;
      bucket.recorded += 1;
    } else if (log.status === "Skipped" && isPastOrNow) {
      skipped += 1;
      bucket.skipped += 1;
      bucket.recorded += 1;
    } else if (log.status === "Pending") {
      if (isPastOrNow) {
        overduePending += 1;
        bucket.overduePending += 1;
      } else {
        pending += 1;
        bucket.pending += 1;
      }
    }
  }

  for (const bucket of buckets.values()) {
    bucket.adherence = roundPercent(bucket.taken, bucket.recorded);
  }

  const recorded = taken + missed + skipped;

  return {
    adherence: roundPercent(taken, recorded),
    taken,
    missed,
    skipped,
    pending,
    overduePending,
    recorded,
    scheduledLogs: logs.length,
    trend: [...buckets.values()],
  };
};

const buildAppointmentSummary = async (elderId) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const [appointments, nextAppointment] = await Promise.all([
    DoctorAppointment.find({
      elder: elderId,
      appointmentDate: { $gte: monthStart, $lte: monthEnd },
    })
      .select("doctorName reason appointmentDate status")
      .sort({ appointmentDate: 1 })
      .lean(),
    DoctorAppointment.findOne({
      elder: elderId,
      status: "Upcoming",
      appointmentDate: { $gte: now },
    })
      .select("doctorName reason appointmentDate status")
      .sort({ appointmentDate: 1 })
      .lean(),
  ]);

  const counts = {
    Upcoming: 0,
    Completed: 0,
    Cancelled: 0,
  };

  let pastDue = 0;
  for (const appointment of appointments) {
    if (Object.hasOwn(counts, appointment.status)) {
      counts[appointment.status] += 1;
    }
    if (
      appointment.status === "Upcoming" &&
      new Date(appointment.appointmentDate) < now
    ) {
      pastDue += 1;
    }
  }

  return {
    period: monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    upcoming: counts.Upcoming,
    completed: counts.Completed,
    cancelled: counts.Cancelled,
    pastDue,
    total: appointments.length,
    nextAppointment,
    chart: [
      { status: "Upcoming", value: counts.Upcoming },
      { status: "Completed", value: counts.Completed },
      { status: "Cancelled", value: counts.Cancelled },
    ],
  };
};

const buildMoodAndHealthSummary = async (elderId, from, to) => {
  const now = new Date();
  const [trendRows, latestMood, recentActivity, recentHealthUpdate] = await Promise.all([
    MoodCheckin.find({ elder: elderId, date: { $gte: from, $lte: to } })
      .select("date overallMood physicalCondition energyLevel appetite")
      .sort({ date: 1 })
      .lean(),
    MoodCheckin.findOne({ elder: elderId })
      .select("date overallMood physicalCondition energyLevel appetite issues notes")
      .sort({ date: -1 })
      .lean(),
    Activity.findOne({ elder: elderId, schedule: { $lte: now } })
      .select("activity duration schedule completed completedAt")
      .sort({ schedule: -1 })
      .lean(),
    HealthActivity.findOne({ elder: elderId })
      .select("type message createdAt")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const moodTrend = trendRows
    .filter((row) => MOOD_SCORES[row.overallMood] != null)
    .map((row) => ({
      date: row.date,
      label: shortDateLabel(row.date),
      mood: row.overallMood,
      score: MOOD_SCORES[row.overallMood],
      physicalCondition: row.physicalCondition,
      energyLevel: row.energyLevel,
    }));

  return {
    healthSummary: {
      latestMood,
      recentActivity,
      recentHealthUpdate,
    },
    moodTrend,
  };
};

const buildRoutineSummary = async (elderId) => {
  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);
  const dayName = DAY_NAMES[dayStart.getDay()];

  const [meals, activities, appointments, activeMeds, doseLogs] = await Promise.all([
    MealSchedule.find({ elder: elderId, day: dayName }).select("_id").lean(),
    Activity.find({ elder: elderId, schedule: { $gte: dayStart, $lte: dayEnd } })
      .select("completed")
      .lean(),
    DoctorAppointment.find({
      elder: elderId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
    })
      .select("status")
      .lean(),
    Medication.find({ elder: elderId, status: "Active" })
      .select("status startDate endDate scheduledTimes frequency")
      .lean(),
    MedicationDoseLog.find({
      elder: elderId,
      scheduledDate: { $gte: dayStart, $lte: dayEnd },
    })
      .select("medication status")
      .lean(),
  ]);

  const loggedMedIds = new Set(doseLogs.map((log) => String(log.medication)));
  let fallbackMedicationItems = 0;

  for (const med of activeMeds) {
    if (!isMedicationActiveForDate(med, dayStart)) continue;
    if (loggedMedIds.has(String(med._id))) continue;
    const times = med.scheduledTimes?.length
      ? med.scheduledTimes
      : defaultTimesForFrequency(med.frequency);
    fallbackMedicationItems += times.length;
  }

  const medicationItems = doseLogs.length + fallbackMedicationItems;
  const medicationCompleted = doseLogs.filter((dose) => dose.status === "Taken").length;
  const activityCompleted = activities.filter((activity) => activity.completed).length;
  const appointmentCompleted = appointments.filter((appt) => appt.status === "Completed").length;

  // Meals are visible in Daily Routine, but the current meal model has no completion field.
  // They are included in the scheduled-item count but not in the completion denominator.
  const trackableTotal = medicationItems + activities.length + appointments.length;
  const completed = medicationCompleted + activityCompleted + appointmentCompleted;

  return {
    completed,
    total: trackableTotal,
    percentage: roundPercent(completed, trackableTotal),
    scheduledItems: trackableTotal + meals.length,
    untrackedMealItems: meals.length,
    breakdown: {
      medications: medicationItems,
      activities: activities.length,
      appointments: appointments.length,
      meals: meals.length,
    },
  };
};

export const buildElderDashboard = async (elderId, days) => {
  const { from, to } = buildDateRange(days);

  const [medication, appointments, moodAndHealth, routine] = await Promise.all([
    buildMedicationSummary(elderId, from, to),
    buildAppointmentSummary(elderId),
    buildMoodAndHealthSummary(elderId, from, to),
    buildRoutineSummary(elderId),
  ]);

  return {
    range: {
      days,
      from,
      to,
      label: `Last ${days} days`,
    },
    healthSummary: moodAndHealth.healthSummary,
    medication,
    appointments,
    routine,
    charts: {
      medicationAdherence: medication.trend,
      appointmentStats: appointments.chart,
      moodTrend: moodAndHealth.moodTrend,
    },
  };
};
