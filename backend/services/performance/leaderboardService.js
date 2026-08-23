import User from "../../models/user.js";
import { SEED_TEAM } from "./seedData.js";
import { getCaregiverTaskMetrics, resolveRange } from "./taskMetricsService.js";
import { getCaregiverShiftMetrics } from "./shiftMetricsService.js";
import { calculatePerformanceScore, deriveBadges } from "./scoreCalculator.js";

const buildEntry = async (id, name, range, isCurrentUser = false) => {
  const tasks = await getCaregiverTaskMetrics(id, range, name);
  const shifts = await getCaregiverShiftMetrics(id, range, name);
  const scoreInfo = calculatePerformanceScore({
    tasksAssigned: tasks.tasksAssigned,
    tasksCompleted: tasks.tasksCompleted,
    tasksMissed: tasks.tasksMissed,
    onTimeCompleted: tasks.onTimeCompleted,
    shiftsScheduled: shifts.shiftsScheduled,
    shiftsCompleted: shifts.shiftsCompleted,
    shiftsMissed: shifts.shiftsMissed,
    attendanceRate: shifts.attendanceRate,
  });

  return {
    caregiverId: id,
    name,
    isCurrentUser,
    tasksAssigned: tasks.tasksAssigned,
    tasksCompleted: tasks.tasksCompleted,
    tasksMissed: tasks.tasksMissed,
    shiftsScheduled: shifts.shiftsScheduled,
    completionRate: tasks.completionRate,
    onTimeRate: tasks.onTimeRate,
    attendanceRate: shifts.attendanceRate,
    score: scoreInfo.score,
    level: scoreInfo.level,
    breakdown: scoreInfo.breakdown,
    taskSource: tasks.source,
    shiftSource: shifts.source,
  };
};

export const buildLeaderboard = async (period = "7d", currentUser = null) => {
  const range = resolveRange(period);
  const entries = [];
  const usedNames = new Set();

  const realCaregivers = await User.find({ role: { $in: ["caregiver", "admin"] } }).select(
    "name email role"
  );

  for (const user of realCaregivers) {
    const entry = await buildEntry(user._id.toString(), user.name, range, false);
    if (currentUser && user._id.toString() === currentUser.id) {
      entry.isCurrentUser = true;
    }
    entries.push(entry);
    usedNames.add(user.name.toLowerCase());
  }

  if (!entries.length) {
    for (const seed of SEED_TEAM) {
      if (usedNames.has(seed.name.toLowerCase())) continue;
      entries.push(await buildEntry(seed.seedKey, seed.name, range, false));
    }
  }

  entries.sort(
    (a, b) =>
      b.score - a.score ||
      b.tasksAssigned - a.tasksAssigned ||
      b.tasksCompleted - a.tasksCompleted ||
      b.completionRate - a.completionRate ||
      a.name.localeCompare(b.name)
  );

  const ranked = entries.map((e, i) => ({
    ...e,
    rank: i + 1,
  }));

  const weeklyWinner =
    ranked.find((e) => e.tasksAssigned > 0 || e.shiftsScheduled > 0) || null;

  ranked.forEach((e) => {
    e.badges = deriveBadges({
      score: e.score,
      tasksMissed: e.tasksMissed,
      onTimeRate: e.onTimeRate,
      attendanceRate: e.attendanceRate,
      isWeeklyWinner: !!weeklyWinner && e.caregiverId === weeklyWinner.caregiverId,
      tasksAssigned: e.tasksAssigned,
      shiftsScheduled: e.shiftsScheduled,
    });
  });

  return { range, leaderboard: ranked, weeklyWinner };
};
