import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#24463F", "#C99A3C", "#B5544A", "#5C6B65"];

export function PerformanceTrendChart({ trend = [] }) {
  if (!trend.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-paper-card p-6 text-sm text-ink-soft">
        No trend data for this period.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="mb-4 font-display text-lg font-semibold text-ink">Performance trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4DFCF" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#5C6B65" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#5C6B65" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="completion" name="Completion %" stroke="#3DDC97" strokeWidth={2} />
            <Line type="monotone" dataKey="onTime" name="On-Time %" stroke="#6BA3D6" strokeWidth={2} />
            <Line type="monotone" dataKey="score" name="Score" stroke="#C99A3C" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TaskDistributionChart({ distribution = {} }) {
  const data = [
    { name: "Completed", value: distribution.completed || 0 },
    { name: "Pending", value: distribution.pending || 0 },
    { name: "Missed", value: distribution.missed || 0 },
    { name: "Cancelled", value: distribution.cancelled || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="mb-4 font-display text-lg font-semibold text-ink">Task distribution</h3>
      {!data.length ? (
        <p className="py-10 text-center text-sm text-ink-soft">No task distribution yet.</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
