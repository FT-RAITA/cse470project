import axios from "axios";

const API = "http://localhost:5001/api";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getDailyRoutine = (elderId, date, token) =>
  axios.get(`${API}/elders/${elderId}/daily-routine`, {
    ...authHeaders(token),
    params: date ? { date } : {},
  });