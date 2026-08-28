import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Sidebar from "../components/Sidebar";
import WhatsChangedList from "../components/wellness/WhatsChangedList";
import WellnessTrendBarChart from "../components/wellness/WellnessTrendBarChart";
import { useAuth } from "../context/AuthContext";
import { getWellnessProgress } from "../services/wellnessProgressService";
import { getElderById } from "../services/elderService";

export default function WellnessProgress() {
  const { id: elderId } = useParams();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [elderName, setElderName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  const load = useCallback(async () => {
    if (!token || !elderId) return;
    try {
      setLoading(true);
      const [progressRes, elderRes] = await Promise.all([
        getWellnessProgress(elderId, token),
        getElderById(elderId, token).catch(() => null),
      ]);
      setData(progressRes.data);
      setElderName(elderRes?.data?.fullName || progressRes.data?.elder?.name || "Elder");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load wellness progress");
    } finally {
      setLoading(false);
    }
  }, [token, elderId]);

  useEffect(() => {
    load();
  }, [load]);

  if (authLoading) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden px-4 py-8 sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={() => navigate(`/elders/${elderId}`)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Back to profile
        </button>

        <h1 className="font-display text-3xl font-semibold text-ink">Wellness Progress</h1>
        <p className="mt-1 text-sm text-ink-soft">{elderName}</p>

        {loading || !data ? (
          <div className="mt-6 h-48 animate-pulse rounded-xl border border-border bg-paper-card" />
        ) : (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">This week</p>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Object.entries(data.overview || {}).map(([key, item]) => (
                  <div key={key} className="rounded-lg border border-border bg-paper px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                      {item.label}
                    </p>
                    <p className="mt-1 font-display text-xl font-semibold text-ink">
                      {item.display}
                      {item.arrow ? <span className="ml-1 text-base">{item.arrow}</span> : null}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <WellnessTrendBarChart series={data.series} />

            <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
              <h3 className="font-display text-lg font-semibold text-ink">Appointments this week</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
                <div>
                  <p className="text-ink-soft">Scheduled</p>
                  <p className="font-semibold text-ink">{data.overview.appointments.scheduled}</p>
                </div>
                <div>
                  <p className="text-ink-soft">Completed</p>
                  <p className="font-semibold text-ink">{data.overview.appointments.completed}</p>
                </div>
                <div>
                  <p className="text-ink-soft">Missed</p>
                  <p className="font-semibold text-ink">{data.overview.appointments.missed}</p>
                </div>
                <div>
                  <p className="text-ink-soft">Attendance</p>
                  <p className="font-semibold text-ink">{data.overview.appointments.display}</p>
                </div>
              </div>
            </div>

            <WhatsChangedList changes={data.changes} />
          </div>
        )}
      </main>
    </div>
  );
}
