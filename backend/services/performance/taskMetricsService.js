import Task from "../../models/task.js";
import ShiftCoverage from "../../models/shiftCoverage.js";
import "../../models/elder.js";
import { findSeedByKey, findSeedByName } from "./seedData.js";
import { pct } from "./scoreCalculator.js";

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

export const resolveRange = (period = "7d") => {
  const to = endOfDay(new Date());
  const from = startOfDay(new Date());
  if (period === "30d") from.setDate(from.getDate() - 29);
  else if (period === "month") from.setDate(1);
  else from.setDate(from.getDate() - 6);
  return { from, to, period };
};

const emptyTaskMetrics = (source = "database") => ({
  source,
  tasksAssigned: 0,
  tasksCompleted: 0,
  tasksMissed: 0,
  tasksPending: 0,
  tasksCancelled: 0,
  onTimeCompleted: 0,
  completionRate: 0,
  onTimeRate: 0,
  coverageTasks: 0,
  rawTasks: [],
});

const tallyTasks = (tasks) => {
  const now = new Date();
  let tasksCompleted = 0;
  let tasksMissed = 0;
  let tasksPending = 0;
  let tasksCancelled = 0;
  let onTimeCompleted = 0;

  for (const t of tasks) {
    const status = String(t.status || "").toLowerCase();
    if (status === "completed") {
      tasksCompleted += 1;
      if (t.completedAt && t.dueAt && new Date(t.completedAt) <= new Date(t.dueAt)) {
        onTimeCompleted += 1;
      } else if (!t.completedAt) {
        onTimeCompleted += 1;
      }
    } else if (status === "incomplete") {
      tasksMissed += 1;
    } else if (status === "cancelled") {
      tasksCancelled += 1;
    } else if (status === "pending") {
      if (new Date(t.dueAt) < now) tasksMissed += 1;
      else tasksPending += 1;
    }
  }

  const tasksAssigned = tasks.length;
  return {
    tasksAssigned,
    tasksCompleted,
    tasksMissed,
    tasksPending,
    tasksCancelled,
    onTimeCompleted,
    completionRate: pct(tasksCompleted, tasksAssigned),
    onTimeRate: pct(onTimeCompleted, Math.max(tasksCompleted, 1)),
  };
};

export const getCaregiverTaskMetrics = async (caregiverId, { from, to }, caregiverName = "") => {
  if (String(caregiverId).startsWith("seed-")) {
    const seed = findSeedByKey(caregiverId) || findSeedByName(caregiverName);
    if (!seed) return emptyTaskMetrics("seed");
    return {
      source: "seed",
      tasksAssigned: seed.tasksAssigned,
      tasksCompleted: seed.tasksCompleted,
      tasksMissed: seed.tasksMissed,
      tasksPending: seed.tasksPending,
      tasksCancelled: seed.tasksCancelled,
      onTimeCompleted: seed.onTimeCompleted,
      completionRate: pct(seed.tasksCompleted, seed.tasksAssigned),
      onTimeRate: pct(seed.onTimeCompleted, Math.max(seed.tasksCompleted, 1)),
      coverageTasks: 0,
      rawTasks: [],
    };
  }

  const ownTasks = await Task.find({
    caregiver: caregiverId,
    dueAt: { $gte: from, $lte: to },
  }).populate("elder", "fullName");

  const coverages = await ShiftCoverage.find({
    coveringCaregiver: caregiverId,
    startAt: { $lte: to },
    endAt: { $gte: from },
  })
    .select("elder startAt endAt")
    .lean();

  let coverageTasks = [];
  if (coverages.length) {
    const elderIds = [...new Set(coverages.map((c) => String(c.elder)))];
    const candidates = await Task.find({
      elder: { $in: elderIds },
      caregiver: { $ne: caregiverId },
      dueAt: { $gte: from, $lte: to },
    }).populate("elder", "fullName");

    coverageTasks = candidates.filter((task) =>
      coverages.some(
        (c) =>
          String(c.elder) === String(task.elder?._id || task.elder) &&
          new Date(task.dueAt) >= new Date(c.startAt) &&
          new Date(task.dueAt) <= new Date(c.endAt)
      )
    );
  }

  const seen = new Set();
  const merged = [];
  for (const t of [...ownTasks, ...coverageTasks]) {
    const id = String(t._id);
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(t);
  }

  if (!merged.length) return emptyTaskMetrics("database");

  const tallied = tallyTasks(merged);
  return {
    source: "database",
    ...tallied,
    coverageTasks: coverageTasks.length,
    rawTasks: merged,
  };
};
