import { useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, MapPin, Phone, X } from "lucide-react";

import Button from "./Button";
import { useAuth } from "../context/AuthContext";
import { createEmergency } from "../services/emergencyService";

export default function EmergencySOS({ elder }) {
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleEmergency = () => {
    if (!token) {
      toast.error("You are not logged in.");
      return;
    }

    if (!navigator.geolocation) {
      toast.error(
        "Location services are not supported by this browser."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to activate Emergency SOS for ${elder.fullName}?`
    );

    if (!confirmed) return;

    setLoading(true);

    // ==========================================
    // THIS IS WHERE THE BROWSER GETS
    // THE CAREGIVER'S CURRENT LOCATION
    // ==========================================
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        console.log("Caregiver latitude:", latitude);
        console.log("Caregiver longitude:", longitude);

        try {
          // ==========================================
          // SEND CAREGIVER LOCATION TO BACKEND
          // ==========================================
          const response = await createEmergency(
            elder._id,
            latitude,
            longitude,
            token
          );

          setResult(response.data);

          toast.success("Emergency SOS activated.");

        } catch (error) {
          console.error(
            "Emergency SOS error:",
            error.response?.data || error
          );

          toast.error(
            error.response?.data?.message ||
              "Could not activate emergency."
          );
        } finally {
          setLoading(false);
        }
      },

      (error) => {
        console.error("========== LOCATION ERROR ==========");
        console.error("Code:", error.code);
        console.error("Message:", error.message);
        console.error("Full error:", error);
        console.error("====================================");

        setLoading(false);

        if (error.code === 1) {
          toast.error(
            "Location permission was denied."
          );
        } else if (error.code === 2) {
          toast.error(
            "Location unavailable. Check your Wi-Fi/network and Windows location settings."
          );
        } else if (error.code === 3) {
          toast.error(
            "Location request timed out. Try again."
          );
        }
        else {
          toast.error(
            "Could not get your current location."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      <Button
        variant="danger"
        icon={AlertTriangle}
        onClick={handleEmergency}
        loading={loading}
      >
        Emergency SOS
      </Button>

      {result && (
        <EmergencyResult
          result={result}
          onClose={() => setResult(null)}
        />
      )}
    </>
  );
}


// ------------------------------------------------
// Emergency results
// ------------------------------------------------

function EmergencyResult({ result, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-paper-card p-6 shadow-xl">

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={24} />
              <h2 className="text-xl font-semibold">
                Emergency Activated
              </h2>
            </div>

            <p className="mt-2 text-sm text-ink-soft">
              Emergency SOS has been activated for{" "}
              <strong>{result.emergency.elder.name}</strong>.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-paper"
          >
            <X size={20} />
          </button>
        </div>


        <div className="mt-6">
          <h3 className="mb-3 font-semibold text-ink">
            Nearby Emergency Hospitals
          </h3>

          {result.hospitals.length === 0 ? (
            <p className="text-sm text-ink-soft">
              No emergency hospitals were found.
            </p>
          ) : (
            <div className="space-y-3">
              {result.hospitals.map((hospital, index) => (
                <div
                  key={hospital._id}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="font-semibold text-ink">
                        {index + 1}. {hospital.name}
                      </p>

                      <div className="mt-2 flex gap-2 text-sm text-ink-soft">
                        <MapPin
                          size={16}
                          className="mt-0.5 shrink-0"
                        />

                        <span>
                          {hospital.address}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <Phone size={16} />

                        <a
                          href={`tel:${hospital.phone}`}
                          className="text-primary underline"
                        >
                          {hospital.phone}
                        </a>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold">
                      {hospital.distance} km
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg bg-paper p-4 text-sm text-ink-soft">
          <strong>Emergency location:</strong>{" "}
          {result.emergency.triggeredAt
            ? new Date(
                result.emergency.triggeredAt
              ).toLocaleString()
            : "Current location"}
        </div>

      </div>
    </div>
  );
}