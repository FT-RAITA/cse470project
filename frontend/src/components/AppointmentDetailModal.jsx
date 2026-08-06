import { useState } from "react";
import { X, Check, Ban, CheckCircle2 } from "lucide-react";
import Button from "./Button";
import InputField from "./InputField";
import {
  StatusBadge,
  PriorityLabel,
  VisitorBadge,
  VisitTimeline,
  formatDate,
} from "./AppointmentBadges";

const RELATIONS = [
  "Son",
  "Daughter",
  "Spouse",
  "Sibling",
  "Grandchild",
  "Friend",
  "Relative",
  "Other",
];
const DURATIONS = ["30 minutes", "1 hour", "1.5 hours", "2 hours"];
const PRIORITIES = ["Normal", "Important", "Emergency Request"];

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
    visitorName: appointment.visitorName || "",
    visitorEmail: appointment.visitorEmail || "",
    visitorPhone: appointment.visitorPhone || "",
    relation: appointment.relation || "",
    purpose: appointment.purpose || "",
    priority: appointment.priority || "Normal",
    preferredDate: appointment.preferredDate
      ? new Date(appointment.preferredDate).toISOString().slice(0, 10)
      : "",
    preferredTime: appointment.preferredTime || "",
    expectedDuration: appointment.expectedDuration || "1 hour",
    numberOfVisitors: appointment.numberOfVisitors || 1,
    specialNotes: appointment.specialNotes || "",
  });

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const canAct =
    isCaregiver &&
    ["Pending", "Approved"].includes(appointment.status);

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
              <InputField size="md" label="Visitor name" name="visitorName" value={form.visitorName} onChange={update} />
              <InputField size="md" label="Email" name="visitorEmail" value={form.visitorEmail} onChange={update} />
              <InputField size="md" label="Phone" name="visitorPhone" value={form.visitorPhone} onChange={update} mono />
              <InputField size="md" label="Relation" name="relation" as="select" options={RELATIONS} value={form.relation} onChange={update} />
              <InputField size="md" label="Date" type="date" name="preferredDate" value={form.preferredDate} onChange={update} mono />
              <InputField size="md" label="Time" name="preferredTime" value={form.preferredTime} onChange={update} mono />
              <InputField size="md" label="Duration" name="expectedDuration" as="select" options={DURATIONS} value={form.expectedDuration} onChange={update} />
              <InputField size="md" label="Priority" name="priority" as="select" options={PRIORITIES} value={form.priority} onChange={update} />
              <InputField size="md" label="Visitors" type="number" name="numberOfVisitors" value={form.numberOfVisitors} onChange={update} />
              <div className="sm:col-span-2">
                <InputField size="md" label="Purpose" name="purpose" as="textarea" rows={2} value={form.purpose} onChange={update} />
              </div>
              <div className="sm:col-span-2">
                <InputField size="md" label="Special notes" name="specialNotes" as="textarea" rows={2} value={form.specialNotes} onChange={update} />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Visitor", appointment.visitorName],
                ["Email", appointment.visitorEmail],
                ["Phone", appointment.visitorPhone],
                ["Relation", appointment.relation],
                ["Elder", appointment.elder?.fullName],
                ["Purpose", appointment.purpose],
                ["Date", formatDate(appointment.preferredDate)],
                ["Time", appointment.preferredTime],
                ["Duration", appointment.expectedDuration],
                ["Visitors", appointment.numberOfVisitors],
                ["Priority", null],
                ["Notes", appointment.specialNotes || "—"],
                [
                  "Approved by",
                  appointment.approvedBy?.name || "—",
                ],
                [
                  "Approval time",
                  appointment.approvalTime
                    ? new Date(appointment.approvalTime).toLocaleString()
                    : "—",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={`rounded-lg border border-border bg-paper px-3.5 py-3 ${
                    label === "Purpose" || label === "Notes" ? "sm:col-span-2" : ""
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                    {label}
                  </p>
                  <div className="mt-1 text-sm font-medium text-ink">
                    {label === "Priority" ? (
                      <PriorityLabel priority={appointment.priority} />
                    ) : (
                      value
                    )}
                  </div>
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
                    numberOfVisitors: Number(form.numberOfVisitors),
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
