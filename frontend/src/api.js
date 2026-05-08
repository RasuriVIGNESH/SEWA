import axios from 'axios';
import { useAuthStore } from './store';
import toast from 'react-hot-toast';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
});
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) {
    useAuthStore.getState().logout();
    toast.error('Session expired. Please log in again.');
  } else {
    toast.error(error.response?.data?.message || 'An error occurred');
  }
  return Promise.reject(error);
});