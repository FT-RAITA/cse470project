import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    elder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Elder",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      required: true,
      trim: true,
    },
    frequency: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledTimes: {
      type: [String],
      default: [],
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
    },
    quantityRemaining: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantityUnit: {
      type: String,
      default: "pills",
      trim: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Paused", "Stopped", "Discontinued"],
      default: "Active",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

medicationSchema.index({ elder: 1, status: 1 });

medicationSchema.virtual("isLowStock").get(function () {
  return this.quantityRemaining <= this.lowStockThreshold;
});

medicationSchema.set("toJSON", { virtuals: true });
medicationSchema.set("toObject", { virtuals: true });

export default mongoose.model("Medication", medicationSchema);
