import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Droplet,
  Phone,
  MapPin,
  Cake,
  Smile,
  CalendarPlus,
  User,
  Mail,
  MessageCircle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import MedicalHistoryCard from "../components/MedicalHistoryCard";
import EmergencyContactCard from "../components/EmergencyContactCard";
import NutritionPlanCard from "../components/NutritionPlanCard";
import MealScheduleSection from "../components/MealScheduleSection";
import MoodCheckinModal from "../components/MoodCheckinModal";
import Chat from "../components/Chat";
import { useAuth } from "../context/AuthContext";
import { getElderById } from "../services/elderService";

function formatDate(d) {
  if (!d) return "Not set";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function FamilyElderView() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [elder, setElder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMoodModal, setShowMoodModal] = useState(false);

  useEffect(() => {
    fetchElder();
  }, [id]);

  const fetchElder = async () => {
    try {
      setLoading(true);
      const res = await getElderById(id, token);
      setElder(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load profile");
      navigate("/family/dashboard");
    } finally {
      setLoading(false);
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
          to="/family/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-primary"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to your elders
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
              </div>
            </div>

            <div className="flex gap-2.5">
              <Button
                variant="accent"
                icon={Smile}
                size="md"
                fullWidth={false}
                onClick={() => setShowMoodModal(true)}
              >
                Mood Log
              </Button>
              <Button
                icon={CalendarPlus}
                size="md"
                fullWidth={false}
                onClick={() => navigate(`/appointments/book?elder=${id}`)}
              >
                Request Visit
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

        {/* Caregiver contact */}
        {elder.caregiver && (
          <div className="mt-6 rounded-xl border border-border bg-paper-card p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User size={16} strokeWidth={2} />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">
                Caregiver
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InfoStat label="Name" value={elder.caregiver.name} />
              <InfoStat icon={Mail} label="Email" value={elder.caregiver.email} mono />
              <InfoStat
                icon={Phone}
                label="Phone"
                value={elder.caregiver.phone || "Not set"}
                mono
              />
            </div>

            {/* Communication */}
            <div className="mt-5 border-t border-border pt-5">
              <Link
                to={`/family/elders/${id}/chat`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-paper-card transition-opacity hover:opacity-90"
              >
                <MessageCircle size={17} strokeWidth={2} />
                Message Caregiver
              </Link>
            </div>
          </div>
        )}

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

        <div className="mt-6">
          <MealScheduleSection elderId={id} readOnly />
        </div>
      </main>

      {showMoodModal && (
        <MoodCheckinModal
          elder={elder}
          onClose={() => setShowMoodModal(false)}
          readOnly
        />
      )}
    </div>
  );
}

function InfoStat({ icon: Icon, label, value, mono = false }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
        {Icon && <Icon size={12} strokeWidth={2.5} />}
        {label}
      </p>
      <p className={`mt-1 text-sm text-ink ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
