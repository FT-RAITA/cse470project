export const pct = (part, whole) => {
  if (!whole || whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
};

export const calculatePerformanceScore = ({
  tasksAssigned = 0,
  tasksCompleted = 0,
  tasksMissed = 0,
  onTimeCompleted = 0,
  shiftsScheduled = 0,
  shiftsCompleted = 0,
  shiftsMissed = 0,
  attendanceRate: attendanceOverride,
}) => {
  const hasTasks = tasksAssigned > 0;
  const hasShifts = shiftsScheduled > 0;

  const completionRate = hasTasks ? pct(tasksCompleted, tasksAssigned) : 0;
  const onTimeRate = hasTasks
    ? tasksCompleted > 0
      ? pct(onTimeCompleted, tasksCompleted)
      : 0
    : 0;
  const missedPenaltyRate = hasTasks ? Math.max(0, 100 - pct(tasksMissed, tasksAssigned)) : 0;

  const pastShifts = shiftsCompleted + shiftsMissed;
  const attendanceRate = hasShifts
    ? typeof attendanceOverride === "number"
      ? attendanceOverride
      : pastShifts > 0
        ? pct(shiftsCompleted, pastShifts)
        : 100
    : 0;

  if (!hasTasks && !hasShifts) {
    return {
      score: 0,
      level: "No activity",
      breakdown: {
        taskCompletion: 0,
        onTimeCompletion: 0,
        shiftAttendance: 0,
        missedTasks: 0,
      },
      weights: {
        taskCompletion: 40,
        onTimeCompletion: 25,
        shiftAttendance: 20,
        missedTasks: 15,
      },
    };
  }

  const parts = [];
  if (hasTasks) {
    parts.push({ value: completionRate, weight: 40 });
    parts.push({ value: onTimeRate, weight: 25 });
    parts.push({ value: missedPenaltyRate, weight: 15 });
  }
  if (hasShifts) {
    parts.push({ value: attendanceRate, weight: 20 });
  }

  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  const score = Math.round(
    parts.reduce((sum, part) => sum + part.value * (part.weight / totalWeight), 0)
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
      shiftAttendance: attendanceRate,
      missedTasks: missedPenaltyRate,
    },
    weights: {
      taskCompletion: 40,
      onTimeCompletion: 25,
      shiftAttendance: 20,
      missedTasks: 15,
    },
  };
};

export const deriveBadges = ({
  score,
  tasksMissed,
  onTimeRate,
  attendanceRate,
  isWeeklyWinner,
  tasksAssigned = 0,
  shiftsScheduled = 0,
}) => {
  const hasWork = tasksAssigned > 0 || shiftsScheduled > 0;
  const badges = [];
  if (isWeeklyWinner && hasWork) {
    badges.push({ id: "cotw", label: "Caregiver of the Week", icon: "trophy" });
  }
  if (hasWork && score >= 90) {
    badges.push({ id: "excellence", label: "Excellence", icon: "star" });
  }
  if (tasksAssigned > 0 && tasksMissed === 0) {
    badges.push({ id: "perfect", label: "Perfect Week", icon: "target" });
  }
  if (tasksAssigned > 0 && onTimeRate >= 95) {
    badges.push({ id: "ontime", label: "On-Time Champion", icon: "clock" });
  }
  if (shiftsScheduled > 0 && attendanceRate >= 95 && score >= 85) {
    badges.push({ id: "care", label: "Outstanding Care", icon: "heart" });
  }
  return badges;
};
