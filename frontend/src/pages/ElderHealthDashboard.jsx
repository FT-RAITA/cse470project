import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  HeartPulse,
  Pill,
  RefreshCw,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import SummaryCard from "../components/dashboard/SummaryCard";
import MedicationAdherenceChart from "../components/dashboard/MedicationAdherenceChart";
import AppointmentStatusChart from "../components/dashboard/AppointmentStatusChart";
import MoodTrendChart from "../components/dashboard/MoodTrendChart";
import { useAuth } from "../context/AuthContext";
import {
  downloadElderDashboardPdf,
  getElderDashboard,
  readDashboardErrorMessage,
} from "../services/dashboardService";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
];

const formatDateTime = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const compactDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export default function ElderHealthDashboard() {
  const { id: elderId } = useParams();
  const {
    token,
    user,
    isAuthenticated,
    loading: authLoading,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState("7d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const handleUnauthorized = useCallback(() => {
    logout();
    toast.error("Your session expired. Please log in again.");
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  const loadDashboard = useCallback(async () => {
    if (!token || !elderId) return;
    try {
      setLoading(true);
      setError("");
      setData(null);
      const response = await getElderDashboard(elderId, range, token);
      setData(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      const message = await readDashboardErrorMessage(err);
      setError(message || "Could not load the elder health dashboard.");
    } finally {
      setLoading(false);
    }
  }, [elderId, handleUnauthorized, range, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const profilePath =
    user?.role === "family_member" ? `/family/elders/${elderId}` : `/elders/${elderId}`;

  const handleDownloadPdf = async () => {
    if (!token || !elderId) return;

    try {
      setDownloading(true);
      const response = await downloadElderDashboardPdf(elderId, range, token);
      const blob = new Blob([response.data], { type: "application/pdf" });
      if (!blob.size) throw new Error("The PDF report was empty.");

      const disposition = response.headers?.["content-disposition"] || "";
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const fallbackName = `elder-ease-health-${(data?.elder?.fullName || "elder")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")}-${range}.pdf`;
      const filename = filenameMatch?.[1] || fallbackName;

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Health report PDF downloaded");
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      const message = await readDashboardErrorMessage(err);
      toast.error(message || err.message || "Could not download the PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-8 sm:px-8 lg:px-12">
        <Link
          to={profilePath}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-primary"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to profile
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Elder health dashboard</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
              {data?.elder?.fullName || "Health overview"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-soft">
              Health and mood context, medication adherence, doctor appointment statistics, and today&apos;s routine in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={loading || downloading || !data}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-paper-card transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={16} />
              {downloading ? "Preparing PDF..." : "Download Health PDF"}
            </button>
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRange(option.value)}
                disabled={loading}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  range === option.value
                    ? "bg-primary text-paper-card"
                    : "border border-border bg-paper-card text-ink-soft hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-rose/30 bg-rose-soft p-5">
            <p className="text-sm font-medium text-rose">{error}</p>
            <button
              type="button"
              onClick={loadDashboard}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-paper-card"
            >
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <DashboardSkeleton />
        ) : data ? (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <HealthCard data={data.healthSummary} />
              <MedicationCard data={data.medication} rangeLabel={data.range?.label} />
              <AppointmentCard data={data.appointments} />
              <RoutineCard data={data.routine} elderId={elderId} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <MedicationAdherenceChart
                data={data.charts?.medicationAdherence || []}
                rangeLabel={data.range?.label || "Selected range"}
              />
              <AppointmentStatusChart
                data={data.charts?.appointmentStats || []}
                period={data.appointments?.period}
              />
            </div>

            <MoodTrendChart
              data={data.charts?.moodTrend || []}
              rangeLabel={data.range?.label || "Selected range"}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}

function HealthCard({ data }) {
  const mood = data?.latestMood;
  const activity = data?.recentActivity;
  const update = data?.recentHealthUpdate;

  return (
    <SummaryCard icon={HeartPulse} title="Health / Mood">
      {mood ? (
        <>
          <p className="font-display text-3xl font-semibold text-ink">{mood.overallMood}</p>
          <p className="mt-1 text-xs text-ink-soft">Latest mood · {compactDate(mood.date)}</p>
          <div className="mt-4 space-y-2 text-sm">
            <StatLine label="Physical" value={mood.physicalCondition} />
            <StatLine label="Energy" value={mood.energyLevel} />
          </div>
        </>
      ) : (
        <p className="py-3 text-sm text-ink-soft">No recent mood check-ins.</p>
      )}
      {activity || update ? (
        <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-ink-soft">
          {activity ? (
            <p>
              Recent activity: <span className="font-semibold text-ink">{activity.activity}</span>
              {activity.completed ? " · completed" : " · not completed"}
            </p>
          ) : null}
          {update ? <p>Last health update: {update.message}</p> : null}
        </div>
      ) : null}
    </SummaryCard>
  );
}

function MedicationCard({ data, rangeLabel }) {
  const hasAdherence = data?.adherence != null;
  return (
    <SummaryCard icon={Pill} title="Medication Adherence">
      <p className="font-display text-3xl font-semibold text-ink">
        {hasAdherence ? `${data.adherence}%` : "—"}
      </p>
      <p className="mt-1 text-xs text-ink-soft">{rangeLabel || "Selected range"}</p>
      {hasAdherence ? (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <StatLine label="Taken" value={data.taken} />
          <StatLine label="Missed" value={data.missed} />
          <StatLine label="Skipped" value={data.skipped} />
          <StatLine label="Upcoming" value={data.pending} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">No medication adherence data available yet.</p>
      )}
      {data?.overduePending > 0 ? (
        <p className="mt-3 text-xs text-rose">
          {data.overduePending} past dose{data.overduePending === 1 ? " is" : "s are"} still unrecorded; not assumed missed.
        </p>
      ) : null}
    </SummaryCard>
  );
}

function AppointmentCard({ data }) {
  const next = data?.nextAppointment;
  return (
    <SummaryCard icon={CalendarDays} title="Doctor Appointments">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{data?.period || "Current month"}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <StatLine label="Upcoming" value={data?.upcoming ?? 0} />
        <StatLine label="Completed" value={data?.completed ?? 0} />
        <StatLine label="Cancelled" value={data?.cancelled ?? 0} />
      </div>
      {data?.pastDue > 0 ? (
        <p className="mt-3 text-xs text-rose">
          {data.pastDue} appointment{data.pastDue === 1 ? " is" : "s are"} past due but still stored as Upcoming.
        </p>
      ) : null}
      <div className="mt-4 border-t border-border pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">Next appointment</p>
        {next ? (
          <>
            <p className="mt-1 text-sm font-semibold text-ink">Dr. {next.doctorName}</p>
            <p className="text-xs text-ink-soft">{formatDateTime(next.appointmentDate)}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-soft">No upcoming doctor appointment.</p>
        )}
      </div>
    </SummaryCard>
  );
}

function RoutineCard({ data, elderId }) {
  const hasTrackableItems = (data?.total || 0) > 0;
  return (
    <SummaryCard
      icon={CheckCircle2}
      title="Today's Routine"
      footer={
        <Link
          to={`/elders/${elderId}/routine`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <Activity size={15} /> Open Daily Routine
        </Link>
      }
    >
      <p className="font-display text-3xl font-semibold text-ink">
        {hasTrackableItems && data.percentage != null ? `${data.percentage}%` : "—"}
      </p>
      {hasTrackableItems ? (
        <>
          <p className="mt-1 text-sm text-ink-soft">
            {data.completed} / {data.total} trackable items completed
          </p>
          <p className="mt-3 text-xs text-ink-soft">
            {data.scheduledItems} total items appear in today&apos;s routine.
            {data.untrackedMealItems > 0
              ? ` ${data.untrackedMealItems} meal item${data.untrackedMealItems === 1 ? " has" : "s have"} no completion field in the current model.`
              : ""}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">
          {data?.untrackedMealItems > 0
            ? `${data.untrackedMealItems} meal item${data.untrackedMealItems === 1 ? " is" : "s are"} scheduled today, but meals do not have a completion field in the current model.`
            : "No routine items scheduled for today."}
        </p>
      )}
    </SummaryCard>
  );
}

function StatLine({ label, value }) {
  return (
    <div className="rounded-lg bg-paper px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">{label}</p>
      <p className="mt-0.5 font-semibold text-ink">{value ?? "—"}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-6 space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-64 rounded-xl border border-border bg-paper-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-80 rounded-xl border border-border bg-paper-card" />
        <div className="h-80 rounded-xl border border-border bg-paper-card" />
      </div>
      <div className="h-80 rounded-xl border border-border bg-paper-card" />
    </div>
  );
}
