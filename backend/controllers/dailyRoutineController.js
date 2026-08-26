import Elder from "../models/elder.js";
import MealSchedule from "../models/mealSchedule.js";
import Medication from "../models/medication.js";
import MedicationDoseLog from "../models/medicationDoseLog.js";
import Activity from "../models/activity.js";
import DoctorAppointment from "../models/DoctorAppointment.js";

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Caregiver or a connected family member can view the routine
const assertReadAccess = (elderId, userId) =>
  Elder.findOne({
    _id: elderId,
    $or: [{ caregiver: userId }, { "familyMembers.user": userId }],
  }).select("_id fullName elderID caregiver");

const timeStringToMinutes = (time) => {
  const [h, m] = String(time).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
};

// GET 
export const getDailyRoutine = async (req, res) => {
  try {
    const { elderId } = req.params;

    const elder = await assertReadAccess(elderId, req.user.id);
    if (!elder) {
      return res.status(404).json({ message: "Elder not found" });
    }

    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    if (Number.isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: "Invalid date." });
    }

    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);
    const dayName = DAY_NAMES[dayStart.getDay()];

    const [meals, activities, appointments, activeMeds, doseLogs] = await Promise.all([
      MealSchedule.find({ elder: elderId, day: dayName }),
      Activity.find({ elder: elderId, schedule: { $gte: dayStart, $lte: dayEnd } }),
      DoctorAppointment.find({
        elder: elderId,
        appointmentDate: { $gte: dayStart, $lte: dayEnd },
      }),
      Medication.find({ elder: elderId, status: "Active" }),
      MedicationDoseLog.find({
        elder: elderId,
        scheduledDate: { $gte: dayStart, $lte: dayEnd },
      }).populate("medication", "name dosage"),
    ]);

    const routine = [];

    // Meals
    for (const meal of meals) {
      const mins = timeStringToMinutes(meal.time);
      routine.push({
        type: "meal",
        minutes: mins,
        time: formatTime(mins),
        title: `${meal.mealType}: ${meal.food}`,
        subtitle: meal.notes || "",
        status: null,
        refId: meal._id,
      });
    }

    // Medications — prefer logged doses for the day; fall back to the
    // medication's own scheduledTimes if no dose log exists yet.
    const loggedMedIds = new Set(
      doseLogs.map((log) => String(log.medication?._id || log.medication))
    );

    for (const log of doseLogs) {
      const mins = timeStringToMinutes(log.scheduledTime);
      routine.push({
        type: "medication",
        minutes: mins,
        time: formatTime(mins),
        title: log.medication?.name || "Medication",
        subtitle: log.medication?.dosage || "",
        status: log.status,
        refId: log._id,
      });
    }

    for (const med of activeMeds) {
      if (loggedMedIds.has(String(med._id))) continue;
      for (const time of med.scheduledTimes || []) {
        const mins = timeStringToMinutes(time);
        routine.push({
          type: "medication",
          minutes: mins,
          time: formatTime(mins),
          title: med.name,
          subtitle: med.dosage,
          status: "Pending",
          refId: med._id,
        });
      }
    }

    // exercise
    for (const activity of activities) {
      const activityDate = new Date(activity.schedule);
      const mins = activityDate.getHours() * 60 + activityDate.getMinutes();
      routine.push({
        type: "activity",
        minutes: mins,
        time: formatTime(mins),
        title: activity.activity,
        subtitle: `${activity.duration} min`,
        status: activity.completed ? "Completed" : "Pending",
        refId: activity._id,
      });
    }

    // Doctor appointments
    for (const appt of appointments) {
      const apptDate = new Date(appt.appointmentDate);
      const mins = apptDate.getHours() * 60 + apptDate.getMinutes();
      routine.push({
        type: "appointment",
        minutes: mins,
        time: formatTime(mins),
        title: `Dr. ${appt.doctorName}`,
        subtitle: appt.reason,
        status: appt.status,
        refId: appt._id,
      });
    }

    routine.sort((a, b) => a.minutes - b.minutes);

    return res.json({
      elder: { _id: elder._id, fullName: elder.fullName, elderID: elder.elderID },
      date: dayStart,
      day: dayName,
      routine,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};