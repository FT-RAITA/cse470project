import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, UserPlus, HeartHandshake } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ElderCard from "../components/ElderCard";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { getAllElders, deleteElder as deleteElderApi } from "../services/elderService";
import MoodCheckinModal from "../components/MoodCheckinModal";

export default function CargiverDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [elders, setElders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null); // { id, name }
  const [checkinElder, setCheckinElder] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetchElders();
  }, [token]);

  const fetchElders = async () => {
    try {
      setLoading(true);
      const res = await getAllElders(token);
      setElders(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load elders");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return elders;
    return elders.filter((e) =>
      e.fullName.toLowerCase().includes(query.toLowerCase())
    );
  }, [elders, query]);

  const confirmDelete = async () => {
    try {
      await deleteElderApi(pendingDelete.id, token);
      setElders((prev) => prev.filter((e) => e._id !== pendingDelete.id));
      toast.success(`${pendingDelete.name} was removed`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete elder");
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 px-8 py-8 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Your elders
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {elders.length} {elders.length === 1 ? "profile" : "profiles"} under your care
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                strokeWidth={2}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name"
                className="w-56 rounded-lg border border-border bg-paper-card py-2.5 pl-9 pr-3 text-sm
                  text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <Button icon={UserPlus} size="md" fullWidth={false} onClick={() => navigate("/elders/add")}>
              Add Elder
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-xl border border-border bg-paper-card"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-paper-card py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake size={24} strokeWidth={2} />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">
              {query ? "No matches found" : "No elder profiles yet"}
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
              {query
                ? `Nobody named "${query}" is in your care list.`
                : "Add your first elder profile to start tracking their care details."}
            </p>
            {!query && (
              <Button
                icon={UserPlus}
                size="md"
                fullWidth={false}
                className="mt-5"
                onClick={() => navigate("/elders/add")}
              >
                Add Elder
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((elder) => (
              <ElderCard
                key={elder._id}
                elder={elder}
                onEdit={(id) => navigate(`/elders/${id}/edit`)}
                onDelete={(id, name) => setPendingDelete({ id, name })}
                onMoodCheckin={(elder) => setCheckinElder(elder)}
              />
            ))}
          </div>
        )}
      </main>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-paper-card p-6 shadow-lg">
            <h3 className="font-display text-lg font-semibold text-ink">
              Remove {pendingDelete.name}?
            </h3>
            <p className="mt-1.5 text-sm text-ink-soft">
              This deletes their entire profile, including medical history and
              emergency contacts. This can't be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" size="md" fullWidth={false} onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="md" fullWidth={false} onClick={confirmDelete}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
      {checkinElder && (
        <MoodCheckinModal
          elder={checkinElder}
          onClose={() => setCheckinElder(null)}
        />
      )}
    </div>
  );
}
