import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarCheck, CheckCircle2, Clock, User } from "lucide-react";
import Sidebar from "../components/Sidebar";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { VisitorBadge, DURATION_OPTIONS } from "../components/AppointmentBadges";
import { useAuth } from "../context/AuthContext";
import {
  getBookableElders,
  getAvailableSlots,
  createAppointment,
} from "../services/appointmentService";

const emptyForm = (presetElder = "") => ({
  elder: presetElder,
  purpose: "",
  date: "",
  time: "",
  durationMinutes: 60,
  specialNotes: "",
});

export default function BookAppointment() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetElder = searchParams.get("elder") || "";

  const [form, setForm] = useState(() => emptyForm(presetElder));
  const [errors, setErrors] = useState({});
  const [elders, setElders] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await getBookableElders(token);
        setElders(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load elders");
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token || !form.elder || !form.date) {
      setSlots([]);
      return;
    }

    (async () => {
      try {
        setLoadingSlots(true);
        const res = await getAvailableSlots(form.elder, form.date, token);
        setSlots(res.data.slots || []);
        const selected = res.data.slots?.find((s) => s.time === form.time);
        if (selected && !selected.available) {
          setForm((f) => ({ ...f, time: "" }));
        }
      } catch (err) {
        setSlots([]);
        toast.error(err.response?.data?.message || "Could not load time slots");
      } finally {
        setLoadingSlots(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, form.elder, form.date]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.elder) next.elder = "Please select an elder.";
    if (!form.purpose.trim()) next.purpose = "Purpose is required.";
    if (!form.date) next.date = "Date is required.";
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(form.date) < today) next.date = "Date cannot be in the past.";
    }
    if (!form.time) next.time = "Please select a time slot.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setShowConfirm(true);
  };

  const confirmBook = async () => {
    setSubmitting(true);
    try {
      const res = await createAppointment(
        { ...form, durationMinutes: Number(form.durationMinutes) },
        token
      );
      setShowConfirm(false);
      setSuccess({
        appointment: res.data.appointment,
        badge: res.data.visitorBadge,
      });
      toast.success(res.data.message || "Request submitted — pending approval.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedElder = elders.find((e) => e._id === form.elder);

  if (authLoading) return null;

  if (success) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md rounded-xl border border-border bg-paper-card p-8 text-center shadow-sm animate-[fadeIn_0.4s_ease]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={32} strokeWidth={2} />
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Request submitted
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Your visit request is pending caregiver approval.
            </p>
            <div className="mt-4 flex justify-center">
              <VisitorBadge badge={success.badge} />
            </div>
            <p className="mt-4 text-sm text-ink">
              {selectedElder?.fullName || "Elder"} · {form.date} at {form.time}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="md" fullWidth={false} onClick={() => navigate("/appointments")}>
                View my requests
              </Button>
              <Button
                size="md"
                variant="ghost"
                fullWidth={false}
                onClick={() => {
                  setSuccess(null);
                  setForm(emptyForm(presetElder));
                  setSlots([]);
                }}
              >
                Book another
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 px-6 py-8 lg:px-12">
        <div className="mb-8 max-w-3xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <CalendarCheck size={14} />
            Visitor appointments
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Book a Visit
          </h1>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            Request a visit with an elder. Choose an available time slot so
            caregivers can review and approve your appointment.
          </p>
        </div>

        <form
          onSubmit={handleSubmitClick}
          noValidate
          className="mx-auto max-w-3xl space-y-6"
        >
          <section className="rounded-xl border border-border bg-paper-card p-6 shadow-sm">
            <div className="flex items-center gap-3 rounded-lg bg-paper px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User size={16} strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">
                  Booking as {user?.name}
                </p>
                <p className="text-xs text-ink-soft">{user?.email}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-paper-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">
              Visit details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label
                  htmlFor="elder"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink-soft"
                >
                  Select elder <span className="text-rose">*</span>
                </label>
                <select
                  id="elder"
                  name="elder"
                  value={form.elder}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, elder: e.target.value, time: "" }));
                    setErrors((err) => ({ ...err, elder: "" }));
                  }}
                  className={`w-full rounded-lg border bg-paper-card py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary ${
                    errors.elder ? "border-rose" : "border-border"
                  }`}
                >
                  <option value="">Select elder</option>
                  {elders.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.fullName}
                      {e.age ? ` (${e.age})` : ""}
                    </option>
                  ))}
                </select>
                {errors.elder && (
                  <p className="mt-1 text-xs font-medium text-rose">{errors.elder}</p>
                )}
              </div>
              <InputField
                size="md"
                label="Preferred date"
                type="date"
                name="date"
                value={form.date}
                onChange={(e) => {
                  update(e);
                  setForm((f) => ({ ...f, time: "" }));
                }}
                error={errors.date}
                required
                mono
              />
              <div className="flex flex-col gap-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Expected duration
                </label>
                <select
                  name="durationMinutes"
                  value={form.durationMinutes}
                  onChange={update}
                  className="w-full rounded-lg border border-border bg-paper-card py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
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
                  label="Purpose of visit"
                  name="purpose"
                  as="textarea"
                  rows={3}
                  value={form.purpose}
                  onChange={update}
                  error={errors.purpose}
                  placeholder="e.g. Family visit, bring medicine, birthday celebration"
                  required
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
                  placeholder="Optional — accessibility needs, gifts, etc."
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-paper-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <h2 className="font-display text-lg font-semibold text-ink">
                Available time slots
              </h2>
            </div>
            {!form.elder || !form.date ? (
              <p className="text-sm text-ink-soft">
                Select an elder and date to see available slots.
              </p>
            ) : loadingSlots ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-paper" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slots.map((slot) => {
                    const selected = form.time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => {
                          setForm((f) => ({ ...f, time: slot.time }));
                          setErrors((err) => ({ ...err, time: "" }));
                        }}
                        className={`rounded-lg border px-2 py-3 text-center text-sm font-medium transition-colors ${
                          !slot.available
                            ? "cursor-not-allowed border-border bg-paper text-ink-soft/50 line-through"
                            : selected
                              ? "border-primary bg-primary text-paper-card"
                              : "border-border bg-paper-card text-ink hover:border-primary hover:bg-paper"
                        }`}
                      >
                        <span className="block font-mono">{slot.time}</span>
                        <span className="mt-0.5 block text-[10px] uppercase tracking-wide opacity-80">
                          {slot.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.time && (
                  <p className="mt-2 text-xs font-medium text-rose">{errors.time}</p>
                )}
              </>
            )}
          </section>

          <div className="flex justify-end gap-3 pb-8">
            <Button
              type="button"
              variant="ghost"
              size="md"
              fullWidth={false}
              onClick={() => navigate("/appointments")}
            >
              Cancel
            </Button>
            <Button type="submit" size="md" fullWidth={false} icon={CalendarCheck}>
              Submit request
            </Button>
          </div>
        </form>
      </main>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-paper-card p-6 shadow-lg">
            <h3 className="font-display text-lg font-semibold text-ink">
              Confirm appointment?
            </h3>
            <p className="mt-2 text-sm text-ink-soft">
              You are requesting a visit with{" "}
              <span className="font-semibold text-ink">{selectedElder?.fullName}</span>{" "}
              on <span className="font-mono text-ink">{form.date}</span> at{" "}
              <span className="font-mono text-ink">{form.time}</span>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                size="md"
                fullWidth={false}
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Go back
              </Button>
              <Button size="md" fullWidth={false} loading={submitting} onClick={confirmBook}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
