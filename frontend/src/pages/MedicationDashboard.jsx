import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Pill, Plus } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import MedSummaryCards from "../components/medication/MedSummaryCards";
import MedReminders from "../components/medication/MedReminders";
import TodaySchedule from "../components/medication/TodaySchedule";
import MedicationList from "../components/medication/MedicationList";
import DoseHistory from "../components/medication/DoseHistory";
import InventoryPanel from "../components/medication/InventoryPanel";
import MedicationFormModal from "../components/medication/MedicationFormModal";
import { useAuth } from "../context/AuthContext";
import { getMedicationDashboard } from "../services/medicationService";

export default function MedicationDashboard() {
  const { id } = useParams();
  const { token, user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
    if (!authLoading && user?.role === "family_member") {
      toast.error("Only caregivers can manage medications.");
      navigate("/family/dashboard");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      const res = await getMedicationDashboard(id, token);
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load medications");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [token, id, navigate]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  if (authLoading) return null;

  const elderName = data?.elder?.fullName || "Elder";

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

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Pill size={14} />
              Medication management
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              {elderName}
            </h1>
          </div>
          <Button
            icon={Plus}
            size="md"
            fullWidth={false}
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            Add medicine
          </Button>
        </div>

        <div className="space-y-6">
          <MedSummaryCards summary={data?.summary} loading={loading} />

          <MedReminders reminders={data?.reminders || []} />

          <TodaySchedule
            doses={data?.todaySchedule || []}
            elderId={id}
            token={token}
            onChanged={refresh}
            loading={loading}
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <MedicationList
                medications={data?.medications || []}
                elderId={id}
                token={token}
                loading={loading}
                onEdit={(m) => {
                  setEditing(m);
                  setShowForm(true);
                }}
                onChanged={refresh}
              />
            </div>
            <InventoryPanel
              medications={data?.medications || []}
              lowStock={data?.lowStock || []}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DoseHistory history={data?.history || []} />
            <DoseHistory
              history={data?.missedHistory || []}
              title="Missed-dose history"
            />
          </div>
        </div>
      </main>

      {showForm && (
        <MedicationFormModal
          elderId={id}
          token={token}
          medication={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
