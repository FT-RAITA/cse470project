import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    elder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Elder",
      required: true,
      index: true,
    },

    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["medication", "meal", "exercise", "mood_checkin", "emotional_support", "doctor_appointment"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    priorityScore: {
      type: Number,
      default: 0,
    },

    dueAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "Incomplete"],
      default: "pending",
      index: true,
    },

    source: {
      type: String,
      enum: ["automated", "manual"],
      default: "automated",
    },

    relatedRef: {
      refModel: {
        type: String,
        enum: ["MedicationDoseLog", "Activity", "MealSchedule", "MoodCheckin", "DoctorAppointment", null],
        default: null,
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    dedupeKey: {
      type: String,
      required: true,
      index: true,
    },

    autoCompleted: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

taskSchema.index({ caregiver: 1, status: 1, priorityScore: -1, dueAt: 1 });
taskSchema.index({ elder: 1, dedupeKey: 1 }, { unique: true });

export default mongoose.model("Task", taskSchema);
