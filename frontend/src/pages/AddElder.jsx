import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ElderForm from "../components/ElderForm";
import { useAuth } from "../context/AuthContext";
import { createElder } from "../services/elderService";

export default function AddElder() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    try {
      const res = await createElder(payload, token);
      toast.success(`${res.data.fullName}'s profile was created`);
      navigate(`/elders/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create profile");
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-8 py-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/dashboard"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-primary"
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Back to dashboard
          </Link>

          <h1 className="mb-1 font-display text-2xl font-semibold text-ink">
            Add an elder profile
          </h1>
          <p className="mb-7 text-sm text-ink-soft">
            Fill in as much as you know now — you can always come back and update it later.
          </p>

          <ElderForm onSubmit={handleSubmit} submitLabel="Create Profile" />
        </div>
      </main>
    </div>
  );
}
