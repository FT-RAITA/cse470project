import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ElderForm from "../components/ElderForm";
import { useAuth } from "../context/AuthContext";
import { getElderById, updateElder } from "../services/elderService";

export default function EditElder() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [elder, setElder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getElderById(id, token);
        setElder(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load profile");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (payload) => {
    try {
      const res = await updateElder(id, payload, token);
      toast.success(`${res.data.fullName}'s profile was updated`);
      navigate(`/elders/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-8 py-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <Link
            to={`/elders/${id}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-primary"
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Back to profile
          </Link>

          <h1 className="mb-1 font-display text-2xl font-semibold text-ink">
            Edit {elder?.fullName || "elder profile"}
          </h1>
          <p className="mb-7 text-sm text-ink-soft">
            Update any details below — changes save immediately.
          </p>

          {loading || !elder ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <ElderForm elder={elder} onSubmit={handleSubmit} submitLabel="Save Changes" />
          )}
        </div>
      </main>
    </div>
  );
}
