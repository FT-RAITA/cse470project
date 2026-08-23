import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "");

const api = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach token automatically if one exists.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = async (credentials) => {
  const { data } = await api.post("/login", credentials);
  return data;
};

export const registerUser = async (userInfo) => {
  const { data } = await api.post("/register", userInfo);
  return data;
};

export default api;
