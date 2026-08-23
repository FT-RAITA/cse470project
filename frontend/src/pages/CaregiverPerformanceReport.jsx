import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Download, RefreshCw } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import PerformanceSummaryCards from "../components/performance/PerformanceSummaryCards";
import ScoreRing from "../components/performance/ScoreRing";
import { PerformanceTrendChart, TaskDistributionChart } from "../components/performance/PerformanceCharts";
import ActivityTimeline from "../components/performance/ActivityTimeline";
import ShiftPerformanceCard from "../components/performance/ShiftPerformanceCard";
import LeaderboardTable from "../components/performance/LeaderboardTable";
import CaregiverOfTheWeek from "../components/performance/CaregiverOfTheWeek";
import BadgesPanel from "../components/performance/BadgesPanel";
import { useAuth } from "../context/AuthContext";
import {
  getPerformanceDashboard,
  getPerformanceLeaderboard,
  downloadPerformanceReport,
} from "../services/performanceService";

export default function CaregiverPerformanceReport() {
  const { token, user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [period, setPeriod] = useState("7d");
  const [selectedCaregiverId, setSelectedCaregiverId] = useState("me");
  const [dashboard, setDashboard] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [weeklyWinner, setWeeklyWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
    if (!authLoading && user?.role === "family_member") {
      toast.error("Only caregivers can view performance reports.");
      navigate("/family/dashboard");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = { period };
      if (user?.role === "admin" && selectedCaregiverId && selectedCaregiverId !== "me") {
        params.caregiverId = selectedCaregiverId;
      }
      const [dashRes, boardRes] = await Promise.all([
        getPerformanceDashboard(token, params),
        getPerformanceLeaderboard(token, { period }),
      ]);
      setDashboard(dashRes.data);
      setLeaderboard(boardRes.data.leaderboard || []);
      setWeeklyWinner(boardRes.data.weeklyWinner || dashRes.data.weeklyWinner || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load performance report");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [token, period, selectedCaregiverId, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const params = { period };
      if (user?.role === "admin" && selectedCaregiverId && selectedCaregiverId !== "me") {
        params.caregiverId = selectedCaregiverId;
      }
      const res = await downloadPerformanceReport(token, params);
      const html = typeof res.data === "string" ? res.data : String(res.data ?? "");
      if (!html.includes("ELDER EASE")) {
        throw new Error(res.data?.message || "Report download returned invalid content");
      }
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `elder-ease-performance-${(user?.name || "caregiver").replace(/\s+/g, "-").toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden px-4 py-8 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              Caregiver Performance & Activity Report
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {dashboard?.caregiver?.name || user?.name || "Caregiver"} ·{" "}
              {dashboard?.periodLabel || "Last 7 days"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user?.role === "admin" && (
              <select
                value={selectedCaregiverId}
                onChange={(e) => setSelectedCaregiverId(e.target.value)}
                className="rounded-lg border border-border bg-paper-card px-3 py-2.5 text-sm"
              >
                <option value="me">My performance</option>
                {(dashboard?.caregivers || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-lg border border-border bg-paper-card px-3 py-2.5 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="month">This month</option>
            </select>
            <Button variant="ghost" size="md" fullWidth={false} icon={RefreshCw} onClick={load}>
              Refresh
            </Button>
            <Button size="md" fullWidth={false} icon={Download} loading={downloading} onClick={handleDownload}>
              Download report
            </Button>
          </div>
        </div>

        {!loading && !dashboard ? (
          <div className="rounded-xl border border-dashed border-border bg-paper-card py-20 text-center text-sm text-ink-soft">
            Unable to load performance data.
          </div>
        ) : (
          <div className="space-y-6">
            <PerformanceSummaryCards summary={dashboard?.summary} loading={loading} />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <ScoreRing
                  score={dashboard?.scoreInfo?.score || 0}
                  level={dashboard?.scoreInfo?.level || "Needs Improvement"}
                  breakdown={dashboard?.scoreInfo?.breakdown || {}}
                />
              </div>
              <CaregiverOfTheWeek winner={weeklyWinner} />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <PerformanceTrendChart trend={dashboard?.trend || []} />
              <TaskDistributionChart distribution={dashboard?.taskDistribution || {}} />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <ActivityTimeline activity={dashboard?.activity || []} loading={loading} />
              </div>
              <div className="space-y-5">
                <ShiftPerformanceCard shifts={dashboard?.shifts} />
                <BadgesPanel badges={dashboard?.badges || []} />
              </div>
            </div>

            <LeaderboardTable leaderboard={leaderboard} loading={loading} />
          </div>
        )}
      </main>
    </div>
  );
}
