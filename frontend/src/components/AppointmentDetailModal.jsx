import { useState } from "react";
import { X, Check, Ban, CheckCircle2 } from "lucide-react";
import Button from "./Button";
import InputField from "./InputField";
import {
  StatusBadge,
  VisitorBadge,
  VisitTimeline,
  formatDate,
  formatTime,
  formatDateInput,
  durationLabel,
  TIME_SLOTS,
  DURATION_OPTIONS,
} from "./AppointmentBadges";

export default function AppointmentDetailModal({
  appointment,
  isCaregiver,
  onClose,
  onStatusChange,
  onSaveEdit,
  actionLoading,
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    purpose: appointment.purpose || "",
    date: formatDateInput(appointment.appointmentDateTime),
    time: formatTime(appointment.appointmentDateTime),
    durationMinutes: appointment.durationMinutes || 60,
    specialNotes: appointment.specialNotes || "",
  });

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const canAct =
    isCaregiver &&
    ["Pending", "Approved"].includes(appointment.status);

  const detailRows = [
    ["Visitor", appointment.visitor?.name || "—"],
    ["Email", appointment.visitor?.email || "—"],
    ["Phone", appointment.visitor?.phone || "—"],
    ["Elder", appointment.elder?.fullName],
    ["Purpose", appointment.purpose],
    ["Date", formatDate(appointment.appointmentDateTime)],
    ["Time", formatTime(appointment.appointmentDateTime)],
    ["Duration", durationLabel(appointment.durationMinutes)],
    ["Notes", appointment.specialNotes || "—"],
    ["Approved by", appointment.approvedBy?.name || "—"],
    [
      "Approval time",
      appointment.approvalTime
        ? new Date(appointment.approvalTime).toLocaleString()
        : "—",
    ],
  ];

  if (appointment.status === "Rejected" && appointment.rejectionReason) {
    detailRows.push(["Rejection reason", appointment.rejectionReason]);
  }
  if (appointment.caregiverResponse) {
    detailRows.push(["Caregiver's note", appointment.caregiverResponse]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-paper-card shadow-lg">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink">
              Appointment details
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={appointment.status} />
              <VisitorBadge badge={appointment.visitorBadge} />
              {appointment.countdown && (
                <span className="text-xs font-medium text-primary">
                  {appointment.countdown}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <VisitTimeline status={appointment.status} />

          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                size="md"
                label="Date"
                type="date"
                name="date"
                value={form.date}
                onChange={update}
                mono
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Time
                </label>
                <select
                  name="time"
                  value={form.time}
                  onChange={update}
                  className="w-full rounded-lg border border-border bg-paper-card px-3.5 py-2.5 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Duration
                </label>
                <select
                  name="durationMinutes"
                  value={form.durationMinutes}
                  onChange={update}
                  className="w-full rounded-lg border border-border bg-paper-card px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <InputField
                  size="md"
                  label="Purpose"
                  name="purpose"
                  as="textarea"
                  rows={2}
                  value={form.purpose}
                  onChange={update}
                />
              </div>
              <div className="sm:col-span-2">
                <InputField
                  size="md"
                  label="Special notes"
                  name="specialNotes"
                  as="textarea"
                  rows={2}
                  value={form.specialNotes}
                  onChange={update}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {detailRows.map(([label, value]) => (
                <div
                  key={label}
                  className={`rounded-lg border border-border bg-paper px-3.5 py-3 ${
                    ["Purpose", "Notes", "Rejection reason", "Caregiver's note"].includes(label)
                      ? "sm:col-span-2"
                      : ""
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                    {label}
                  </p>
                  <div className="mt-1 text-sm font-medium text-ink">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="md"
                fullWidth={false}
                onClick={() => setEditing(false)}
                disabled={actionLoading}
              >
                Cancel edit
              </Button>
              <Button
                size="md"
                fullWidth={false}
                loading={actionLoading}
                onClick={() =>
                  onSaveEdit(appointment._id, {
                    ...form,
                    durationMinutes: Number(form.durationMinutes),
                  }).then(() => setEditing(false))
                }
              >
                Save changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="md" fullWidth={false} onClick={onClose}>
                Close
              </Button>
              {isCaregiver &&
                !["Completed", "Cancelled", "Rejected"].includes(appointment.status) && (
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth={false}
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              {canAct && appointment.status === "Pending" && (
                <>
                  <Button
                    variant="danger"
                    size="md"
                    fullWidth={false}
                    icon={Ban}
                    loading={actionLoading}
                    onClick={() => onStatusChange(appointment._id, "Rejected")}
                  >
                    Reject
                  </Button>
                  <Button
                    size="md"
                    fullWidth={false}
                    icon={Check}
                    loading={actionLoading}
                    onClick={() => onStatusChange(appointment._id, "Approved")}
                  >
                    Approve
                  </Button>
                </>
              )}
              {canAct && appointment.status === "Approved" && (
                <Button
                  size="md"
                  fullWidth={false}
                  icon={CheckCircle2}
                  loading={actionLoading}
                  onClick={() => onStatusChange(appointment._id, "Completed")}
                >
                  Mark completed
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
