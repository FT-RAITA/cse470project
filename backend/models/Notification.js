import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    elder: { type: mongoose.Schema.Types.ObjectId, ref: "Elder", default: null },
    emergency: { type: mongoose.Schema.Types.ObjectId, ref: "Emergency", default: null },
    type: {
      type: String,
      enum: ["medication", "doctor_appointment", "visitor", "emergency", "caregiver_task"],
      default: "emergency",
      required: true,
    },
    severity: {
      type: String,
      enum: ["info", "reminder", "warning", "critical"],
      default: "info",
    },
    title: { type: String, default: "Notification", trim: true },
    message: { type: String, required: true },
    relatedType: { type: String, default: null },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    actionUrl: { type: String, default: null },
    actionLabel: { type: String, default: null },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    dedupeKey: { type: String, default: null },
    snoozedUntil: { type: Date, default: null },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
