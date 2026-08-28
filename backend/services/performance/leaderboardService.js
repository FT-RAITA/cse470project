import User from "../../models/user.js";
import { SEED_TEAM } from "./seedData.js";
import { getCaregiverTaskMetrics, resolveRange } from "./taskMetricsService.js";
import { calculatePerformanceScore, deriveBadges } from "./scoreCalculator.js";

const buildEntry = async (id, name, range, isCurrentUser = false) => {
  const tasks = await getCaregiverTaskMetrics(id, range, name);
  const hasTasks = tasks.tasksAssigned > 0;

  const scoreInfo = calculatePerformanceScore({
    tasksAssigned: tasks.tasksAssigned,
    tasksCompleted: tasks.tasksCompleted,
    tasksMissed: tasks.tasksMissed,
    onTimeCompleted: tasks.onTimeCompleted,
  });

  return {
    caregiverId: id,
    name,
    isCurrentUser,
    tasksAssigned: tasks.tasksAssigned,
    tasksCompleted: tasks.tasksCompleted,
    tasksMissed: tasks.tasksMissed,
    completionRate: tasks.completionRate,
    onTimeRate: tasks.onTimeRate,
    score: hasTasks ? scoreInfo.score : 0,
    level: hasTasks ? scoreInfo.level : "No activity",
    breakdown: scoreInfo.breakdown,
    taskSource: tasks.source,
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

  entries.sort((a, b) => {
    const aHasTasks = a.tasksAssigned > 0 ? 1 : 0;
    const bHasTasks = b.tasksAssigned > 0 ? 1 : 0;
    return (
      bHasTasks - aHasTasks ||
      b.score - a.score ||
      b.completionRate - a.completionRate ||
      b.onTimeRate - a.onTimeRate ||
      b.tasksAssigned - a.tasksAssigned ||
      a.name.localeCompare(b.name)
    );
  });

  const ranked = entries.map((e, i) => ({
    ...e,
    rank: i + 1,
  }));

  const weeklyWinner = ranked.find((e) => e.tasksAssigned > 0) || null;

  ranked.forEach((e) => {
    e.badges = deriveBadges({
      score: e.score,
      tasksMissed: e.tasksMissed,
      onTimeRate: e.onTimeRate,
      isWeeklyWinner: !!weeklyWinner && e.caregiverId === weeklyWinner.caregiverId,
      tasksAssigned: e.tasksAssigned,
    });
  });

  return { range, leaderboard: ranked, weeklyWinner };
};
