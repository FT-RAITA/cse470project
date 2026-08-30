import { PDFDocument, registerStdFonts } from "pdfkit";
import Helvetica from "pdfkit/standard-fonts/Helvetica";
import HelveticaBold from "pdfkit/standard-fonts/HelveticaBold";

// PDFKit 0.20+ requires standard-font metrics to be registered explicitly
// in environments that do not preload them. Register the only two fonts
// used by this report before any PDFDocument instance is created.
registerStdFonts(Helvetica, HelveticaBold);

const PAGE_MARGIN = 48;
const CONTENT_WIDTH = 612 - PAGE_MARGIN * 2;

const safeText = (value, fallback = "Not available") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const formatPercent = (value) =>
  value === null || value === undefined ? "Not available" : `${value}%`;

const formatDate = (value, options = {}) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
};

const formatDateTime = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const cleanFilenamePart = (value) =>
  safeText(value, "elder")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "elder";

const ensureSpace = (doc, requiredHeight = 80) => {
  const bottom = doc.page.height - PAGE_MARGIN;
  if (doc.y + requiredHeight > bottom) {
    doc.addPage();
  }
};

const sectionTitle = (doc, title) => {
  ensureSpace(doc, 45);
  doc.moveDown(0.45);
  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor("#24324a")
    .text(title, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.35);
  doc
    .strokeColor("#d7dde8")
    .lineWidth(0.7)
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y)
    .stroke();
  doc.moveDown(0.55);
};

const keyValue = (doc, label, value, options = {}) => {
  const { indent = 0, valueColor = "#1f2937" } = options;
  ensureSpace(doc, 24);
  const x = PAGE_MARGIN + indent;
  const labelWidth = 150;
  const rowY = doc.y;

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor("#667085")
    .text(label, x, rowY, { width: labelWidth });

  const valueHeight = doc.heightOfString(safeText(value), {
    width: CONTENT_WIDTH - indent - labelWidth - 8,
  });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(valueColor)
    .text(safeText(value), x + labelWidth, rowY, {
      width: CONTENT_WIDTH - indent - labelWidth,
    });

  doc.y = rowY + Math.max(14, valueHeight) + 5;
};

const note = (doc, text) => {
  if (!text) return;
  ensureSpace(doc, 34);
  const y = doc.y;
  const height = doc.heightOfString(text, { width: CONTENT_WIDTH - 22 }) + 14;
  doc
    .roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, height, 5)
    .fillAndStroke("#f7f8fb", "#e2e6ee");
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#667085")
    .text(text, PAGE_MARGIN + 11, y + 7, { width: CONTENT_WIDTH - 22 });
  doc.y = y + height + 7;
};

const summaryBox = (doc, title, rows) => {
  ensureSpace(doc, 115);
  const startY = doc.y;
  const boxHeight = Math.max(96, 32 + rows.length * 21);

  doc
    .roundedRect(PAGE_MARGIN, startY, CONTENT_WIDTH, boxHeight, 7)
    .fillAndStroke("#fbfcfe", "#dfe4ec");
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#334155")
    .text(title, PAGE_MARGIN + 14, startY + 12, { width: CONTENT_WIDTH - 28 });

  let y = startY + 34;
  for (const [label, value] of rows) {
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#667085").text(label, PAGE_MARGIN + 14, y, {
      width: 145,
    });
    doc.font("Helvetica").fontSize(9.5).fillColor("#1f2937").text(safeText(value), PAGE_MARGIN + 160, y, {
      width: CONTENT_WIDTH - 176,
    });
    y += 20;
  }

  doc.y = startY + boxHeight + 8;
};

const drawTableHeader = (doc, columns, y) => {
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 24).fill("#eef2f7");
  let x = PAGE_MARGIN;
  for (const column of columns) {
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor("#475467")
      .text(column.label, x + 5, y + 7, {
        width: column.width - 10,
        align: column.align || "left",
      });
    x += column.width;
  }
  return y + 24;
};

const drawTable = (doc, columns, rows, emptyMessage) => {
  if (!rows.length) {
    doc.font("Helvetica").fontSize(10).fillColor("#667085").text(emptyMessage);
    doc.moveDown(0.6);
    return;
  }

  let y = doc.y;
  ensureSpace(doc, 60);
  y = doc.y;
  y = drawTableHeader(doc, columns, y);

  rows.forEach((row, index) => {
    const cells = columns.map((column) => safeText(row[column.key], "-"));
    const heights = cells.map((cell, cellIndex) =>
      doc.heightOfString(cell, { width: columns[cellIndex].width - 10 })
    );
    const rowHeight = Math.max(22, Math.max(...heights) + 10);

    if (y + rowHeight > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      y = doc.y;
      y = drawTableHeader(doc, columns, y);
    }

    if (index % 2 === 1) {
      doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight).fill("#fafbfd");
    }

    let x = PAGE_MARGIN;
    columns.forEach((column, cellIndex) => {
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#344054")
        .text(cells[cellIndex], x + 5, y + 6, {
          width: column.width - 10,
          align: column.align || "left",
        });
      x += column.width;
    });

    doc
      .strokeColor("#e7eaf0")
      .lineWidth(0.5)
      .moveTo(PAGE_MARGIN, y + rowHeight)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH, y + rowHeight)
      .stroke();

    y += rowHeight;
  });

  doc.y = y + 8;
};

const addFooter = (doc) => {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 30;
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#98a2b3")
      .text(
        `Elder Ease Health Dashboard Report  |  Page ${i + 1} of ${range.count}`,
        PAGE_MARGIN,
        footerY,
        { width: CONTENT_WIDTH, align: "center" }
      );
  }
};

export const dashboardPdfFilename = (elderName, rangeKey) =>
  `elder-ease-health-${cleanFilenamePart(elderName)}-${rangeKey}.pdf`;

export const streamDashboardPdf = ({ res, elder, dashboard, rangeKey }) => {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: {
      top: PAGE_MARGIN,
      bottom: PAGE_MARGIN,
      left: PAGE_MARGIN,
      right: PAGE_MARGIN,
    },
    bufferPages: true,
    info: {
      Title: `Health Dashboard Report - ${safeText(elder.fullName, "Elder")}`,
      Author: "Elder Ease",
      Subject: "Elder health dashboard summary",
    },
  });

  doc.pipe(res);

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#20304a")
    .text("ELDER EASE", { align: "left" });
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#3f5f8f")
    .text("Health Dashboard Report", { align: "left" });
  doc.moveDown(0.3);
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#667085")
    .text(`Generated: ${formatDateTime(new Date())}`);
  doc
    .strokeColor("#cfd7e3")
    .lineWidth(1)
    .moveTo(PAGE_MARGIN, doc.y + 8)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y + 8)
    .stroke();
  doc.moveDown(1.2);

  sectionTitle(doc, "Elder Information");
  keyValue(doc, "Name", elder.fullName);
  keyValue(doc, "Elder ID", elder.elderID);
  keyValue(doc, "Age", elder.age);
  keyValue(doc, "Gender", elder.gender);
  keyValue(doc, "Dashboard Range", dashboard.range?.label || `Last ${dashboard.range?.days || ""} days`);
  keyValue(doc, "Range Dates", `${formatDate(dashboard.range?.from)} - ${formatDate(dashboard.range?.to)}`);

  sectionTitle(doc, "Health and Mood Summary");
  const mood = dashboard.healthSummary?.latestMood;
  const recentActivity = dashboard.healthSummary?.recentActivity;
  const healthUpdate = dashboard.healthSummary?.recentHealthUpdate;

  summaryBox(doc, "Latest Health Context", [
    ["Latest mood", mood ? `${safeText(mood.overallMood)} (${formatDate(mood.date)})` : "No recent mood check-ins"],
    ["Physical condition", mood?.physicalCondition || "Not available"],
    ["Energy level", mood?.energyLevel || "Not available"],
    ["Appetite", mood?.appetite || "Not available"],
    [
      "Recent activity",
      recentActivity
        ? `${safeText(recentActivity.activity)} - ${recentActivity.completed ? "Completed" : "Not completed"}`
        : "No recent activity",
    ],
    ["Last health update", healthUpdate?.message || "No recent health update"],
  ]);

  sectionTitle(doc, "Medication Adherence");
  const medication = dashboard.medication || {};
  summaryBox(doc, "Medication Summary", [
    ["Overall adherence", formatPercent(medication.adherence)],
    ["Taken", medication.taken ?? 0],
    ["Missed", medication.missed ?? 0],
    ["Skipped", medication.skipped ?? 0],
    ["Upcoming pending", medication.pending ?? 0],
    ["Past due / unrecorded", medication.overduePending ?? 0],
  ]);

  if (medication.adherence == null) {
    note(doc, "No medication adherence percentage is shown because there are no recorded eligible dose outcomes for this period.");
  }
  if ((medication.overduePending || 0) > 0) {
    note(
      doc,
      `${medication.overduePending} past medication dose${medication.overduePending === 1 ? " is" : "s are"} still recorded as Pending. The dashboard does not automatically classify these doses as missed.`
    );
  }

  sectionTitle(doc, "Medication Adherence Trend");
  const medicationRows = (dashboard.charts?.medicationAdherence || []).map((row) => ({
    date: row.label || formatDate(row.date, { year: undefined }),
    adherence: formatPercent(row.adherence),
    taken: row.taken ?? 0,
    missed: row.missed ?? 0,
    skipped: row.skipped ?? 0,
    pending: row.pending ?? 0,
  }));
  drawTable(
    doc,
    [
      { key: "date", label: "Date", width: 88 },
      { key: "adherence", label: "Adherence", width: 86 },
      { key: "taken", label: "Taken", width: 72, align: "center" },
      { key: "missed", label: "Missed", width: 72, align: "center" },
      { key: "skipped", label: "Skipped", width: 80, align: "center" },
      { key: "pending", label: "Upcoming", width: 118, align: "center" },
    ],
    medicationRows,
    "No medication adherence data available for this range."
  );

  sectionTitle(doc, "Doctor Appointments");
  const appointments = dashboard.appointments || {};
  const nextAppointment = appointments.nextAppointment;
  summaryBox(doc, `Appointment Summary - ${appointments.period || "Current month"}`, [
    ["Upcoming", appointments.upcoming ?? 0],
    ["Completed", appointments.completed ?? 0],
    ["Cancelled", appointments.cancelled ?? 0],
    ["Past due but stored Upcoming", appointments.pastDue ?? 0],
    ["Total this period", appointments.total ?? 0],
    [
      "Next appointment",
      nextAppointment
        ? `Dr. ${safeText(nextAppointment.doctorName)} - ${formatDateTime(nextAppointment.appointmentDate)}${nextAppointment.reason ? ` - ${nextAppointment.reason}` : ""}`
        : "No upcoming doctor appointment",
    ],
  ]);
  note(
    doc,
    "The current doctor appointment model uses the statuses Upcoming, Completed, and Cancelled. The report does not invent a separate Missed status."
  );

  drawTable(
    doc,
    [
      { key: "status", label: "Status", width: 258 },
      { key: "value", label: "Count", width: 258, align: "center" },
    ],
    (dashboard.charts?.appointmentStats || []).map((row) => ({
      status: row.status,
      value: row.value ?? 0,
    })),
    "No doctor appointments recorded for this period."
  );

  sectionTitle(doc, "Today's Routine");
  const routine = dashboard.routine || {};
  summaryBox(doc, "Daily Routine Completion", [
    ["Completion", formatPercent(routine.percentage)],
    ["Completed trackable items", `${routine.completed ?? 0} / ${routine.total ?? 0}`],
    ["All scheduled items", routine.scheduledItems ?? 0],
    ["Medication items", routine.breakdown?.medications ?? 0],
    ["Activities", routine.breakdown?.activities ?? 0],
    ["Doctor appointments", routine.breakdown?.appointments ?? 0],
    ["Meal items", routine.breakdown?.meals ?? 0],
  ]);
  if ((routine.untrackedMealItems || 0) > 0) {
    note(
      doc,
      `${routine.untrackedMealItems} meal item${routine.untrackedMealItems === 1 ? " is" : "s are"} included in today's schedule, but the current meal model has no completion field, so meals are not included in the completion percentage denominator.`
    );
  }

  sectionTitle(doc, "Mood Trend");
  const moodRows = (dashboard.charts?.moodTrend || []).map((row) => ({
    date: row.label || formatDate(row.date),
    mood: row.mood,
    physical: row.physicalCondition,
    energy: row.energyLevel,
  }));
  drawTable(
    doc,
    [
      { key: "date", label: "Date", width: 96 },
      { key: "mood", label: "Mood", width: 120 },
      { key: "physical", label: "Physical Condition", width: 150 },
      { key: "energy", label: "Energy", width: 150 },
    ],
    moodRows,
    "No recent mood check-ins for this range."
  );

  sectionTitle(doc, "Report Notes");
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#667085")
    .text(
      "This report summarizes information already stored in Elder Ease. It does not create or infer medical vital signs that are not present in the application's data. Dashboard calculations follow the same logic used by the on-screen health dashboard.",
      { width: CONTENT_WIDTH, lineGap: 2 }
    );

  addFooter(doc);
  doc.end();
};
