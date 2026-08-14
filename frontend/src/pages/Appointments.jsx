import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  CalendarPlus,
  ClipboardList,
  Clock3,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import AppointmentDetailModal from "../components/AppointmentDetailModal";
import {
  StatusBadge,
  VisitorBadge,
  formatDate,
  formatTime,
} from "../components/AppointmentBadges";
import { useAuth } from "../context/AuthContext";
import {
  getAppointments,
  getAppointmentStats,
  updateAppointmentStatus,
  updateAppointment,
} from "../services/appointmentService";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "Pending", label: "Pending" },
  { key: "Approved", label: "Approved" },
  { key: "Rejected", label: "Rejected" },
  { key: "today", label: "Today's visits" },
  { key: "upcoming", label: "Upcoming" },
  { key: "Completed", label: "Completed" },
];

export default function Appointments() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isCaregiver = user?.role === "caregiver" || user?.role === "admin";

  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    todayVisits: 0,
    approvedToday: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = {};
      if (["Pending", "Approved", "Rejected", "Completed"].includes(activeFilter)) {
        params.status = activeFilter;
      } else if (activeFilter === "today") {
        params.filter = "today";
      } else if (activeFilter === "upcoming") {
        params.filter = "upcoming";
      }
      if (search.trim()) params.search = search.trim();

      const [listRes, statsRes] = await Promise.all([
        getAppointments(token, params),
        getAppointmentStats(token),
      ]);
      setAppointments(listRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load appointments");
    } finally {
      setLoading(false);
    }
  }, [token, activeFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [fetchData, search]);

  const handleStatusChange = async (id, status) => {
    setActionLoading(true);
    try {
      const res = await updateAppointmentStatus(id, status, token);
      toast.success(res.data.message);
      setSelected(null);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (id, data) => {
    setActionLoading(true);
    try {
      const res = await updateAppointment(id, data, token);
      toast.success(res.data.message);
      setSelected(res.data.appointment);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update appointment");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const statCards = useMemo(
    () => [
      {
        label: "Pending requests",
        value: stats.pending,
        icon: ClipboardList,
        tone: "bg-accent-soft text-primary-dark",
      },
      {
        label: "Today's visits",
        value: stats.todayVisits,
        icon: CalendarDays,
        tone: "bg-primary/10 text-primary",
      },
      {
        label: "Approved today",
        value: stats.approvedToday,
        icon: CheckCircle2,
        tone: "bg-emerald-100 text-emerald-800",
      },
      {
        label: "Completed visits",
        value: stats.completed,
        icon: Clock3,
        tone: "bg-sky-100 text-sky-800",
      },
    ],
    [stats]
  );

  if (authLoading) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden px-4 py-8 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {isCaregiver ? "Appointment approval" : "My visit requests"}
            </h1>
          </div>
          <Button
            icon={CalendarPlus}
            size="md"
            fullWidth={false}
            onClick={() => navigate("/appointments/book")}
          >
            Book visit
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-paper-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {label}
                </p>
                <span className={`rounded-lg p-2 ${tone}`}>
                  <Icon size={16} strokeWidth={2} />
                </span>
              </div>
              <p className="mt-3 font-display text-3xl font-semibold text-ink">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setActiveFilter(f.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeFilter === f.key
                    ? "bg-primary text-paper-card"
                    : "bg-paper-card border border-border text-ink-soft hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search
              size={16}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visitor, purpose, date, status"
              className="w-full rounded-lg border border-border bg-paper-card py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 lg:w-80"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-paper-card shadow-sm">
          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-paper" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="font-display text-lg font-semibold text-ink">
                No appointments found
              </h3>
              <p className="mt-1.5 text-sm text-ink-soft">
                {search || activeFilter !== "all"
                  ? "Try a different filter or search term."
                  : "Book a visit to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-paper text-xs uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Visitor</th>
                    <th className="px-4 py-3 font-semibold">Elder</th>
                    <th className="px-4 py-3 font-semibold">Purpose</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr
                      key={a._id}
                      className="border-b border-border last:border-0 hover:bg-paper/60"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{a.visitor?.name || "—"}</div>
                        <div className="mt-1">
                          <VisitorBadge badge={a.visitorBadge} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink">{a.elder?.fullName || "—"}</td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-ink-soft">
                        {a.purpose}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink">
                        {formatDate(a.appointmentDateTime)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink">
                        {formatTime(a.appointmentDateTime)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} />
                        {a.countdown && (
                          <p className="mt-1 text-[10px] text-primary">{a.countdown}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelected(a)}
                            className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-ink hover:bg-paper"
                          >
                            View
                          </button>
                          {isCaregiver && a.status === "Pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(a._id, "Approved")}
                                className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-paper-card hover:bg-primary-dark"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(a._id, "Rejected")}
                                className="rounded-md bg-rose px-2 py-1 text-xs font-semibold text-paper-card hover:bg-rose/90"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {isCaregiver && a.status === "Approved" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(a._id, "Completed")}
                              className="rounded-md bg-sky-700 px-2 py-1 text-xs font-semibold text-white hover:bg-sky-800"
                            >
                              Complete
                            </button>
                          )}
                          {isCaregiver &&
                            ["Pending", "Approved"].includes(a.status) && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(a._id, "Cancelled")}
                                className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-ink-soft hover:bg-paper"
                              >
                                Cancel
                              </button>
                            )}
                          {!isCaregiver && a.status === "Pending" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(a._id, "Cancelled")}
                              className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-ink-soft hover:bg-paper"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {selected && (
        <AppointmentDetailModal
          appointment={selected}
          isCaregiver={isCaregiver}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onSaveEdit={handleSaveEdit}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}
