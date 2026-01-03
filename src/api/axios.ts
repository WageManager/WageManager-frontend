import axios from 'axios';

export const wageManagerApi = axios.create({
  baseURL: import.meta.env.VITE_WAGEMANAGER,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

wageManagerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});