import apiClient from './apiClient';

export const doctorsApi = {
    /** All doctors with patient counts */
    async getDoctors() {
        const { data } = await apiClient.get('/api/doctors');
        return data;
    },

    /** Single doctor by ID */
    async getDoctor(doctorId) {
        const { data } = await apiClient.get(`/api/doctors/${doctorId}`);
        return data;
    },
};
