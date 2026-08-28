const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const rankMedal = (rank) => {
  const n = Number(rank);
  if (n === 1) {
    return {
      label: "GOLD",
      subtitle: "1st Place",
      fill: "#F0C24B",
      stroke: "#B8860B",
      glow: "rgba(240,194,75,0.45)",
    };
  }
  if (n === 2) {
    return {
      label: "SILVER",
      subtitle: "2nd Place",
      fill: "#C9D2D8",
      stroke: "#7B8894",
      glow: "rgba(201,210,216,0.35)",
    };
  }
  if (n === 3) {
    return {
      label: "BRONZE",
      subtitle: "3rd Place",
      fill: "#D08A45",
      stroke: "#8A4F1D",
      glow: "rgba(208,138,69,0.4)",
    };
  }
  return null;
};

export const buildHtmlReport = (payload) => {
  const {
    caregiverName,
    periodLabel,
    summary,
    scoreInfo,
    badges,
    weeklyWinner,
    rank,
    generatedAt,
  } = payload;

  const medal = rankMedal(rank);
  const badgeList =
    (badges || []).map((b) => escapeHtml(b.label)).join(" · ") || "No badges earned yet";
  const cotw =
    weeklyWinner && weeklyWinner.name === caregiverName
      ? "Caregiver of the Week"
      : weeklyWinner
        ? `Weekly leader: ${escapeHtml(weeklyWinner.name)} (${weeklyWinner.score}/100)`
        : "No weekly leader yet";

  const medalBlock = medal
    ? `<div style="width:110px;height:110px;border-radius:999px;background:${medal.fill};border:4px solid ${medal.stroke};box-shadow:0 0 0 8px ${medal.glow},0 16px 40px rgba(0,0,0,0.45);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#071412;text-align:center;flex-shrink:0;font-family:Arial,Helvetica,sans-serif;">
         <div style="font-size:15px;font-weight:800;letter-spacing:0.12em;">${medal.label}</div>
         <div style="font-size:12px;margin-top:4px;font-weight:600;">${medal.subtitle}</div>
       </div>`
    : `<div style="padding:16px 18px;border-radius:14px;background:#12352D;border:1px solid #1F4A3F;color:#A8F0D0;font-family:Arial,Helvetica,sans-serif;font-weight:700;letter-spacing:0.06em;align-self:flex-start;">
         ${rank ? `RANK #${escapeHtml(rank)}` : "UNRANKED"}
       </div>`;

  const breakdown = scoreInfo?.breakdown || {};
  const weights = scoreInfo?.weights || {};

  const row = (label, value, weight = null) =>
    `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #1F4A3F;color:#E8F7F0;">${escapeHtml(label)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #1F4A3F;color:#E8F7F0;text-align:right;font-weight:700;">${escapeHtml(value)}</td>
      ${
        weight == null
          ? ""
          : `<td style="padding:12px 0;border-bottom:1px solid #1F4A3F;color:#8BB5A6;text-align:right;">${escapeHtml(weight)}</td>`
      }
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Elder Ease Performance Report</title>
</head>
<body style="margin:0;background:#071412;color:#E8F7F0;font-family:Georgia,'Times New Roman',serif;">
  <div style="min-height:100vh;padding:40px 20px 56px;background:radial-gradient(circle at top right, rgba(61,220,151,0.22), transparent 42%), linear-gradient(160deg,#06110f 0%,#071412 45%,#0a1c18 100%);">
    <div style="max-width:880px;margin:0 auto;background:linear-gradient(180deg,#0E2A24,#0b221d 30%,#071412);border:1px solid #1F4A3F;border-radius:24px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.45);">

      <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding:36px 40px 28px;border-bottom:2px solid #3DDC97;background:linear-gradient(120deg,rgba(61,220,151,0.12),transparent 55%);">
        <div>
          <div style="letter-spacing:0.28em;font-size:12px;font-weight:800;color:#3DDC97;margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;">ELDER EASE</div>
          <h1 style="margin:0;font-size:34px;line-height:1.15;color:#E8F7F0;">Caregiver Performance Report</h1>
          <p style="margin:12px 0 0;color:#8BB5A6;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(periodLabel)} · Generated ${escapeHtml(generatedAt)}</p>
        </div>
        ${medalBlock}
      </div>

      <div style="padding:28px 40px 40px;">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-end;background:#12352D;border:1px solid #1F4A3F;border-radius:18px;padding:22px 24px;margin-bottom:18px;">
          <div>
            <div style="margin:0 0 8px;color:#8BB5A6;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Caregiver</div>
            <div style="font-size:28px;color:#E8F7F0;">${escapeHtml(caregiverName)}</div>
          </div>
          <div style="text-align:right;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:46px;line-height:1;font-weight:800;color:#3DDC97;">${escapeHtml(scoreInfo?.score ?? 0)}<span style="font-size:18px;color:#8BB5A6;font-weight:600;">/100</span></div>
            <div style="margin-top:8px;color:#8BB5A6;font-size:13px;">${escapeHtml(scoreInfo?.level || "—")}</div>
          </div>
        </div>

        <div style="background:#12352D;border:1px solid #1F4A3F;border-radius:18px;padding:22px 24px;margin-bottom:18px;">
          <h2 style="margin:0 0 14px;font-size:18px;color:#3DDC97;">Score Breakdown</h2>
          <table style="width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:13px;">
            <tr>
              <th style="padding:12px 0;border-bottom:1px solid #1F4A3F;color:#8BB5A6;text-align:left;">Metric</th>
              <th style="padding:12px 0;border-bottom:1px solid #1F4A3F;color:#8BB5A6;text-align:right;">Value</th>
              <th style="padding:12px 0;border-bottom:1px solid #1F4A3F;color:#8BB5A6;text-align:right;">Weight</th>
            </tr>
            ${row("Task Completion", `${breakdown.taskCompletion ?? 0}%`, `${weights.taskCompletion ?? 50}%`)}
            ${row("On-Time Completion", `${breakdown.onTimeCompletion ?? 0}%`, `${weights.onTimeCompletion ?? 35}%`)}
            ${row("Missed Tasks Score", `${breakdown.missedTasks ?? 0}%`, `${weights.missedTasks ?? 15}%`)}
          </table>
        </div>

        <div style="background:#12352D;border:1px solid #1F4A3F;border-radius:18px;padding:22px 24px;margin-bottom:18px;">
          <h2 style="margin:0 0 14px;font-size:18px;color:#3DDC97;">Task Statistics</h2>
          <table style="width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:13px;">
            ${row("Tasks Assigned", summary?.tasksAssigned ?? 0)}
            ${row("Tasks Completed", summary?.tasksCompleted ?? 0)}
            ${row("Tasks Missed", summary?.tasksMissed ?? 0)}
            ${row("Pending", summary?.tasksPending ?? 0)}
            ${row("Completion Rate", `${summary?.completionRate ?? 0}%`)}
            ${row("On-Time Completion", `${summary?.onTimeRate ?? 0}%`)}
          </table>
        </div>

        <div style="background:#12352D;border:1px solid #1F4A3F;border-radius:18px;padding:22px 24px;margin-bottom:8px;">
          <h2 style="margin:0 0 14px;font-size:18px;color:#3DDC97;">Recognition</h2>
          <p style="margin:0 0 8px;color:#8BB5A6;font-size:14px;font-family:Arial,Helvetica,sans-serif;"><strong style="color:#E8F7F0;">Badges:</strong> ${badgeList}</p>
          <p style="margin:0;color:#8BB5A6;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${cotw}</p>
          ${
            medal
              ? `<p style="margin:14px 0 0;color:${medal.fill};font-size:14px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Leaderboard medal: ${medal.label} (${medal.subtitle})</p>`
              : ""
          }
        </div>

        <p style="margin:18px 0 0;text-align:center;color:#8BB5A6;font-size:12px;font-family:Arial,Helvetica,sans-serif;">Elder Ease · Care Operations Performance Module</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};
