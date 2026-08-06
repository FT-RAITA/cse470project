export default function ProfileCompletion({ percent = 0 }) {
  const size = 96;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={stroke}
          />
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
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-xl font-semibold text-ink">
            {percent}%
          </span>
        </div>
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-ink">
          Profile completion
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Based on available profile fields, records, medications, and reports.
        </p>
      </div>
    </div>
  );
}
