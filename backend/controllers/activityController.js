import Activity from "../models/activity.js";
import Elder from "../models/elder.js";

const findOwnedElder = (elderId, caregiverId) =>
  Elder.findOne({ _id: elderId, caregiver: caregiverId }).select("_id fullName elderID");

// GET /api/activities
// Returns every activity belonging to elders owned by the logged-in caregiver.
export const getActivities = async (req, res) => {
  try {
    const elders = await Elder.find({ caregiver: req.user.id }).select("_id");
    const elderIds = elders.map((elder) => elder._id);

    const activities = await Activity.find({ elder: { $in: elderIds } })
      .populate("elder", "fullName elderID")
      .sort({ schedule: 1, createdAt: -1 });

    return res.json(activities);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/activities/:elderId
export const getActivitiesByElder = async (req, res) => {
  try {
    const { elderId } = req.params;

    const elder = await findOwnedElder(elderId, req.user.id);
    if (!elder) {
      return res.status(404).json({ message: "Elder not found" });
    }

    const activities = await Activity.find({ elder: elder._id })
      .sort({ schedule: 1, createdAt: -1 });

    return res.json(activities);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/activities
export const createActivity = async (req, res) => {
  try {
    const { elderId, activity, duration, schedule } = req.body;

    if (!elderId || !activity || duration === undefined || !schedule) {
      return res.status(400).json({
        message: "elderId, activity, duration, and schedule are required.",
      });
    }

    const parsedDuration = Number(duration);
    if (!Number.isInteger(parsedDuration) || parsedDuration < 1) {
      return res.status(400).json({
        message: "Duration must be a whole number greater than 0.",
      });
    }

    const parsedSchedule = new Date(schedule);
    if (Number.isNaN(parsedSchedule.getTime())) {
      return res.status(400).json({
        message: "Please provide a valid schedule date and time.",
      });
    }

    const elder = await findOwnedElder(elderId, req.user.id);
    if (!elder) {
      return res.status(404).json({ message: "Elder not found" });
    }

    const newActivity = await Activity.create({
      elder: elder._id,
      createdBy: req.user.id,
      activity: String(activity).trim(),
      duration: parsedDuration,
      schedule: parsedSchedule,
    });

    const savedActivity = await Activity.findById(newActivity._id).populate(
      "elder",
      "fullName elderID"
    );

    return res.status(201).json(savedActivity);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// PUT /api/activities/:id/complete
export const completeActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const elder = await findOwnedElder(activity.elder, req.user.id);
    if (!elder) {
      return res.status(403).json({
        message: "You do not have permission to update this activity.",
      });
    }

    if (!activity.completed) {
      activity.complete_ex();
      await activity.save();
    }

    const updatedActivity = await Activity.findById(activity._id).populate(
      "elder",
      "fullName elderID"
    );

    return res.json(updatedActivity);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// DELETE /api/activities/:id
export const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const elder = await findOwnedElder(activity.elder, req.user.id);
    if (!elder) {
      return res.status(403).json({
        message: "You do not have permission to delete this activity.",
      });
    }

    await Activity.findByIdAndDelete(id);
    return res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
