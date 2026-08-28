import axios from "axios";

const API = "http://localhost:5001/api";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getWellnessProgress = (elderId, token) =>
  axios.get(`${API}/elders/${elderId}/wellness-progress`, authHeaders(token));
