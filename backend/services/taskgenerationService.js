import Elder from "../models/elder.js";
import Task from "../models/task.js";
import Medication from "../models/medication.js";
import MedicationDoseLog from "../models/medicationDoseLog.js";
import MealSchedule from "../models/mealSchedule.js";
import Activity from "../models/activity.js";
import MoodCheckin from "../models/MoodCheckin.js";
import DoctorAppointment from "../models/DoctorAppointment.js";
import { getActiveCoverageForCaregiver } from "./shiftCoverageService.js";

const OVERDUE_HOURS = 2;
const OVERDUE_MS = OVERDUE_HOURS*60*60*1000;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",];

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

const dateKey = (date = new Date()) => startOfDay(date).toISOString().slice(0, 10);


const priorityFromMinutes = (minutesUntilDue) => {
  if (minutesUntilDue < 0) {
    return { priority: "urgent", priorityScore: 100 + Math.min(Math.abs(minutesUntilDue), 200) };
  }
  if (minutesUntilDue <= 60) {
    return { priority: "high", priorityScore: 70 };
  }
  if (minutesUntilDue <= 180) {
    return { priority: "medium", priorityScore: 40 };
  }
  return { priority: "low", priorityScore: 10 };
};


const combineDateAndTime = (day, timeStr) => {
  const [h, m] = (timeStr || "09:00").split(":").map((n) => parseInt(n, 10));
  const d = new Date(day);
  d.setHours(Number.isNaN(h) ? 9 : h, Number.isNaN(m) ? 0 : m, 0, 0);
  return d;
};


const upsertTask = async (taskData) => {
  return Task.findOneAndUpdate(
    {
      elder: taskData.elder,
      dedupeKey: taskData.dedupeKey,
    },
    {
      // continously can make val change
      $set: {
        title: taskData.title,
        reason: taskData.reason,
        priority: taskData.priority,
        priorityScore: taskData.priorityScore,
        dueAt: taskData.dueAt,
      },

      // Once upon a time
      $setOnInsert: {
        elder: taskData.elder,
        caregiver: taskData.caregiver,
        type: taskData.type,
        source: taskData.source,
        relatedRef: taskData.relatedRef,
        dedupeKey: taskData.dedupeKey,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

// Generate task for meds
const generateMedicationTasks = async (elder, now) => {
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const doses = await MedicationDoseLog.find({
    elder: elder._id,
    scheduledDate: { $gte: dayStart, $lte: dayEnd },
    status: "Pending",
  }).populate("medication", "name dosage instructions");

  const tasks = [];
  for (const dose of doses) {
    const dueAt = combineDateAndTime(dayStart, dose.scheduledTime);
    const minutesUntilDue = Math.round((dueAt - now) / 60000);
    const { priority, priorityScore } = priorityFromMinutes(minutesUntilDue);
    const medName = dose.medication?.name || "medication";

    tasks.push(
      await upsertTask({
        elder: elder._id,
        caregiver: elder.caregiver,
        type: "medication",
        title: `Give ${medName} (${dose.medication?.dosage || ""})`.trim(),
        reason:
          minutesUntilDue < 0
            ? `Dose was due at ${dose.scheduledTime} and hasn't been logged.`
            : `Dose scheduled at ${dose.scheduledTime}.`,
        priority,
        priorityScore,
        dueAt,
        source: "automated",
        relatedRef: { refModel: "MedicationDoseLog", refId: dose._id },
        dedupeKey: `medication:${dose._id}`,
      })
    );
  }
  return tasks;
};

// timely meal eat check
const generateMealTasks = async (elder, now) => {
  const todayName = DAY_NAMES[now.getDay()];
  const meals = await MealSchedule.find({ elder: elder._id, day: todayName });

  const tasks = [];
  for (const meal of meals) {
    const dueAt = combineDateAndTime(now, meal.time);
    const minutesUntilDue = Math.round((dueAt - now) / 60000);
    const { priority, priorityScore } = priorityFromMinutes(minutesUntilDue);

    tasks.push(
      await upsertTask({
        elder: elder._id,
        caregiver: elder.caregiver,
        type: "meal",
        title: `Serve ${meal.mealType.toLowerCase()}: ${meal.food}`,
        reason: `${meal.mealType} scheduled at ${meal.time}.`,
        priority,
        priorityScore,
        dueAt,
        source: "automated",
        relatedRef: { refModel: "MealSchedule", refId: meal._id },
        dedupeKey: `meal:${meal._id}:${dateKey(now)}`,
      })
    );
  }
  return tasks;
};

// Exercise / activities scheduled check
const generateExerciseTasks = async (elder, now) => {
  const activities = await Activity.find({
    elder: elder._id,
    schedule: { $gte: startOfDay(now), $lte: endOfDay(now) },
    completed: false,
  });

  const tasks = [];
  for (const activity of activities) {
    const minutesUntilDue = Math.round((activity.schedule - now) / 60000);
    const { priority, priorityScore } = priorityFromMinutes(minutesUntilDue);

    tasks.push(
      await upsertTask({
        elder: elder._id,
        caregiver: elder.caregiver,
        type: "exercise",
        title: `Assist with activity: ${activity.activity}`,
        reason: `${activity.duration} min activity scheduled today.`,
        priority,
        priorityScore,
        dueAt: activity.schedule,
        source: "automated",
        relatedRef: { refModel: "Activity", refId: activity._id },
        dedupeKey: `exercise:${activity._id}`,
      })
    );
  }
  return tasks;
};

//doc's appointment
const generateDoctorAppointmentTasks = async (elder, now) => {
  const appointments = await DoctorAppointment.find({
    elder: elder._id,
    status: "Upcoming",
    appointmentDate: { $gte: startOfDay(now), $lte: endOfDay(now) },
  });

  const tasks = [];
  for (const appointment of appointments) {
    const minutesUntilDue = Math.round((appointment.appointmentDate - now) / 60000);
    const { priority, priorityScore } = priorityFromMinutes(minutesUntilDue);

    tasks.push(
      await upsertTask({
        elder: elder._id,
        caregiver: elder.caregiver,
        type: "doctor_appointment",
        title: `Doctor's appointment with ${appointment.doctorName}`,
        reason: appointment.reason || `Appointment scheduled today.`,
        priority,
        priorityScore,
        dueAt: appointment.appointmentDate,
        source: "automated",
        relatedRef: { refModel: "DoctorAppointment", refId: appointment._id },
        dedupeKey: `doctor_appointment:${appointment._id}`,
      })
    );
  }
  return tasks;
};
//check if mood was logged and low mood follow up
const generateMoodTasks = async (elder, now) => {
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const tasks = [];

  const todaysCheckin = await MoodCheckin.findOne({
    elder: elder._id,
    date: { $gte: dayStart, $lte: dayEnd },
  }).sort({ date: -1 });

  if (!todaysCheckin) {
    tasks.push(
      await upsertTask({
        elder: elder._id,
        caregiver: elder.caregiver,
        type: "mood_checkin",
        title: "Log today's mood check-in",
        reason: "No mood check-in logged yet today.",
        priority: "low",
        priorityScore: 15,
        dueAt: combineDateAndTime(now, "18:00"),
        source: "automated",
        relatedRef: { refModel: "MoodCheckin", refId: null },
        dedupeKey: `mood_checkin:${elder._id}:${dateKey(now)}`,
      })
    );
    return tasks;
  }

  const lowMood = ["Low", "Very Low"].includes(todaysCheckin.overallMood);
  const lowEnergy = ["Very Low"].includes(todaysCheckin.energyLevel);

  if (lowMood || lowEnergy) {
    const severe = todaysCheckin.overallMood === "Very Low" || lowEnergy;
    tasks.push(
      await upsertTask({
        elder: elder._id,
        caregiver: elder.caregiver,
        type: "emotional_support",
        title: "Check in / provide emotional support",
        reason: `Today's mood check-in reported "${todaysCheckin.overallMood}" mood${
          lowEnergy ? " and very low energy" : ""
        }.`,
        priority: severe ? "urgent" : "high",
        priorityScore: severe ? 95 : 75,
        dueAt: now,
        source: "automated",
        relatedRef: { refModel: "MoodCheckin", refId: todaysCheckin._id },
        dedupeKey: `emotional_support:${todaysCheckin._id}`,
      })
    );
  }
  return tasks;
};

//for a single elder.
export const generateTasksForElder = async (elderId) => {
  const elder = await Elder.findById(elderId);
  if (!elder) return [];

  const now = new Date();
  const results = await Promise.all([
    generateMedicationTasks(elder, now),
    generateMealTasks(elder, now),
    generateExerciseTasks(elder, now),
    generateDoctorAppointmentTasks(elder, now),
    generateMoodTasks(elder, now),
  ]);

  return results.flat();
};

const flagOverdueTasksIncomplete = async (caregiverId, now) => {
  await Task.updateMany(
    {
      caregiver: caregiverId,
      status: "pending",
      dueAt: { $lte: new Date(now.getTime() - OVERDUE_MS) },
    },
    { $set: { status: "incomplete" } }
  );
};

export const generateDailyTasksForCaregiver = async (caregiverId) => {
  const elders = await Elder.find({ caregiver: caregiverId }).select("_id");

  for (const elder of elders) {
    await generateTasksForElder(elder._id);
  }

  const now = new Date();
  await flagOverdueTasksIncomplete(caregiverId, now);

  const ownTasks = await Task.find({
    caregiver: caregiverId,
    createdAt: { $gte: startOfDay(now) },
  })
    .sort({ status: 1, priorityScore: -1, dueAt: 1 })
    .populate("elder", "fullName elderID")
    .lean();

  
  const activeCoverage = await getActiveCoverageForCaregiver(caregiverId, now);

  let coverageTasks = [];
  if (activeCoverage.length) {
    const coverageElderIds = activeCoverage.map((c) => c.elder._id);

   
    for (const elderId of coverageElderIds) {
      await generateTasksForElder(elderId);
    }

    const coverageByElder = new Map(
      activeCoverage.map((c) => [String(c.elder._id), c])
    );

    const rawCoverageTasks = await Task.find({
      elder: { $in: coverageElderIds },
      createdAt: { $gte: startOfDay(now) },
      status: { $ne: "completed" },
    })
      .populate("elder", "fullName elderID")
      .lean();

    coverageTasks = rawCoverageTasks
      .filter((task) => {
        const coverage = coverageByElder.get(String(task.elder._id));
        return coverage && task.dueAt >= coverage.startAt && task.dueAt <= coverage.endAt;
      })
      .map((task) => {
        const coverage = coverageByElder.get(String(task.elder._id));
        return {
          ...task,
          isCoverage: true,
          coverageInfo: {
            originalCaregiver: coverage.originalCaregiver,
            handoverLog: coverage.swapRequest?.handoverLog || null,
            startAt: coverage.startAt,
            endAt: coverage.endAt,
          },
        };
      });
  }

  return [...ownTasks, ...coverageTasks].sort(
    (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)
  );
};

export const _internal = { startOfDay, endOfDay, dateKey, priorityFromMinutes, flagOverdueTasksIncomplete };
