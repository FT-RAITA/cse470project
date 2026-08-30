import axios from "axios";
const API = "http://localhost:5001/api/notifications";
const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
export const getMyNotifications = (token) => axios.get(API, authHeaders(token));
export const markNotificationAsRead = (id, token) => axios.patch(`${API}/${id}/read`, {}, authHeaders(token));
export const markAllNotificationsAsRead = (token) => axios.patch(`${API}/read-all`, {}, authHeaders(token));
