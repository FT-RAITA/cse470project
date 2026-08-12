import Emergency from "../models/Emergency.js";
import Hospital from "../models/Hospital.js";
import Elder from "../models/elder.js";
import Notification from "../models/Notification.js";

// ---------------------------------------------
// Calculate distance between two coordinates
// Returns distance in kilometers
// ---------------------------------------------
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// ---------------------------------------------
// Trigger Emergency SOS
// ---------------------------------------------
export const createEmergency = async (req, res) => {
  try {
    const { elderId, latitude, longitude } = req.body;

    // -----------------------------------------
    // Validate coordinates
    // -----------------------------------------
    if (
      latitude === undefined ||
      longitude === undefined ||
      Number.isNaN(Number(latitude)) ||
      Number.isNaN(Number(longitude))
    ) {
      return res.status(400).json({
        message: "Valid location coordinates are required.",
      });
    }

    // -----------------------------------------
    // Find elder and connected family members
    // -----------------------------------------
    const elder = await Elder.findById(elderId)
      .populate("caregiver", "name email phone")
      .populate("familyMembers.user", "name email phone");

    if (!elder) {
      return res.status(404).json({
        message: "Elder not found.",
      });
    }

    // -----------------------------------------
    // Only assigned caregiver can trigger SOS
    // -----------------------------------------
    if (String(elder.caregiver._id) !== String(req.user._id)) {
      return res.status(403).json({
        message: "Only the assigned caregiver can trigger an emergency.",
      });
    }

    // -----------------------------------------
    // Find emergency hospitals
    // -----------------------------------------
    const hospitals = await Hospital.find({
      emergencyAvailable: true,
    });

    // -----------------------------------------
    // Calculate distance from caregiver
    // and sort nearest first
    // -----------------------------------------
    const hospitalsWithDistance = hospitals
      .map((hospital) => {
        const distance = calculateDistance(
          Number(latitude),
          Number(longitude),
          Number(hospital.latitude),
          Number(hospital.longitude)
        );

        return {
          _id: hospital._id,
          name: hospital.name,
          address: hospital.address,
          phone: hospital.phone,
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          emergencyAvailable: hospital.emergencyAvailable,
          distance: Number(distance.toFixed(2)),
        };
      })
      .sort((a, b) => a.distance - b.distance);

    // -----------------------------------------
    // Create emergency record
    // -----------------------------------------
    const emergency = await Emergency.create({
      elder: elder._id,
      caregiver: req.user._id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      status: "active",
    });

    // -----------------------------------------
    // Notify all connected family members
    // -----------------------------------------
    for (const familyMember of elder.familyMembers || []) {
      if (!familyMember.user?._id) continue;

      await Notification.create({
        recipient: familyMember.user._id,
        elder: elder._id,
        emergency: emergency._id,
        type: "emergency",
        message: `Emergency SOS has been activated for ${elder.fullName}.`,
      });
    }

    // -----------------------------------------
    // Return everything frontend needs
    // -----------------------------------------
    res.status(201).json({
      message: "Emergency SOS activated.",

      emergency: {
        id: emergency._id,

        elder: {
          id: elder._id,
          name: elder.fullName,
          elderID: elder.elderID,
        },

        caregiver: elder.caregiver,
        triggeredAt: emergency.createdAt,
      },

      hospitals: hospitalsWithDistance,

      // IMPORTANT:
      // Use elder.familyMembers, not familyMembers
      familyMembers: elder.familyMembers || [],
    });
  } catch (error) {
    console.error("CREATE EMERGENCY ERROR:", error);

    res.status(500).json({
      message: "Failed to activate emergency.",
      error: error.message,
    });
  }
};

// ---------------------------------------------
// Get emergency history for an elder
// ---------------------------------------------
export const getEmergencyHistory = async (req, res) => {
  try {
    const { elderId } = req.params;

    const elder = await Elder.findById(elderId);

    if (!elder) {
      return res.status(404).json({
        message: "Elder not found.",
      });
    }

    // -----------------------------------------
    // Caregiver can view their elder's emergencies
    // -----------------------------------------
    if (String(elder.caregiver) !== String(req.user._id)) {
      return res.status(403).json({
        message: "You do not have permission to view these emergencies.",
      });
    }

    const emergencies = await Emergency.find({
      elder: elderId,
    }).sort({ createdAt: -1 });

    res.json(emergencies);
  } catch (error) {
    console.error("GET EMERGENCY HISTORY ERROR:", error);

    res.status(500).json({
      message: "Failed to load emergency history.",
    });
  }
};