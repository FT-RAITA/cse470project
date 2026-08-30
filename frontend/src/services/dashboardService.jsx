import axios from "axios";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "");

const cleanToken = (token) => {
  const raw = String(token || localStorage.getItem("token") || "").trim();
  if (!raw) return "";

  // Be defensive if a token was previously saved with a Bearer prefix or
  // JSON quotes. Login currently stores the raw JWT, but older/stale browser
  // storage should not cause a malformed Authorization header.
  return raw
    .replace(/^Bearer\s+/i, "")
    .replace(/^"(.*)"$/, "$1")
    .trim();
};

const authHeaders = (token) => {
  const jwt = cleanToken(token);
  return jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : { headers: {} };
};

export const getElderDashboard = (elderId, range, token) =>
  axios.get(`${API}/elders/${elderId}/dashboard`, {
    ...authHeaders(token),
    params: { range },
  });

export const downloadElderDashboardPdf = (elderId, range, token) =>
  axios.get(`${API}/elders/${elderId}/dashboard/pdf`, {
    ...authHeaders(token),
    params: { range },
    responseType: "blob",
  });

export const readDashboardErrorMessage = async (error) => {
  const payload = error?.response?.data;

  if (payload instanceof Blob) {
    const text = await payload.text();
    try {
      const parsed = JSON.parse(text);
      return parsed?.message || text;
    } catch {
      return text;
    }
  }

  return payload?.message || "";
};
