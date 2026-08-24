import MoodCheckin from '../models/MoodCheckin.js';
import Elder from '../models/elder.js';
import { completeMoodCheckinTask, reopenMoodCheckinTask } from './taskController.js';
import { generateTasksForElder } from '../services/taskgenerationService.js';

// Caregiver OR a connected family member can read
const assertReadAccess = async (elderId, userId) => {
  return await Elder.findOne({
    _id: elderId,
    $or: [
      { caregiver: userId },
      { "familyMembers.user": userId },
    ],
  });
};

// Only the owning caregiver can write
const assertWriteAccess = async (elderId, caregiverId) => {
  return await Elder.findOne({ _id: elderId, caregiver: caregiverId });
};

// Create a mood check-in for an elder (caregiver only)
export const createMoodCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    const caregiver = req.user.id;

    const elder = await assertWriteAccess(id, caregiver);
    if (!elder) {
      return res.status(404).json({ message: 'Elder not found' });
    }

    const { date, overallMood, physicalCondition, energyLevel, appetite, issues, notes } = req.body;

    const checkin = new MoodCheckin({
      elder: id,
      caregiver,
      date: date || Date.now(),
      overallMood,
      physicalCondition,
      energyLevel,
      appetite,
      issues,
      notes,
    });

    const saved = await checkin.save();
    await completeMoodCheckinTask(id, saved.date, saved._id);
    await generateTasksForElder(id);
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mood check-in history (caregiver or connected family member)
export const getMoodCheckins = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const elder = await assertReadAccess(id, userId);
    if (!elder) {
      return res.status(404).json({ message: 'Elder not found' });
    }

    const checkins = await MoodCheckin.find({ elder: id }).sort({ date: -1 });
    res.json(checkins);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a single check-in (caregiver who created it)
export const getMoodCheckinById = async (req, res) => {
  try {
    const { checkinId } = req.params;
    const caregiver = req.user.id;

    const checkin = await MoodCheckin.findOne({ _id: checkinId, caregiver });
    if (!checkin) {
      return res.status(404).json({ message: 'Check-in not found' });
    }
    res.json(checkin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a check-in (caregiver only)

export const deleteMoodCheckin = async (req, res) => {
  try {
    const { checkinId } = req.params;
    const caregiver = req.user.id;

    const deleted = await MoodCheckin.findOneAndDelete({ _id: checkinId, caregiver });
    if (!deleted) {
      return res.status(404).json({ message: 'Check-in not found' });
    }

    await reopenMoodCheckinTask(deleted.elder, deleted.date);

    res.json({ message: 'Check-in deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};