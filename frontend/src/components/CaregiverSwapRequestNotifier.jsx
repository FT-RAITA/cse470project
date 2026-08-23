import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getCaregiverSwapRequests } from "../services/caregiverSwapRequestService";

export default function CaregiverSwapRequestNotifier() {
  const { token, user } = useAuth();
  const notifiedIds = useRef(new Set());

  useEffect(() => {
    if (!token || user?.role !== "caregiver") {
      notifiedIds.current.clear();
      return undefined;
    }

    let cancelled = false;

    const checkRequests = async () => {
      try {
        const response = await getCaregiverSwapRequests(token);
        if (cancelled) return;

        const pending = (response.data.incoming || []).filter(
          (request) => request.status === "pending"
        );

        pending.forEach((request) => {
          if (notifiedIds.current.has(request._id)) return;
          notifiedIds.current.add(request._id);

          const requesterName = request.requester?.name || "A caregiver";
          toast(`${requesterName} sent you a schedule swap request. Open Caregiver Schedule to accept or reject it.`, {
            icon: "🔔",
            duration: 7000,
          });
        });
      } catch {
        // Notification polling must never interfere with login or navigation.
      }
    };

    checkRequests();
    const timer = window.setInterval(checkRequests, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [token, user?.id, user?.role]);

  return null;
}
