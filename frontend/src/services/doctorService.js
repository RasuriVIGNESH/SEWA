import { api } from '../api';

export const doctorService = {
  /**
   * Get all doctors
   */
  getAllDoctors: async () => {
    const response = await api.get('/doctors');
    return response.data;
  },

  /**
   * Get doctor by ID
   */
  getDoctorById: async (id) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },

  /**
   * Get patients assigned to a specific doctor
   */
  getDoctorPatients: async (doctorId) => {
    const response = await api.get(`/doctors/${doctorId}/patients`);
    return response.data;
  }
};
