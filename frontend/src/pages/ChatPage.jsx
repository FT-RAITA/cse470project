import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import { useAuth } from "../context/AuthContext";
import { getElderById } from "../services/elderService";

export default function ChatPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [elder, setElder] = useState(null);
  const [loading, setLoading] = useState(true);

  const backTo = user?.role === "caregiver" ? `/elders/${id}` : `/family/elders/${id}`;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getElderById(id, token);
        setElder(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load this conversation");
        navigate(backTo);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-8 py-8 lg:px-12">
        <Link
          to={backTo}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-primary"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to profile
        </Link>

        <div className="mx-auto max-w-2xl">
          {loading ? (
            <div className="flex h-[500px] items-center justify-center rounded-xl border border-border bg-paper-card">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <Chat elder={elder} />
          )}
        </div>
      </main>
    </div>
  );
}
