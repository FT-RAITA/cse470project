import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HeartHandshake,
  Plus,
  X,
  ChevronRight,
  User,
} from "lucide-react";

import Button from "../components/Button";
import InputField from "../components/InputField";
import { useAuth } from "../context/AuthContext";
import {
  getMyElders,
  connectToElder,
} from "../services/familyService";

const RELATIONS = [
  "Son",
  "Daughter",
  "Spouse",
  "Sibling",
  "Grandchild",
  "Friend",
  "Relative",
  "Other",
];

const tints = [
  "#C99A3C",
  "#3E6B5F",
  "#B5544A",
  "#7A6A9E",
  "#4C7A9E",
];

function tintFor(id) {
  const sum = id
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);

  return tints[sum % tints.length];
}

export default function FamilyDashboard() {
  const { token, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [elders, setElders] = useState([]);
  const [loadingElders, setLoadingElders] = useState(true);

  const [showConnect, setShowConnect] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [form, setForm] = useState({
    elderId: "",
    relation: "",
  });

  // -----------------------------------
  // Load connected elders
  // -----------------------------------
  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      console.log("No token available.");
      setLoadingElders(false);
      return;
    }

    console.log("Family Dashboard TOKEN:", token);
    console.log("Family Dashboard USER:", user);

    fetchElders();
  }, [authLoading, token]);

  const fetchElders = async () => {
    try {
      setLoadingElders(true);

      console.log("Sending token to getMyElders:", token);

      const res = await getMyElders(token);

      setElders(res.data);
    } catch (err) {
      console.error(
        "getMyElders error:",
        err.response?.data || err
      );

      toast.error(
        err.response?.data?.message ||
          "Could not load your elders"
      );
    } finally {
      setLoadingElders(false);
    }
  };

  // -----------------------------------
  // Connect to elder
  // -----------------------------------
  const handleConnect = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("You are not logged in.");
      return;
    }

    if (!form.elderId.trim()) {
      toast.error("Please enter an Elder ID.");
      return;
    }

    if (!form.relation) {
      toast.error("Please select your relation.");
      return;
    }

    try {
      setConnecting(true);

      console.log("Connecting with token:", token);

      await connectToElder(
        form.elderId.trim(),
        form.relation,
        token
      );

      toast.success("Connected successfully!");

      setShowConnect(false);

      setForm({
        elderId: "",
        relation: "",
      });

      await fetchElders();
    } catch (err) {
      console.error(
        "connectToElder error:",
        err.response?.data || err
      );

      toast.error(
        err.response?.data?.message ||
          "Could not connect to that elder"
      );
    } finally {
      setConnecting(false);
    }
  };

  // -----------------------------------
  // Get relation
  // -----------------------------------
  const myRelation = (elder) => {
    const member = elder.familyMembers?.find(
      (m) =>
        String(m.user?._id || m.user) ===
        String(user?.id || user?._id)
    );

    return member?.relation;
  };

  // -----------------------------------
  // Auth loading
  // -----------------------------------
  if (authLoading) {
    return (
      <main className="flex-1 px-8 py-8 lg:px-12">
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-sm text-ink-soft">
            Loading your account...
          </p>
        </div>
      </main>
    );
  }

  // -----------------------------------
  // Not authenticated
  // -----------------------------------
  if (!token) {
    return (
      <main className="flex-1 px-8 py-8 lg:px-12">
        <div className="rounded-xl border border-border bg-paper-card p-8 text-center">
          <h2 className="font-display text-lg font-semibold text-ink">
            Please log in
          </h2>

          <p className="mt-2 text-sm text-ink-soft">
            Your login session could not be found.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 px-8 py-8 lg:px-12">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Your elders
            </h1>

            <p className="mt-1 text-sm text-ink-soft">
              {elders.length === 0
                ? "Connect to an elder using the ID their caregiver shared with you"
                : `Connected to ${elders.length} ${
                    elders.length === 1
                      ? "profile"
                      : "profiles"
                  }`}
            </p>
          </div>

          <Button
            icon={Plus}
            size="md"
            fullWidth={false}
            onClick={() => setShowConnect(true)}
          >
            Connect to an Elder
          </Button>
        </div>

        {/* Loading */}
        {loadingElders ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl border border-border bg-paper-card"
              />
            ))}
          </div>
        ) : elders.length === 0 ? (

          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-paper-card py-20 text-center">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake
                size={24}
                strokeWidth={2}
              />
            </div>

            <h3 className="font-display text-lg font-semibold text-ink">
              No elders connected yet
            </h3>

            <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
              Ask the caregiver for the elder's ID and
              connect below to see their profile.
            </p>

            <Button
              icon={Plus}
              className="mt-5"
              size="md"
              fullWidth={false}
              onClick={() => setShowConnect(true)}
            >
              Connect to an Elder
            </Button>
          </div>

        ) : (

          /* Elder cards */
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

            {elders.map((elder) => {
              const tint = tintFor(elder._id);

              const initials = elder.fullName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={elder._id}
                  onClick={() =>
                    navigate(
                      `/family/elders/${elder._id}`
                    )
                  }
                  className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-paper-card shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                >

                  <div
                    className="h-1.5 w-full"
                    style={{
                      backgroundColor: tint,
                    }}
                  />

                  <div className="p-5">

                    {/* Elder info */}
                    <div className="flex items-center gap-3">

                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-base font-semibold text-white"
                        style={{
                          backgroundColor: tint,
                        }}
                      >
                        {initials}
                      </div>

                      <div>
                        <h3 className="font-display text-base font-semibold text-ink">
                          {elder.fullName}
                        </h3>

                        <p className="text-xs text-ink-soft">
                          {elder.age
                            ? `${elder.age} years`
                            : "Age not set"}

                          {myRelation(elder)
                            ? ` · You: ${myRelation(
                                elder
                              )}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    {/* Caregiver */}
                    {elder.caregiver && (
                      <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-paper px-3 py-2 text-xs text-ink-soft">
                        <User
                          size={12}
                          strokeWidth={2}
                        />

                        Caregiver:{" "}
                        {elder.caregiver.name}
                      </div>
                    )}

                    {/* Profile button */}
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                        View profile

                        <ChevronRight
                          size={14}
                          strokeWidth={2.5}
                        />
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}

          </div>
        )}

      </main>

      {/* Connect modal */}
      {showConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">

          <div className="w-full max-w-sm rounded-xl border border-border bg-paper-card p-6 shadow-lg">

            <div className="mb-4 flex items-center justify-between">

              <h3 className="font-display text-lg font-semibold text-ink">
                Connect to an elder
              </h3>

              <button
                onClick={() =>
                  setShowConnect(false)
                }
                className="rounded-md p-1 text-ink-soft hover:bg-paper hover:text-ink"
              >
                <X
                  size={16}
                  strokeWidth={2}
                />
              </button>

            </div>

            <form
              onSubmit={handleConnect}
              className="space-y-4"
            >

              <InputField
                size="md"
                label="Elder ID"
                name="elderId"
                required
                mono
                value={form.elderId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    elderId: e.target.value,
                  }))
                }
                placeholder="e.g. ELD-123456"
              />

              <InputField
                size="md"
                label="Your Relation"
                name="relation"
                as="select"
                required
                options={RELATIONS}
                value={form.relation}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    relation: e.target.value,
                  }))
                }
              />

              <div className="flex justify-end pt-1">

                <Button
                  type="submit"
                  size="md"
                  fullWidth={false}
                  loading={connecting}
                >
                  Connect
                </Button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}