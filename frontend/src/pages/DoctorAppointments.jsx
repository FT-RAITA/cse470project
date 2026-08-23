import { useEffect, useMemo, useState } from "react";
import { Plus, Stethoscope, CalendarDays, Trash2, X, Check, Ban } from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { useAuth } from "../context/AuthContext";
import { getAllElders } from "../services/elderService";
import {
  getDoctorAppointments,
  createDoctorAppointment,
  updateDoctorAppointmentStatus,
  deleteDoctorAppointment,
} from "../services/doctorAppointmentService";

const emptyForm = { elder: "", doctorName: "", reason: "", date: "", time: "", notes: "" };

const formatDateTime = (d) =>
  new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function DoctorAppointments() {
  const { token } = useAuth();
  const [elders, setElders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const eldersRes = await getAllElders(token);
        setElders(eldersRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load elders");
      }

      try {
        const apptsRes = await getDoctorAppointments(token);
        setAppointments(apptsRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load appointments");
      }

      setLoading(false);
    };
    if (token) load();
  }, [token]);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const past = [];
    appointments.forEach((a) => {
      if (a.status === "Upcoming" && new Date(a.appointmentDate) >= now) upcoming.push(a);
      else past.push(a);
    });
    upcoming.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
    past.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
    return { upcoming, past };
  }, [appointments]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.elder || !form.doctorName.trim() || !form.reason.trim() || !form.date || !form.time) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      setSaving(true);
      const res = await createDoctorAppointment(
        {
          elder: form.elder,
          doctorName: form.doctorName.trim(),
          reason: form.reason.trim(),
          date: form.date,
          time: form.time,
          notes: form.notes.trim(),
        },
        token
      );
      setAppointments((prev) => [res.data, ...prev]);
      toast.success("Appointment booked");
      setShowForm(false);
      setForm(emptyForm);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not book appointment");
    } finally {
      setSaving(false);
    }
  };

  const markStatus = async (id, status) => {
    try {
      setWorkingId(id);
      const res = await updateDoctorAppointmentStatus(id, status, token);
      setAppointments((prev) => prev.map((a) => (a._id === id ? res.data : a)));
      toast.success(status === "Completed" ? "Marked as completed" : "Appointment cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update appointment");
    } finally {
      setWorkingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setWorkingId(id);
      await deleteDoctorAppointment(id, token);
      setAppointments((prev) => prev.filter((a) => a._id !== id));
      toast.success("Appointment removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove appointment");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-8 py-8 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Doctor's Appointments</h1>
            <p className="mt-1 text-sm text-ink-soft">Book and track doctor visits for your elders</p>
          </div>
          <Button icon={Plus} size="md" fullWidth={false} onClick={() => setShowForm(true)}>
            Book Appointment
          </Button>
        </div>

        {loading ? (
          <div className="h-40 animate-pulse rounded-xl border border-border bg-paper-card" />
        ) : elders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-paper-card p-8 text-center text-sm text-ink-soft">
            Add an elder profile first before booking appointments.
          </div>
        ) : (
          <div className="space-y-8">
            <Section title="Upcoming" items={upcoming} emptyText="No upcoming appointments booked yet.">
              {(appt) => (
                <AppointmentCard
                  key={appt._id}
                  appt={appt}
                  workingId={workingId}
                  onComplete={() => markStatus(appt._id, "Completed")}
                  onCancel={() => markStatus(appt._id, "Cancelled")}
                  onDelete={() => handleDelete(appt._id)}
                />
              )}
            </Section>

            <Section title="Past & Cancelled" items={past} emptyText="Nothing here yet.">
              {(appt) => (
                <AppointmentCard
                  key={appt._id}
                  appt={appt}
                  workingId={workingId}
                  onDelete={() => handleDelete(appt._id)}
                  readOnly
                />
              )}
            </Section>
          </div>
        )}
      </main>

      {showForm && (
        <div
          onClick={() => setShowForm(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl border border-border bg-paper-card p-6 shadow-lg"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Stethoscope size={16} strokeWidth={2} />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">Book a doctor's appointment</h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
                aria-label="Close"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                size="md"
                label="Elder"
                name="elder"
                as="select"
                required
                options={elders.map((e) => e.fullName)}
                value={elders.find((e) => e._id === form.elder)?.fullName || ""}
                onChange={(e) => {
                  const selected = elders.find((el) => el.fullName === e.target.value);
                  update("elder", selected?._id || "");
                }}
              />
              <InputField
                size="md"
                label="Doctor's Name"
                name="doctorName"
                required
                value={form.doctorName}
                onChange={(e) => update("doctorName", e.target.value)}
                placeholder="e.g. Dr. Fahmida Chowdhury"
              />
              <InputField
                size="md"
                label="Reason for Visit"
                name="reason"
                as="textarea"
                rows={2}
                required
                value={form.reason}
                onChange={(e) => update("reason", e.target.value)}
                placeholder="e.g. Routine diabetes checkup"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  size="md"
                  label="Date"
                  name="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                />
                <InputField
                  size="md"
                  label="Time"
                  name="time"
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => update("time", e.target.value)}
                />
              </div>
              <InputField
                size="md"
                label="Notes"
                name="notes"
                as="textarea"
                rows={2}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Anything the doctor or family should know"
              />
              <div className="flex justify-end pt-1">
                <Button type="submit" loading={saving} size="md" fullWidth={false}>
                  Book appointment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, items, emptyText, children }) {
  return (
    <div>
      <h2 className="mb-3 font-display text-lg font-semibold text-ink">{title}</h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-paper-card p-6 text-sm text-ink-soft">
          {emptyText}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(children)}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appt, workingId, onComplete, onCancel, onDelete, readOnly = false }) {
  const isWorking = workingId === appt._id;
  const displayStatus =
    readOnly && appt.status === "Upcoming" ? "Missed" : appt.status;

  return (
    <div className="rounded-xl border border-border bg-paper-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-base font-semibold text-ink">{appt.doctorName}</p>
          <p className="text-xs text-ink-soft">{appt.elder?.fullName}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            displayStatus === "Upcoming"
              ? "bg-primary/10 text-primary"
              : displayStatus === "Completed"
                ? "bg-accent-soft text-primary-dark"
                : "bg-rose-soft text-rose"
          }`}
        >
          {displayStatus}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
        <CalendarDays size={12} strokeWidth={2.5} />
        {formatDateTime(appt.appointmentDate)}
      </div>

      <p className="mt-2 text-sm text-ink-soft">{appt.reason}</p>
      {appt.notes && <p className="mt-1 text-xs text-ink-soft/80">{appt.notes}</p>}

      <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-border pt-3">
        {!readOnly && (
          <>
            <button
              onClick={onComplete}
              disabled={isWorking}
              className="rounded-md p-1.5 text-ink-soft hover:bg-primary/10 hover:text-primary disabled:opacity-50"
              aria-label="Mark completed"
              title="Mark completed"
            >
              <Check size={14} strokeWidth={2} />
            </button>
            <button
              onClick={onCancel}
              disabled={isWorking}
              className="rounded-md p-1.5 text-ink-soft hover:bg-rose-soft hover:text-rose disabled:opacity-50"
              aria-label="Cancel appointment"
              title="Cancel"
            >
              <Ban size={14} strokeWidth={2} />
            </button>
          </>
        )}
        <button
          onClick={onDelete}
          disabled={isWorking}
          className="rounded-md p-1.5 text-ink-soft hover:bg-rose-soft hover:text-rose disabled:opacity-50"
          aria-label="Delete appointment"
          title="Delete"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}