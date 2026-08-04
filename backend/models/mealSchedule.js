import mongoose from "mongoose";
const mealSchema = new mongoose.Schema({
  elder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Elder",
    required: true,
  },
  day: {
    type: String,
    enum: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    required: true,
  },
  mealType: {
    type: String,
    enum: ["Breakfast", "Lunch", "Snack", "Dinner"],
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  food: {
    type: String,
    required: true,
  },
  notes: String,
}, { timestamps: true });

const MealSchedule = mongoose.model("MealSchedule", mealSchema);

export default MealSchedule;