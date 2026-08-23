import axios from "axios";

const API_ROOT = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "");

const API = `${API_ROOT}/caregiver-swap-requests`;

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getCaregiverSwapRequests = (token, date = null) =>
  axios.get(API, {
    ...authHeaders(token),
    params: date ? { date } : {},
  });

export const createCaregiverSwapRequest = (
  date,
  requesterSlotIndex,
  receiverSlotIndex,
  receiverId,
  token
) =>
  axios.post(
    API,
    { date, requesterSlotIndex, receiverSlotIndex, receiverId },
    authHeaders(token)
  );

export const acceptCaregiverSwapRequest = (id, token) =>
  axios.post(`${API}/${id}/accept`, {}, authHeaders(token));

export const rejectCaregiverSwapRequest = (id, token) =>
  axios.post(`${API}/${id}/reject`, {}, authHeaders(token));
