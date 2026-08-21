import axios from "axios";

const API = "http://localhost:5001/api";

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});


export const getTodayTasks = (token) =>
  axios.get(`${API}/tasks/today`, authHeaders(token));


export const regenerateTasksForElder = (elderId, token) =>
  axios.post(
    `${API}/tasks/generate/${elderId}`,
    {},
    authHeaders(token)
  );


export const completeTask = (taskId, token) =>
  axios.patch(
    `${API}/tasks/${taskId}/complete`,
    {},
    authHeaders(token)
  );


