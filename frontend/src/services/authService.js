import { api } from '../api';

export const authService = {
  /**
   * Register a new doctor
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Login a doctor
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  }
};
