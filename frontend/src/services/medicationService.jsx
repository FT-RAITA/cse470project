import axios from "axios";

const API = "http://localhost:5001/api";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getMedicationDashboard = (elderId, token) =>
  axios.get(`${API}/elders/${elderId}/care-meds/dashboard`, authHeaders(token));

export const createCareMedication = (elderId, data, token) =>
  axios.post(`${API}/elders/${elderId}/care-meds`, data, authHeaders(token));

export const updateCareMedication = (elderId, medId, data, token) =>
  axios.put(
    `${API}/elders/${elderId}/care-meds/${medId}`,
    data,
    authHeaders(token)
  );

export const discontinueCareMedication = (elderId, medId, token) =>
  axios.patch(
    `${API}/elders/${elderId}/care-meds/${medId}/discontinue`,
    {},
    authHeaders(token)
  );

export const deleteCareMedication = (elderId, medId, token) =>
  axios.delete(
    `${API}/elders/${elderId}/care-meds/${medId}`,
    authHeaders(token)
  );

export const updateDoseStatus = (elderId, doseId, status, token, notes = "") =>
  axios.patch(
    `${API}/elders/${elderId}/care-meds/doses/${doseId}/status`,
    { status, notes },
    authHeaders(token)
  );

export const updateInventory = (elderId, medId, data, token) =>
  axios.patch(
    `${API}/elders/${elderId}/care-meds/${medId}/inventory`,
    data,
    authHeaders(token)
  );
