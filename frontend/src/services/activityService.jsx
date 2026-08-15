import axios from "axios";

const API = "http://localhost:5001/api";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getActivities = (token) =>
  axios.get(`${API}/activities`, authHeaders(token));

export const getActivitiesByElder = (elderId, token) =>
  axios.get(`${API}/activities/${elderId}`, authHeaders(token));

export const createActivity = (activityData, token) =>
  axios.post(`${API}/activities`, activityData, authHeaders(token));

export const completeActivity = (activityId, token) =>
  axios.put(`${API}/activities/${activityId}/complete`, {}, authHeaders(token));

export const deleteActivity = (activityId, token) =>
  axios.delete(`${API}/activities/${activityId}`, authHeaders(token));
