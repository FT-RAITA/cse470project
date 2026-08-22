import mongoose from "mongoose";

const SCHEDULE_STATUS = ["generated", "needs-caregivers"];

const slotSchema = new mongoose.Schema(
  {
    slotIndex: { type: Number, required: true, min: 0, max: 5 },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    initialCaregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    switchCount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const switchHistorySchema = new mongoose.Schema(
  {
    fromSlotIndex: { type: Number, required: true, min: 0, max: 5 },
    toSlotIndex: { type: Number, required: true, min: 0, max: 5 },
    actorCaregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromCaregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    toCaregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const caregiverScheduleSchema = new mongoose.Schema(
  {
    scheduleDate: { type: Date, required: true },
    status: { type: String, enum: SCHEDULE_STATUS, default: "generated" },
    slots: {
      type: [slotSchema],
      validate: {
        validator(value) {
          return value.length === 6 && value.every((slot, index) => slot.slotIndex === index);
        },
        message: "A caregiver schedule must contain exactly six 4-hour slots.",
      },
    },
    switchHistory: { type: [switchHistorySchema], default: [] },
  },
  { timestamps: true, versionKey: "__v" }
);

caregiverScheduleSchema.index({ scheduleDate: 1 }, { unique: true });

export default mongoose.model("CaregiverSchedule", caregiverScheduleSchema);
