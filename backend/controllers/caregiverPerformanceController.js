import User from "../models/user.js";
import { resolveRange, getCaregiverTaskMetrics } from "../services/performance/taskMetricsService.js";
import { getCaregiverShiftMetrics } from "../services/performance/shiftMetricsService.js";
import { getCaregiverActivity, getCaregiverTrend } from "../services/performance/activityService.js";
import { calculatePerformanceScore, deriveBadges } from "../services/performance/scoreCalculator.js";
import { buildLeaderboard } from "../services/performance/leaderboardService.js";
import { buildHtmlReport } from "../services/performance/reportService.js";

const userId = (user) => String(user?.id || user?._id || "");

const periodLabel = (period) => {
  if (period === "30d") return "Last 30 days";
  if (period === "month") return "This month";
  return "Last 7 days";
};

const canViewDetailed = (reqUser, targetId) => {
  if (reqUser.role === "admin") return true;
  return userId(reqUser) === String(targetId);
};

const resolveTargetCaregiver = async (req) => {
  const requested = req.query.caregiverId || req.params.caregiverId;
  if (!requested || requested === "me") {
    return { id: userId(req.user), name: req.user.name, isSeed: false };
  }

  if (String(requested).startsWith("seed-")) {
    if (req.user.role !== "admin" && String(requested) !== userId(req.user)) {
      return null;
    }
    const { findSeedByKey } = await import("../services/performance/seedData.js");
    const seed = findSeedByKey(requested);
    if (!seed) return null;
    return { id: seed.seedKey, name: seed.name, isSeed: true };
  }

  if (!canViewDetailed(req.user, requested) && req.user.role !== "admin") {
    return { id: userId(req.user), name: req.user.name, isSeed: false, forcedSelf: true };
  }

  const user = await User.findById(requested).select("name role");
  if (!user) return null;
  return { id: user._id.toString(), name: user.name, isSeed: false };
};

const assembleProfile = async (caregiver, period) => {
  const range = resolveRange(period);
  const tasks = await getCaregiverTaskMetrics(caregiver.id, range, caregiver.name);
  const shifts = await getCaregiverShiftMetrics(caregiver.id, range, caregiver.name);
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

  const { leaderboard, weeklyWinner } = await buildLeaderboard(period, {
    id: caregiver.id,
  });

  const selfRank = leaderboard.find(
    (e) => e.caregiverId === caregiver.id || e.name.toLowerCase() === caregiver.name.toLowerCase()
  );

  const isWeeklyWinner = weeklyWinner && weeklyWinner.name.toLowerCase() === caregiver.name.toLowerCase();

  const badges = deriveBadges({
    score: scoreInfo.score,
    tasksMissed: tasks.tasksMissed,
    onTimeRate: tasks.onTimeRate,
    attendanceRate: shifts.attendanceRate,
    isWeeklyWinner: !!isWeeklyWinner,
    tasksAssigned: tasks.tasksAssigned,
    shiftsScheduled: shifts.shiftsScheduled,
  });

  const activity = await getCaregiverActivity(caregiver.id, caregiver.name, tasks.rawTasks);
  const trend = getCaregiverTrend(caregiver.id, caregiver.name, tasks.rawTasks);

  return {
    caregiver: {
      id: caregiver.id,
      name: caregiver.name,
    },
    period,
    periodLabel: periodLabel(period),
    range: { from: range.from, to: range.to },
    summary: {
      tasksAssigned: tasks.tasksAssigned,
      tasksCompleted: tasks.tasksCompleted,
      tasksMissed: tasks.tasksMissed,
      tasksPending: tasks.tasksPending,
      tasksCancelled: tasks.tasksCancelled,
      completionRate: tasks.completionRate,
      onTimeRate: tasks.onTimeRate,
      attendanceRate: shifts.attendanceRate,
      performanceScore: scoreInfo.score,
      performanceLevel: scoreInfo.level,
    },
    scoreInfo,
    shifts,
    taskDistribution: {
      completed: tasks.tasksCompleted,
      pending: tasks.tasksPending,
      missed: tasks.tasksMissed,
      cancelled: tasks.tasksCancelled,
    },
    activity,
    trend,
    badges,
    rank: selfRank?.rank || null,
    weeklyWinner,
    sources: {
      tasks: tasks.source,
      shifts: shifts.source,
    },
  };
};

export const getMyPerformanceDashboard = async (req, res) => {
  try {
    const period = req.query.period || "7d";
    const target = await resolveTargetCaregiver(req);
    if (!target) {
      return res.status(404).json({ message: "Caregiver not found." });
    }

    if (!canViewDetailed(req.user, target.id) && !target.isSeed && req.user.role !== "admin") {
      if (String(target.id) !== userId(req.user)) {
        return res.status(403).json({ message: "Not allowed to view this caregiver's details." });
      }
    }

    const data = await assembleProfile(target, period);

    const caregivers = await User.find({ role: { $in: ["caregiver", "admin"] } })
      .select("name _id")
      .sort({ name: 1 });

    res.json({
      ...data,
      caregivers: caregivers.map((c) => ({ id: c._id, name: c.name })),
      viewer: { id: userId(req.user), name: req.user.name, role: req.user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const period = req.query.period || "7d";
    const data = await buildLeaderboard(period, { id: userId(req.user) });
    const publicBoard = data.leaderboard.map((e) => ({
      rank: e.rank,
      caregiverId: e.caregiverId,
      name: e.name,
      completionRate: e.completionRate,
      attendanceRate: e.attendanceRate,
      score: e.score,
      level: e.level,
      badges: e.badges,
      isCurrentUser: e.name.toLowerCase() === req.user.name.toLowerCase(),
    }));

    res.json({
      period,
      periodLabel: periodLabel(period),
      leaderboard: publicBoard,
      weeklyWinner: data.weeklyWinner
        ? {
            name: data.weeklyWinner.name,
            score: data.weeklyWinner.score,
            level: data.weeklyWinner.level,
            completionRate: data.weeklyWinner.completionRate,
            attendanceRate: data.weeklyWinner.attendanceRate,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWeeklyWinner = async (req, res) => {
  try {
    const period = req.query.period || "7d";
    const data = await buildLeaderboard(period, { id: userId(req.user) });
    if (!data.weeklyWinner) {
      return res.json({ weeklyWinner: null });
    }
    res.json({
      weeklyWinner: {
        name: data.weeklyWinner.name,
        score: data.weeklyWinner.score,
        level: data.weeklyWinner.level,
        message: "Outstanding Care & Support",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActivityFeed = async (req, res) => {
  try {
    const period = req.query.period || "7d";
    const target = await resolveTargetCaregiver(req);
    if (!target) return res.status(404).json({ message: "Caregiver not found." });

    if (!canViewDetailed(req.user, target.id) && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You can only view your own activity timeline.",
      });
    }

    const range = resolveRange(period);
    const tasks = await getCaregiverTaskMetrics(target.id, range, target.name);
    const activity = await getCaregiverActivity(target.id, target.name, tasks.rawTasks);
    res.json({ activity, source: tasks.source });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadPerformanceReport = async (req, res) => {
  try {
    const period = req.query.period || "7d";
    const target = await resolveTargetCaregiver(req);
    if (!target) return res.status(404).json({ message: "Caregiver not found." });

    if (!canViewDetailed(req.user, target.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed to download this report." });
    }

    const profile = await assembleProfile(target, period);
    const html = buildHtmlReport({
      caregiverName: profile.caregiver.name,
      periodLabel: profile.periodLabel,
      summary: profile.summary,
      scoreInfo: profile.scoreInfo,
      shifts: profile.shifts,
      badges: profile.badges,
      weeklyWinner: profile.weeklyWinner,
      rank: profile.rank,
      generatedAt: new Date().toLocaleString(),
    });

    const filename = `elder-ease-performance-${profile.caregiver.name.replace(/\s+/g, "-").toLowerCase()}.html`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(html);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
