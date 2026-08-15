import axios from "axios";

const API = "http://localhost:5001/api";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getDoctorAppointments = (token) =>
  axios.get(`${API}/doctor-appointments`, authHeaders(token));

export const getDoctorAppointmentsByElder = (elderId, token) =>
  axios.get(`${API}/doctor-appointments/${elderId}`, authHeaders(token));

export const createDoctorAppointment = (data, token) =>
  axios.post(`${API}/doctor-appointments`, data, authHeaders(token));

export const updateDoctorAppointmentStatus = (id, status, token) =>
  axios.put(`${API}/doctor-appointments/${id}/status`, { status }, authHeaders(token));

export const deleteDoctorAppointment = (id, token) =>
  axios.delete(`${API}/doctor-appointments/${id}`, authHeaders(token));