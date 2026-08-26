import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Pill,
  Dumbbell,
  Stethoscope,
  CalendarDays,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { getDailyRoutine } from "../services/dailyRoutineService";

const TYPE_META = {
  meal: { icon: Utensils, label: "Meal", color: "text-amber-600 bg-amber-50" },
  medication: { icon: Pill, label: "Medication", color: "text-primary bg-primary/10" },
  activity: { icon: Dumbbell, label: "Activity", color: "text-emerald-600 bg-emerald-50" },
  appointment: { icon: Stethoscope, label: "Appointment", color: "text-rose bg-rose/10" },
};

const toInputDate = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export default function DailyRoutine() {
  const { id } = useParams();
  const { token } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [elderName, setElderName] = useState("");
  const [routine, setRoutine] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchRoutine();
  }, [id, selectedDate, token]);

  const fetchRoutine = async () => {
    try {
      setLoading(true);
      const res = await getDailyRoutine(id, toInputDate(selectedDate), token);
      setElderName(res.data.elder?.fullName || "");
      setRoutine(res.data.routine || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the daily routine.");
    } finally {
      setLoading(false);
    }
  };

  const shiftDate = (days) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  const isToday = toInputDate(selectedDate) === toInputDate(new Date());

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 px-8 py-8 lg:px-12">
        <Link
          to={`/elders/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-primary"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to profile
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Daily Routine{elderName ? ` — ${elderName}` : ""}
            </h1>
            <p className="mt-0.5 text-sm text-ink-soft">
              A day-at-a-glance schedule of meals, medications, activities, and appointments.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-paper-card px-2 py-1.5">
            <button
              onClick={() => shiftDate(-1)}
              className="rounded-md p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="flex items-center gap-1.5 px-1 text-sm font-medium text-ink">
              <CalendarDays size={14} />
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
              {isToday && <span className="text-xs text-primary">(Today)</span>}
            </span>
            <button
              onClick={() => shiftDate(1)}
              className="rounded-md p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-paper-card p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : routine.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-soft">
              Nothing scheduled for this day.
            </p>
          ) : (
            <ol className="relative ml-3 space-y-6 border-l border-border pl-6">
              {routine.map((item) => {
                const meta = TYPE_META[item.type] || TYPE_META.activity;
                const Icon = meta.icon;
                return (
                  <li key={`${item.type}-${item.refId}-${item.minutes}`} className="relative">
                    <span
                      className={`absolute -left-[34px] flex h-6 w-6 items-center justify-center rounded-full ${meta.color}`}
                    >
                      <Icon size={13} strokeWidth={2.5} />
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                      {item.time}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-ink">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-sm text-ink-soft">{item.subtitle}</p>
                    )}
                    {item.status && (
                      <span className="mt-1 inline-block rounded-full bg-paper px-2 py-0.5 text-xs text-ink-soft">
                        {item.status}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </main>
    </div>
  );
}