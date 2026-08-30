import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Pencil, Trash2, Droplet, Phone, MapPin, Cake, Smile, Copy, Check, FolderHeart, Pill, CalendarClock, TrendingUp, LayoutGrid } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import MedicalHistoryCard from "../components/MedicalHistoryCard";
import EmergencyContactCard from "../components/EmergencyContactCard";
import NutritionPlanCard from "../components/NutritionPlanCard";
import MealScheduleSection from "../components/MealScheduleSection";
import MoodCheckinModal from "../components/MoodCheckinModal";
import { useAuth } from "../context/AuthContext";
import { getElderById, deleteElder as deleteElderApi } from "../services/elderService";
import EmergencySOS from "../components/EmergencySOS";
import Chat from "../components/Chat";



function formatDate(d) {
  if (!d) return "Not set";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ElderProfile() {
  const { id } = useParams();
  const { token, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [elder, setElder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    fetchElder();
  }, [id, authLoading, isAuthenticated]);

  const fetchElder = async () => {
    try {
      setLoading(true);
      const res = await getElderById(id, token);
      setElder(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load profile");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const copyElderId = () => {
    navigator.clipboard.writeText(elder.elderID);
    setCopiedId(true);
    toast.success("Elder ID copied");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDelete = async () => {
    try {
      await deleteElderApi(id, token);
      toast.success(`${elder.fullName} was removed`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete elder");
    }
  };

  if (loading || !elder) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
      </div>
    );
  }

  const initials = elder.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 px-8 py-8 lg:px-12">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-primary"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to dashboard
        </Link>

        {/* Header card */}
        <div className="rounded-xl border border-border bg-paper-card p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl font-semibold text-paper-card">
                {initials}
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink">
                  {elder.fullName}
                </h1>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {elder.age ? `${elder.age} years old` : "Age not set"}
                  {elder.gender ? ` · ${elder.gender}` : ""}
                </p>
                {elder.elderID ? (
                  <button
                    onClick={copyElderId}
                    className="mt-2 flex items-center gap-1.5 rounded-md border border-border bg-paper px-2.5 py-1 font-mono text-xs text-ink-soft transition-colors hover:border-primary hover:text-primary"
                    title="Share this ID with family members so they can connect"
                  >
                    {elder.elderID}
                    {copiedId ? (
                      <Check size={12} strokeWidth={2.5} className="text-primary" />
                    ) : (
                      <Copy size={12} strokeWidth={2} />
                    )}
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-rose">
                    No Elder ID on file — this profile predates ID generation.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <EmergencySOS elder={elder} size="md" fullWidth={false} />

              <Button
                variant="primary"
                icon={LayoutGrid}
                size="md"
                fullWidth={false}
                onClick={() => navigate(`/elders/${id}/dashboard`)}
              >
                Health Dashboard
              </Button>

              <Button
                variant="primary"
                icon={Pill}
                size="md"
                fullWidth={false}
                onClick={() => navigate(`/elders/${id}/medications`)}
              >
                Medications
              </Button>

              <Button
                variant="secondary"
                icon={CalendarClock}
                size="md"
                fullWidth={false}
                onClick={() => navigate(`/elders/${id}/routine`)}
              >
                Daily Routine
              </Button>

              <Button
                variant="secondary"
                icon={FolderHeart}
                size="md"
                fullWidth={false}
                onClick={() => navigate(`/elders/${id}/records`)}
              >
                Records Portal
              </Button>

              <Button
                variant="secondary"
                icon={TrendingUp}
                size="md"
                fullWidth={false}
                onClick={() => navigate(`/elders/${id}/wellness-progress`)}
              >
                Wellness Progress
              </Button>
              
              <Button
                variant="accent"
                icon={Smile}
                size="md"
                fullWidth={false}
                onClick={() => setShowMoodModal(true)}
              >
                Mood Check-in
              </Button>
              <Button
                variant="ghost"
                icon={Pencil}
                size="md"
                fullWidth={false}
                onClick={() => navigate(`/elders/${id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                icon={Trash2}
                size="md"
                fullWidth={false}
                onClick={() => setConfirmingDelete(true)}
              >
                Delete
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <InfoStat icon={Droplet} label="Blood Group" value={elder.bloodGroup || "Not set"} mono />
            <InfoStat icon={Cake} label="Date of Birth" value={formatDate(elder.dateOfBirth)} />
            <InfoStat icon={Phone} label="Phone" value={elder.phone || "Not set"} mono />
            <InfoStat icon={MapPin} label="Address" value={elder.address || "Not set"} />
          </div>
        </div>

        {/*Communication section */}
        <div className="mt-6">
          <Chat elder={elder} />
        </div>

        {/* Details grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MedicalHistoryCard
            medicalHistory={elder.medicalHistory}
            allergies={elder.allergies}
            chronicDiseases={elder.chronicDiseases}
          />
          <EmergencyContactCard emergencyContacts={elder.emergencyContacts} />
        </div>

        <div className="mt-6">
          <NutritionPlanCard nutritionPlan={elder.nutritionPlan} />
        </div>

        {/* Weekly meal schedule - full width, its own grid needs the room */}
        <div className="mt-6">
          <MealScheduleSection elderId={id} />
        </div>

      </main>

      {showMoodModal && (
        <MoodCheckinModal elder={elder} onClose={() => setShowMoodModal(false)} />
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-paper-card p-6 shadow-lg">
            <h3 className="font-display text-lg font-semibold text-ink">
              Remove {elder.fullName}?
            </h3>
            <p className="mt-1.5 text-sm text-ink-soft">
              This deletes their entire profile, including medical history and
              emergency contacts. This can't be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" size="md" fullWidth={false} onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="md" fullWidth={false} onClick={handleDelete}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoStat({ icon: Icon, label, value, mono = false }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
        <Icon size={12} strokeWidth={2.5} />
        {label}
      </p>
      <p className={`mt-1 text-sm text-ink ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
