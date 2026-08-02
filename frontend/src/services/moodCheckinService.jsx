import axios from "axios";

const API = "http://localhost:5001/api";

export const createMoodCheckin = (elderId, data, token) => {
  return axios.post(`${API}/elders/${elderId}/mood-checkins`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getMoodCheckins = (elderId, token) => {
  return axios.get(`${API}/elders/${elderId}/mood-checkins`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteMoodCheckin = (checkinId, token) => {
  return axios.delete(`${API}/mood-checkins/${checkinId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};