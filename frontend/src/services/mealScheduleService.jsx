import axios from "axios";

const API = "http://localhost:5001/api/meal-schedules";

export const getMealSchedulesByElder = (elderId, token) => {
  return axios.get(`${API}/elder/${elderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createMealSchedule = (mealData, token) => {
  return axios.post(API, mealData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateMealSchedule = (mealId, mealData, token) => {
  return axios.put(`${API}/${mealId}`, mealData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteMealSchedule = (mealId, token) => {
  return axios.delete(`${API}/${mealId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};