import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#24463F", "#C99A3C", "#B5544A", "#3E6B5F", "#4C7A9E"];

function formatShort(d) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ChartCard({ title, children, empty }) {
  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="mb-4 font-display text-lg font-semibold text-ink">{title}</h3>
      {empty ? (
        <p className="flex h-48 items-center justify-center text-sm text-ink-soft">
          Not enough data yet. Add vitals or diagnoses to see trends.
        </p>
      ) : (
        <div className="h-56">{children}</div>
      )}
    </div>
  );
}

export default function HealthCharts({ analytics }) {
  const bp = (analytics?.bpTrend || []).map((p) => ({
    ...p,
    label: formatShort(p.date),
  }));
  const weight = (analytics?.weightTrend || []).map((p) => ({
    ...p,
    label: formatShort(p.date),
  }));
  const conditions = analytics?.conditions || [];

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <ChartCard title="Blood pressure trend" empty={bp.length < 1}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={bp}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4DFCF" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#5C6B65" />
            <YAxis tick={{ fontSize: 11 }} stroke="#5C6B65" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="systolic"
              stroke="#24463F"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Systolic"
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke="#C99A3C"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Diastolic"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Medical conditions" empty={conditions.length < 1}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={conditions}
              dataKey="value"
              nameKey="name"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={3}
            >
              {conditions.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Weight progress" empty={weight.length < 1}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weight}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4DFCF" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#5C6B65" />
            <YAxis tick={{ fontSize: 11 }} stroke="#5C6B65" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#3E6B5F"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Weight (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
