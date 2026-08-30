import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MOOD_BY_SCORE = {
  1: "Very Low",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Great",
};

export default function MoodTrendChart({ data = [], rangeLabel = "" }) {
  return (
    <section className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-ink">Mood trend</h3>
      <p className="mt-1 text-xs text-ink-soft">{rangeLabel}. Stored mood labels are unchanged.</p>

      {!data.length ? (
        <p className="py-16 text-center text-sm text-ink-soft">No recent mood check-ins.</p>
      ) : (
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ee-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--ee-ink-soft)" />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 10 }}
                stroke="var(--ee-ink-soft)"
                tickFormatter={(value) => MOOD_BY_SCORE[value] || value}
                width={64}
              />
              <Tooltip
                formatter={(_value, _name, item) => [item.payload.mood, "Mood"]}
                labelFormatter={(label, payload) => {
                  const row = payload?.[0]?.payload;
                  if (!row?.date) return label;
                  return new Date(row.date).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  });
                }}
                contentStyle={{
                  backgroundColor: "var(--ee-paper-card)",
                  borderColor: "var(--ee-border)",
                  borderRadius: "8px",
                  color: "var(--ee-ink)",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--ee-accent)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
