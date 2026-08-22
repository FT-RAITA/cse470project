import axios from "axios";

const API = "http://localhost:5001/api/caregiver-schedule";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getCaregiverSchedule = (date, token) =>
  axios.get(API, {
    ...authHeaders(token),
    params: { date },
  });

export const generateNextDayCaregiverSchedule = (token) =>
  axios.post(`${API}/generate-next-day`, {}, authHeaders(token));

export const switchCaregiverSlots = (date, fromSlotIndex, toSlotIndex, token) =>
  axios.post(
    `${API}/switch`,
    { date, fromSlotIndex, toSlotIndex },
    authHeaders(token)
  );

export const updateCaregiverSchedulerAvailability = (schedulerAvailable, token) =>
  axios.patch(
    `${API}/availability`,
    { schedulerAvailable },
    authHeaders(token)
  );
