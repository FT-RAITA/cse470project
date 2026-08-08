import axios from "axios";

const API = "http://localhost:5001/api";
const UPLOADS = "http://localhost:5001/uploads/medical-reports";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const reportFileUrl = (fileName) => `${UPLOADS}/${fileName}`;

// ---- Elder CRUD ----

export const getAllElders = (token) =>
  axios.get(`${API}/elders`, authHeaders(token));

export const getElderById = (id, token) =>
  axios.get(`${API}/elders/${id}`, authHeaders(token));

export const createElder = (elderData, token) =>
  axios.post(`${API}/elders`, elderData, authHeaders(token));

export const updateElder = (id, elderData, token) =>
  axios.put(`${API}/elders/${id}`, elderData, authHeaders(token));

export const deleteElder = (id, token) =>
  axios.delete(`${API}/elders/${id}`, authHeaders(token));

// ---- Records ----

export const getRecordsDashboard = (elderId, token) =>
  axios.get(`${API}/elders/${elderId}/records/dashboard`, authHeaders(token));

export const getMedicalRecords = (elderId, token, params = {}) =>
  axios.get(`${API}/elders/${elderId}/records`, {
    ...authHeaders(token),
    params,
  });

export const createMedicalRecord = (elderId, data, token) =>
  axios.post(`${API}/elders/${elderId}/records`, data, authHeaders(token));

export const updateMedicalRecord = (elderId, recordId, data, token) =>
  axios.put(
    `${API}/elders/${elderId}/records/${recordId}`,
    data,
    authHeaders(token)
  );

export const deleteMedicalRecord = (elderId, recordId, token) =>
  axios.delete(
    `${API}/elders/${elderId}/records/${recordId}`,
    authHeaders(token)
  );

export const createMedication = (elderId, data, token) =>
  axios.post(`${API}/elders/${elderId}/medications`, data, authHeaders(token));

export const updateMedication = (elderId, medId, data, token) =>
  axios.patch(
    `${API}/elders/${elderId}/medications/${medId}`,
    data,
    authHeaders(token)
  );

export const uploadReport = (elderId, formData, token) =>
  axios.post(`${API}/elders/${elderId}/reports`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

export const deleteReport = (elderId, reportId, token) =>
  axios.delete(
    `${API}/elders/${elderId}/reports/${reportId}`,
    authHeaders(token)
  );
