import MealSchedule from "../models/mealSchedule.js";
import Elder from "../models/elder.js";

export const assertElderOwnership = async (elderId, caregiverId) => {
  return await Elder.findOne({
    _id: elderId,
    caregiver: caregiverId,
  });
};

export const createMealSchedule = async (req, res) => {
  try {
    const { elder, day, mealType, time, food, notes } = req.body;

    const owner = await assertElderOwnership(elder, req.user.id);

    if (!owner) {
      return res.status(404).json({
        message: "Elder not found",
      });
    }

    const newMealSchedule = new MealSchedule({
      elder,
      day,
      mealType,
      time,
      food,
      notes,
    });

    const savedMealSchedule = await newMealSchedule.save();

    res.status(201).json(savedMealSchedule);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const getMealSchedulesByElder = async (req, res) => {
  try {
    const { elderid } = req.params;

    const elder = await assertElderOwnership(elderid, req.user.id);

    if (!elder) {
      return res.status(404).json({
        message: "Elder not found",
      });
    }

    const mealSchedules = await MealSchedule.find({
      elder: elderid,
    }).sort({
      day: 1,
      time: 1,
    });

    res.json(mealSchedules);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const updateMealSchedule = async (req, res) => {
  try {
    const { mealid } = req.params;

    const meal = await MealSchedule.findById(mealid);

    if (!meal) {
      return res.status(404).json({
        message: "Meal schedule not found",
      });
    }

    const owner = await assertElderOwnership(meal.elder, req.user.id);

    if (!owner) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const updatedMealSchedule = await MealSchedule.findByIdAndUpdate(
      mealid,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json(updatedMealSchedule);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const deleteMealSchedule = async (req, res) => {
  try {
    const { mealid } = req.params;

    const meal = await MealSchedule.findById(mealid);

    if (!meal) {
      return res.status(404).json({
        message: "Meal schedule not found",
      });
    }

    const owner = await assertElderOwnership(meal.elder, req.user.id);

    if (!owner) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await MealSchedule.findByIdAndDelete(mealid);

    res.json({
      message: "Meal schedule deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};