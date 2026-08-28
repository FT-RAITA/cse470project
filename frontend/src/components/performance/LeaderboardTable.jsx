export default function LeaderboardTable({ leaderboard = [], loading }) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl border border-border bg-paper-card" />;
  }

  return (
    <div className="rounded-xl border border-border bg-paper-card shadow-sm overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-display text-lg font-semibold text-ink">Caregiver performance leaderboard</h3>
      </div>
      {!leaderboard.length ? (
        <p className="px-5 py-12 text-center text-sm text-ink-soft">No leaderboard data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">Caregiver</th>
                <th className="px-4 py-3 font-semibold">Completion</th>
                <th className="px-4 py-3 font-semibold">On-Time</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => {
                const medal =
                  row.rank === 1 ? "1" : row.rank === 2 ? "2" : row.rank === 3 ? "3" : String(row.rank);
                return (
                  <tr
                    key={`${row.caregiverId}-${row.rank}`}
                    className={`border-t border-border ${row.isCurrentUser ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3 font-semibold text-ink">{medal}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{row.name}</span>
                      {row.isCurrentUser && (
                        <span className="ml-2 text-[10px] font-semibold uppercase text-primary">You</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{row.completionRate}%</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.onTimeRate ?? 0}%</td>
                    <td className="px-4 py-3 font-display text-base font-semibold text-ink">{row.score}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-ink-soft">{row.level}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
