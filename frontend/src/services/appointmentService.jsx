import axios from "axios";

const API = "http://localhost:5001/api/appointments";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getBookableElders = (token) => {
  return axios.get(`${API}/elders`, authHeaders(token));
};

export const getAvailableSlots = (elderId, date, token) => {
  return axios.get(`${API}/slots`, {
    ...authHeaders(token),
    params: { elderId, date },
  });
};

export const getAppointments = (token, params = {}) => {
  return axios.get(API, {
    ...authHeaders(token),
    params,
  });
};

export const getAppointmentById = (id, token) => {
  return axios.get(`${API}/${id}`, authHeaders(token));
};

export const getAppointmentStats = (token) => {
  return axios.get(`${API}/stats`, authHeaders(token));
};

export const createAppointment = (data, token) => {
  return axios.post(API, data, authHeaders(token));
};

export const updateAppointmentStatus = (id, status, token) => {
  return axios.patch(`${API}/${id}/status`, { status }, authHeaders(token));
};

export const updateAppointment = (id, data, token) => {
  return axios.put(`${API}/${id}`, data, authHeaders(token));
};
