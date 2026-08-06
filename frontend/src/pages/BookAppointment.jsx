import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarCheck, CheckCircle2, Clock } from "lucide-react";
import Sidebar from "../components/Sidebar";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { VisitorBadge } from "../components/AppointmentBadges";
import { useAuth } from "../context/AuthContext";
import {
  getBookableElders,
  getAvailableSlots,
  createAppointment,
} from "../services/appointmentService";

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

const emptyForm = (user) => ({
  elder: "",
  visitorName: user?.name || "",
  visitorEmail: user?.email || "",
  visitorPhone: user?.phone || "",
  relation: "",
  purpose: "",
  priority: "Normal",
  preferredDate: "",
  preferredTime: "",
  expectedDuration: "1 hour",
  numberOfVisitors: 1,
  specialNotes: "",
});

export default function BookAppointment() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(() => emptyForm(user));
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
    if (user) {
      setForm((f) => ({
        ...f,
        visitorName: f.visitorName || user.name || "",
        visitorEmail: f.visitorEmail || user.email || "",
        visitorPhone: f.visitorPhone || user.phone || "",
      }));
    }
  }, [user]);

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
    if (!token || !form.elder || !form.preferredDate) {
      setSlots([]);
      return;
    }

    (async () => {
      try {
        setLoadingSlots(true);
        const res = await getAvailableSlots(form.elder, form.preferredDate, token);
        setSlots(res.data.slots || []);
        // Clear time if it became booked
        const selected = res.data.slots?.find((s) => s.time === form.preferredTime);
        if (selected && !selected.available) {
          setForm((f) => ({ ...f, preferredTime: "" }));
        }
      } catch (err) {
        setSlots([]);
        toast.error(err.response?.data?.message || "Could not load time slots");
      } finally {
        setLoadingSlots(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, form.elder, form.preferredDate]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.elder) next.elder = "Please select an elder.";
    if (!form.visitorName.trim()) next.visitorName = "Name is required.";
    if (!form.visitorEmail.trim()) next.visitorEmail = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.visitorEmail))
      next.visitorEmail = "Email format is invalid.";
    if (!form.visitorPhone.trim()) next.visitorPhone = "Phone is required.";
    else if (!/^[0-9+\-\s()]{8,15}$/.test(form.visitorPhone))
      next.visitorPhone = "Phone format is invalid.";
    if (!form.relation) next.relation = "Relation is required.";
    if (!form.purpose.trim()) next.purpose = "Purpose is required.";
    if (!form.preferredDate) next.preferredDate = "Date is required.";
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(form.preferredDate) < today)
        next.preferredDate = "Date cannot be in the past.";
    }
    if (!form.preferredTime) next.preferredTime = "Please select a time slot.";
    if (!form.expectedDuration) next.expectedDuration = "Duration is required.";
    const count = Number(form.numberOfVisitors);
    if (!count || count < 1 || count > 5)
      next.numberOfVisitors = "Visitors must be between 1 and 5.";

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
        {
          ...form,
          numberOfVisitors: Number(form.numberOfVisitors),
        },
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
              {selectedElder?.fullName || "Elder"} ·{" "}
              {form.preferredDate} at {form.preferredTime}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                size="md"
                fullWidth={false}
                onClick={() => navigate("/appointments")}
              >
                View my requests
              </Button>
              <Button
                size="md"
                variant="ghost"
                fullWidth={false}
                onClick={() => {
                  setSuccess(null);
                  setForm(emptyForm(user));
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
            <h2 className="font-display text-lg font-semibold text-ink mb-4">
              Visitor details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                size="md"
                label="Visitor name"
                name="visitorName"
                value={form.visitorName}
                onChange={update}
                error={errors.visitorName}
                required
              />
              <InputField
                size="md"
                label="Email"
                type="email"
                name="visitorEmail"
                value={form.visitorEmail}
                onChange={update}
                error={errors.visitorEmail}
                required
              />
              <InputField
                size="md"
                label="Phone"
                type="tel"
                name="visitorPhone"
                value={form.visitorPhone}
                onChange={update}
                error={errors.visitorPhone}
                required
                mono
              />
              <InputField
                size="md"
                label="Relation to elder"
                name="relation"
                as="select"
                options={RELATIONS}
                value={form.relation}
                onChange={update}
                error={errors.relation}
                required
              />
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
                    setForm((f) => ({
                      ...f,
                      elder: e.target.value,
                      preferredTime: "",
                    }));
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
                name="preferredDate"
                value={form.preferredDate}
                onChange={(e) => {
                  update(e);
                  setForm((f) => ({ ...f, preferredTime: "" }));
                }}
                error={errors.preferredDate}
                required
                mono
              />
              <InputField
                size="md"
                label="Priority"
                name="priority"
                as="select"
                options={PRIORITIES}
                value={form.priority}
                onChange={update}
              />
              <InputField
                size="md"
                label="Expected duration"
                name="expectedDuration"
                as="select"
                options={DURATIONS}
                value={form.expectedDuration}
                onChange={update}
                error={errors.expectedDuration}
                required
              />
              <InputField
                size="md"
                label="Number of visitors"
                type="number"
                name="numberOfVisitors"
                value={form.numberOfVisitors}
                onChange={update}
                error={errors.numberOfVisitors}
                required
              />
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
            {!form.elder || !form.preferredDate ? (
              <p className="text-sm text-ink-soft">
                Select an elder and date to see available slots.
              </p>
            ) : loadingSlots ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-paper"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slots.map((slot) => {
                    const selected = form.preferredTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => {
                          setForm((f) => ({ ...f, preferredTime: slot.time }));
                          setErrors((err) => ({ ...err, preferredTime: "" }));
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
                {errors.preferredTime && (
                  <p className="mt-2 text-xs font-medium text-rose">
                    {errors.preferredTime}
                  </p>
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
              <span className="font-semibold text-ink">
                {selectedElder?.fullName}
              </span>{" "}
              on <span className="font-mono text-ink">{form.preferredDate}</span>{" "}
              at <span className="font-mono text-ink">{form.preferredTime}</span>.
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
              <Button
                size="md"
                fullWidth={false}
                loading={submitting}
                onClick={confirmBook}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
