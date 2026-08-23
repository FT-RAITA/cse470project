export default function ScoreRing({ score = 0, level = "Needs Improvement", breakdown = {} }) {
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, score) / 100) * circumference;

  const rows = [
    { label: "Task Completion", value: breakdown.taskCompletion },
    { label: "On-Time Completion", value: breakdown.onTimeCompletion },
    { label: "Shift Attendance", value: breakdown.shiftAttendance },
    { label: "Missed Tasks", value: breakdown.missedTasks },
  ];

  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-ink">Performance score</h3>
      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-semibold text-ink">{score}</span>
            <span className="text-[10px] uppercase tracking-wider text-ink-soft">/ 100</span>
          </div>
        </div>
        <div className="flex-1 w-full">
          <p className="text-sm font-semibold text-primary">{level}</p>
          <ul className="mt-3 space-y-2">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">{r.label}</span>
                <span className="font-semibold text-ink">{r.value ?? 0}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-ink-soft">
            Weights: Completion 40% · On-time 25% · Attendance 20% · Missed 15%
          </p>
        </div>
      </div>
    </div>
  );
}
