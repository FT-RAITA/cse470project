import Notification from "../models/Notification.js";

let socketServer = null;

export const setNotificationSocketServer = (io) => {
  socketServer = io;
};

export const createNotification = async ({
  recipient,
  elder = null,
  emergency = null,
  type,
  severity = "info",
  title = "Notification",
  message,
  relatedType = null,
  relatedId = null,
  actionUrl = null,
  actionLabel = null,
  dedupeKey = null,
}) => {
  if (!recipient || !message || !type) return null;

  try {
    const payload = {
      recipient,
      elder,
      emergency,
      type,
      severity,
      title,
      message,
      relatedType,
      relatedId,
      actionUrl,
      actionLabel,
      dedupeKey: dedupeKey ? `${recipient}:${dedupeKey}` : null,
    };

    let notification;
    if (payload.dedupeKey) {
      notification = await Notification.findOneAndUpdate(
        { dedupeKey: payload.dedupeKey },
        { $setOnInsert: payload },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
      if (notification.createdAt && notification.updatedAt &&
          notification.createdAt.getTime() !== notification.updatedAt.getTime()) {
        return notification;
      }
    } else {
      notification = await Notification.create(payload);
    }

    const populated = await Notification.findById(notification._id)
      .populate("elder", "fullName elderID")
      .populate("emergency", "createdAt latitude longitude status");

    if (socketServer) {
      socketServer.to(`user:${recipient}`).emit("notification:new", populated);
    }

    return populated;
  } catch (error) {
    if (error?.code === 11000) {
      return Notification.findOne({ dedupeKey: `${recipient}:${dedupeKey}` });
    }
    console.error("NOTIFICATION CREATE ERROR:", error.message);
    return null;
  }
};
