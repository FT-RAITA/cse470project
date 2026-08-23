import ShiftCoverage from "../../models/shiftCoverage.js";
import { SEED_ACTIVITIES, SEED_TREND, findSeedByKey, findSeedByName, SEED_TEAM } from "./seedData.js";
import { calculatePerformanceScore } from "./scoreCalculator.js";

const formatTime = (d) => {
  const dt = new Date(d);
  return dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const dayLabel = (d) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`;
};

const mapTaskActivity = (t) => {
  const statusRaw = String(t.status || "pending");
  let status = "Pending";
  if (statusRaw.toLowerCase() === "completed") status = "Completed";
  else if (statusRaw.toLowerCase() === "incomplete") status = "Missed";
  else if (statusRaw.toLowerCase() === "cancelled") status = "Cancelled";
  else if (new Date(t.dueAt) < new Date() && statusRaw.toLowerCase() === "pending") {
    status = "Missed";
  }
  return {
    time: formatTime(t.dueAt),
    sortAt: new Date(t.dueAt).getTime(),
    title: t.title,
    elder: t.elder?.fullName || "Elder",
    status,
    category: t.type || "General",
  };
};

export const getCaregiverActivity = async (caregiverId, caregiverName = "", rawTasks = []) => {
  const events = [];

  if (rawTasks?.length) {
    events.push(...rawTasks.map(mapTaskActivity));
  }

  if (!String(caregiverId).startsWith("seed-")) {
    const coverages = await ShiftCoverage.find({
      $or: [{ coveringCaregiver: caregiverId }, { originalCaregiver: caregiverId }],
    })
      .sort({ startAt: -1 })
      .limit(10)
      .populate("elder", "fullName")
      .populate({ path: "swapRequest", select: "handoverLog status" })
      .lean();

    for (const c of coverages) {
      const isCovering = String(c.coveringCaregiver) === String(caregiverId);
      const handoverAt = c.handoverLog?.submittedAt || c.swapRequest?.handoverLog?.submittedAt;
      events.push({
        time: formatTime(handoverAt || c.startAt),
        sortAt: new Date(handoverAt || c.startAt).getTime(),
        title: isCovering ? "Coverage shift accepted" : "Shift covered by teammate",
        elder: c.elder?.fullName || "Elder",
        status: handoverAt ? "Completed" : "Pending",
        category: "Coverage",
      });
    }
  }

  if (events.length) {
    return events.sort((a, b) => b.sortAt - a.sortAt).slice(0, 20).map(({ sortAt, ...rest }) => rest);
  }

  if (String(caregiverId).startsWith("seed-")) {
    const key =
      findSeedByKey(caregiverId)?.seedKey ||
      findSeedByName(caregiverName)?.seedKey ||
      SEED_TEAM[1].seedKey;
    return SEED_ACTIVITIES[key] || SEED_ACTIVITIES["seed-aritra"];
  }

  return [];
};

export const getCaregiverTrend = (caregiverId, caregiverName = "", rawTasks = []) => {
  if (rawTasks?.length) {
    const buckets = new Map();
    const now = new Date();

    for (const t of rawTasks) {
      const key = dayKey(t.dueAt);
      if (!buckets.has(key)) {
        buckets.set(key, {
          label: dayLabel(t.dueAt),
          sort: new Date(t.dueAt).setHours(0, 0, 0, 0),
          completed: 0,
          missed: 0,
          assigned: 0,
          onTime: 0,
        });
      }
      const b = buckets.get(key);
      b.assigned += 1;
      const status = String(t.status || "").toLowerCase();
      if (status === "completed") {
        b.completed += 1;
        if (t.completedAt && t.dueAt && new Date(t.completedAt) <= new Date(t.dueAt)) b.onTime += 1;
        else if (!t.completedAt) b.onTime += 1;
      } else if (status === "incomplete" || (status === "pending" && new Date(t.dueAt) < now)) {
        b.missed += 1;
      }
    }

    return [...buckets.values()]
      .sort((a, b) => a.sort - b.sort)
      .map((b) => {
        const { score } = calculatePerformanceScore({
          tasksAssigned: b.assigned,
          tasksCompleted: b.completed,
          tasksMissed: b.missed,
          onTimeCompleted: b.onTime,
          shiftsScheduled: 0,
          shiftsCompleted: 0,
        });
        return {
          label: b.label,
          completed: b.completed,
          missed: b.missed,
          score,
        };
      });
  }

  if (String(caregiverId).startsWith("seed-")) {
    const key =
      findSeedByKey(caregiverId)?.seedKey ||
      findSeedByName(caregiverName)?.seedKey ||
      SEED_TEAM[1].seedKey;
    return SEED_TREND[key] || SEED_TREND["seed-aritra"];
  }

  return [];
};
