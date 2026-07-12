import axios from "axios";

const API = "http://localhost:5001/api/elders";

export const getAllElders = (token) => {
  return axios.get(API, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getElderById = (id, token) => {
  return axios.get(`${API}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createElder = (elderData, token) => {
  return axios.post(API, elderData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateElder = (id, elderData, token) => {
  return axios.put(`${API}/${id}`, elderData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteElder = (id, token) => {
  return axios.delete(`${API}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};