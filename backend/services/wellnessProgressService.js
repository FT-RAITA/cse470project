import MedicationDoseLog from "../models/medicationDoseLog.js";
import MoodCheckin from "../models/MoodCheckin.js";
import Activity from "../models/activity.js";
import DoctorAppointment from "../models/DoctorAppointment.js";

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`;
};

const pct = (part, whole) => {
  if (!whole || whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
};

const arrow = (curr, prev) => {
  if (curr == null || prev == null) return "";
  const d = curr - prev;
  if (d > 1) return "↗";
  if (d < -1) return "↘";
  return "→";
};

const weekLabel = (weeksAgo) => {
  if (weeksAgo === 0) return "This week";
  if (weeksAgo === 1) return "Last week";
  return `${weeksAgo} wks ago`;
};

const buildWeeks = (weeks = 4) => {
  const result = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const end = endOfDay(new Date(now));
    end.setDate(end.getDate() - i * 7);
    const start = startOfDay(new Date(end));
    start.setDate(start.getDate() - 6);
    result.push({ label: weekLabel(i), from: start, to: end });
  }
  return result;
};

const medAdherence = async (elderId, from, to) => {
  const logs = await MedicationDoseLog.find({
    elder: elderId,
    scheduledDate: { $gte: from, $lte: to },
    status: { $in: ["Taken", "Missed", "Skipped"] },
  }).select("status scheduledDate");

  const taken = logs.filter((l) => l.status === "Taken").length;
  const missed = logs.filter((l) => l.status === "Missed").length;
  const skipped = logs.filter((l) => l.status === "Skipped").length;
  const weekendMissed = logs.filter((l) => {
    if (l.status !== "Missed") return false;
    const day = new Date(l.scheduledDate).getDay();
    return day === 0 || day === 6;
  }).length;

  return {
    value: pct(taken, logs.length),
    taken,
    missed,
    skipped,
    total: logs.length,
    weekendMissed,
  };
};

const activityStats = async (elderId, from, to) => {
  const completed = await Activity.countDocuments({
    elder: elderId,
    completed: true,
    completedAt: { $gte: from, $lte: to },
  });
  return { value: completed, completed };
};

const moodStats = async (elderId, from, to) => {
  const rows = await MoodCheckin.find({
    elder: elderId,
    date: { $gte: from, $lte: to },
  }).select("date");
  const days = new Set(rows.map((r) => dayKey(r.date))).size;
  return { value: days, days };
};

const appointmentStats = async (elderId, from, to) => {
  const rows = await DoctorAppointment.find({
    elder: elderId,
    appointmentDate: { $gte: from, $lte: to },
    status: { $ne: "Cancelled" },
  }).select("status appointmentDate");

  const now = new Date();
  let completed = 0;
  let missed = 0;
  for (const row of rows) {
    if (row.status === "Completed") completed += 1;
    else if (new Date(row.appointmentDate) < now) missed += 1;
  }
  const due = completed + missed;
  return {
    value: pct(completed, due),
    scheduled: rows.length,
    completed,
    missed,
    due,
  };
};

const delta = (curr, prev) => {
  if (curr == null || prev == null) return null;
  return Math.round((curr - prev) * 10) / 10;
};

export const buildWellnessProgress = async (elderId) => {
  const weeks = buildWeeks(4);
  const series = { medication: [], activity: [], mood: [], appointments: [] };

  for (const week of weeks) {
    const [med, act, mood, appt] = await Promise.all([
      medAdherence(elderId, week.from, week.to),
      activityStats(elderId, week.from, week.to),
      moodStats(elderId, week.from, week.to),
      appointmentStats(elderId, week.from, week.to),
    ]);
    series.medication.push({ ...week, ...med });
    series.activity.push({ ...week, ...act });
    series.mood.push({ ...week, ...mood });
    series.appointments.push({ ...week, ...appt });
  }

  const latest = (key) => series[key][series[key].length - 1];
  const previous = (key) => series[key][series[key].length - 2];
  const firstWithValue = (key) => series[key].find((row) => row.value != null && row.total !== 0);

  const thisMed = latest("medication");
  const lastMed = previous("medication");
  const thisAct = latest("activity");
  const lastAct = previous("activity");
  const thisMood = latest("mood");
  const lastMood = previous("mood");
  const thisAppt = latest("appointments");
  const lastAppt = previous("appointments");

  const actDeltaWeek = lastAct?.value > 0 || thisAct.value > 0 ? delta(thisAct.value, lastAct?.value ?? 0) : null;

  const firstMed = firstWithValue("medication");
  const medDeltaSpan =
    firstMed && thisMed.total > 0 && firstMed.label !== thisMed.label
      ? delta(thisMed.value, firstMed.value)
      : null;

  const changes = [];

  if (medDeltaSpan != null && Math.abs(medDeltaSpan) >= 5) {
    changes.push({
      tone: medDeltaSpan > 0 ? "positive" : "attention",
      title: medDeltaSpan > 0 ? "Medication improving" : "Medication declining",
      detail: `Adherence moved from ${firstMed.value}% to ${thisMed.value}% across weeks with logged doses.`,
    });
  }

  if (actDeltaWeek != null && lastAct?.value > 0 && Math.abs(actDeltaWeek) >= 2) {
    changes.push({
      tone: actDeltaWeek > 0 ? "positive" : "attention",
      title: actDeltaWeek > 0 ? "More activities completed" : "Fewer activities completed",
      detail: `${lastAct.value} last week → ${thisAct.value} this week.`,
    });
  }

  if (thisAppt.due > 0) {
    changes.push({
      tone: thisAppt.missed === 0 ? "positive" : "attention",
      title: "Appointments",
      detail: `${thisAppt.completed} completed, ${thisAppt.missed} missed of ${thisAppt.due} due this week.`,
    });
  }

  if (thisMed.missed >= 3 && thisMed.weekendMissed > thisMed.missed - thisMed.weekendMissed) {
    changes.push({
      tone: "attention",
      title: "Weekend missed doses",
      detail: `${thisMed.weekendMissed} of ${thisMed.missed} missed doses this week were on weekends.`,
    });
  }

  return {
    overview: {
      medication: {
        label: "Medication",
        display: thisMed.value == null ? "—" : `${thisMed.value}%`,
        arrow: arrow(thisMed.value, lastMed?.total > 0 ? lastMed.value : null),
      },
      activity: {
        label: "Activity",
        display: `${thisAct.value}`,
        arrow: arrow(thisAct.value, lastAct ? lastAct.value : null),
      },
      appointments: {
        label: "Appointments",
        display: thisAppt.value == null ? "—" : `${thisAppt.value}%`,
        arrow: arrow(thisAppt.value, lastAppt?.due > 0 ? lastAppt.value : null),
        scheduled: thisAppt.scheduled,
        completed: thisAppt.completed,
        missed: thisAppt.missed,
      },
      mood: {
        label: "Mood days",
        display: `${thisMood.value}`,
        arrow: arrow(thisMood.value, lastMood ? lastMood.value : null),
      },
    },
    series: {
      medication: series.medication,
      activity: series.activity,
      mood: series.mood,
    },
    changes,
  };
};
