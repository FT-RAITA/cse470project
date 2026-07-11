import axios from "axios";

// Change this to your backend's base URL
const API_URL = "http://localhost:5001/api/auth";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token automatically if one exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = async (credentials) => {
  // credentials: { email, password }
  const { data } = await api.post("/login", credentials);
  return data; // expected: { user, token }
};

export const registerUser = async (userInfo) => {
  // userInfo: { name, email, password }
  const { data } = await api.post("/register", userInfo);
  return data;
};

export default api;
