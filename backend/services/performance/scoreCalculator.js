export const pct = (part, whole) => {
  if (!whole || whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
};

const WEIGHTS = {
  taskCompletion: 50,
  onTimeCompletion: 35,
  missedTasks: 15,
};

export const calculatePerformanceScore = ({
  tasksAssigned = 0,
  tasksCompleted = 0,
  tasksMissed = 0,
  onTimeCompleted = 0,
}) => {
  const hasTasks = tasksAssigned > 0;

  const completionRate = hasTasks ? pct(tasksCompleted, tasksAssigned) : 0;
  const onTimeRate =
    hasTasks && tasksCompleted > 0 ? pct(onTimeCompleted, tasksCompleted) : 0;

  const workedTasks = tasksCompleted + tasksMissed;
  const missedPenaltyRate =
    hasTasks && workedTasks > 0
      ? Math.max(0, 100 - pct(tasksMissed, tasksAssigned))
      : 0;

  if (!hasTasks) {
    return {
      score: 0,
      level: "No activity",
      breakdown: {
        taskCompletion: 0,
        onTimeCompletion: 0,
        missedTasks: 0,
      },
      weights: { ...WEIGHTS },
    };
  }

  const score = Math.round(
    completionRate * (WEIGHTS.taskCompletion / 100) +
      onTimeRate * (WEIGHTS.onTimeCompletion / 100) +
      missedPenaltyRate * (WEIGHTS.missedTasks / 100)
  );

  let level = "Needs Improvement";
  if (score >= 90) level = "Excellent";
  else if (score >= 75) level = "Good";

  return {
    score: Math.min(100, Math.max(0, score)),
    level,
    breakdown: {
      taskCompletion: completionRate,
      onTimeCompletion: onTimeRate,
      missedTasks: missedPenaltyRate,
    },
    weights: { ...WEIGHTS },
  };
};

export const deriveBadges = ({
  score,
  tasksMissed,
  onTimeRate,
  isWeeklyWinner,
  tasksAssigned = 0,
}) => {
  const badges = [];
  if (isWeeklyWinner && tasksAssigned > 0) {
    badges.push({ id: "cotw", label: "Caregiver of the Week", icon: "trophy" });
  }
  if (tasksAssigned > 0 && score >= 90) {
    badges.push({ id: "excellence", label: "Excellence", icon: "star" });
  }
  if (tasksAssigned > 0 && tasksMissed === 0 && score > 0) {
    badges.push({ id: "perfect", label: "Perfect Week", icon: "target" });
  }
  if (tasksAssigned > 0 && onTimeRate >= 95) {
    badges.push({ id: "ontime", label: "On-Time Champion", icon: "clock" });
  }
  return badges;
};
