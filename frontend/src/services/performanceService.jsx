import axios from "axios";

const API = "http://localhost:5001/api/caregiver-performance";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getPerformanceDashboard = (token, params = {}) =>
  axios.get(`${API}/dashboard`, { ...authHeaders(token), params });

export const getPerformanceLeaderboard = (token, params = {}) =>
  axios.get(`${API}/leaderboard`, { ...authHeaders(token), params });

export const getWeeklyWinner = (token, params = {}) =>
  axios.get(`${API}/weekly-winner`, { ...authHeaders(token), params });

export const getPerformanceActivity = (token, params = {}) =>
  axios.get(`${API}/activity`, { ...authHeaders(token), params });

export const downloadPerformanceReport = async (token, params = {}) => {
  const res = await axios.get(`${API}/report`, {
    ...authHeaders(token),
    params,
    responseType: "text",
  });
  return res;
};
