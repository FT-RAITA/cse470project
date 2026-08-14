import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, FolderHeart } from "lucide-react";
import Sidebar from "../components/Sidebar";
import SummaryCards from "../components/records/SummaryCards";
import HealthStatusBadge from "../components/records/HealthStatusBadge";
import ProfileCompletion from "../components/records/ProfileCompletion";
import HealthCharts from "../components/records/HealthCharts";
import QuickActions from "../components/records/QuickActions";
import RecordTimeline from "../components/records/RecordTimeline";
import ActivityFeed from "../components/records/ActivityFeed";
import RecordsTable from "../components/records/RecordsTable";
import ReportsSection from "../components/records/ReportsSection";
import { useAuth } from "../context/AuthContext";
import { getRecordsDashboard } from "../services/elderRecordsService";

export default function ElderRecordsPortal() {
  const { id } = useParams();
  const { token, isAuthenticated, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
    if (!authLoading && user && user.role === "family_member") {
      toast.error("Only caregivers can access the records portal.");
      navigate("/appointments");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const loadDashboard = useCallback(async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      const res = await getRecordsDashboard(id, token);
      setDashboard(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load records portal");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [token, id, navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  if (authLoading) return null;

  const elderName = dashboard?.elder?.fullName || "Elder";

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden px-4 py-8 sm:px-8 lg:px-12">
        <Link
          to={`/elders/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-primary"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to profile
        </Link>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <FolderHeart size={14} />
              Elder records portal
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              {elderName}
            </h1>
          </div>
          {!loading && dashboard && (
            <HealthStatusBadge status={dashboard.summary.healthStatus} />
          )}
        </div>

        <div className="space-y-6">
          <SummaryCards summary={dashboard?.summary} loading={loading} />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2">
              {loading ? (
                <div className="h-36 animate-pulse rounded-xl border border-border bg-paper-card" />
              ) : (
                <ProfileCompletion
                  percent={dashboard?.summary?.profileCompletion || 0}
                />
              )}
            </div>
            <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Active medications
              </p>
              {loading ? (
                <div className="mt-3 h-16 animate-pulse rounded-lg bg-paper" />
              ) : dashboard?.medications?.length ? (
                <ul className="mt-3 space-y-2">
                  {dashboard.medications.slice(0, 4).map((m) => (
                    <li key={m._id} className="text-sm text-ink">
                      <span className="font-semibold">{m.name}</span>
                      <span className="text-ink-soft">
                        {" "}
                        · {m.dosage} · {m.frequency}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ink-soft">No active medications.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">
              Quick actions
            </h2>
            <QuickActions elderId={id} token={token} onDone={refresh} />
          </div>

          {!loading && <HealthCharts analytics={dashboard?.analytics} />}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <RecordTimeline items={dashboard?.timeline || []} />
            <ActivityFeed items={dashboard?.activities || []} />
          </div>

          <RecordsTable elderId={id} token={token} refreshKey={refreshKey} />

          <ReportsSection
            reports={dashboard?.reports || []}
            elderId={id}
            token={token}
            onChanged={refresh}
          />
        </div>
      </main>
    </div>
  );
}
