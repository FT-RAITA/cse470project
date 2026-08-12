import axios from "axios";

const API = "http://localhost:5001/api/emergency";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const createEmergency = (elderId, latitude, longitude, token) =>
  axios.post(
    API,
    {
      elderId,
      latitude,
      longitude,
    },
    authHeaders(token)
  );

export const getEmergencyHistory = (elderId, token) =>
  axios.get(
    `${API}/elder/${elderId}`,
    authHeaders(token)
  );