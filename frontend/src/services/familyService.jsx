import axios from "axios";

const API = "http://localhost:5001/api/family";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const connectToElder = (elderId, relation, token) =>
  axios.post(`${API}/connect`, { elderId, relation }, authHeaders(token));

export const getMyElders = (token) =>
  axios.get(`${API}/my-elders`, authHeaders(token));
