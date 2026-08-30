import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("elder", "fullName elderID")
      .populate("emergency", "createdAt latitude longitude status")
      .sort({ createdAt: -1 })
      .limit(200);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { returnDocument: "after" }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found." });
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
