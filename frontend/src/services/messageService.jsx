import axios from "axios";

const API = "http://localhost:5001/api/messages";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getMessages = (elderId, otherUserId, token) => {
  return axios.get(`${API}/${elderId}/${otherUserId}`, authHeaders(token));
};

export const sendMessage = (elderId, otherUserId, text, token) => {
  return axios.post(
    API,
    { elder: elderId, receiver: otherUserId, text },
    authHeaders(token)
  );
};
