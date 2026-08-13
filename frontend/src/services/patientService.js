import { api } from '../api';

export const patientService = {
  /**
   * Fetch all patients
   */
  getAllPatients: async () => {
    const response = await api.get('/patients');
    return response.data;
  },

  /**
   * Fetch a single patient by ID
   */
  getPatientById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  /**
   * Create a new patient (Admit patient)
   */
  createPatient: async (patientData) => {
    const response = await api.post('/patients/new', patientData);
    return response.data;
  },

  /**
   * Update an existing patient
   */
  updatePatient: async (id, patientData) => {
    const response = await api.patch(`/patients/${id}`, patientData);
    return response.data;
  },

  /**
   * Delete a patient
   */
  deletePatient: async (id) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },

  /**
   * Discharge a patient
   */
  dischargePatient: async (id) => {
    const response = await api.post(`/api/patients/${id}/discharge`);
    return response.data;
  },

  /**
   * Assign a patient to a doctor
   */
  assignPatient: async (assignmentData) => {
    const response = await api.post('/patients/assign', assignmentData);
    return response.data;
  },

  /**
   * Get unassigned patients
   */
  getUnassignedPatients: async () => {
    const response = await api.get('/patients/unassigned');
    return response.data;
  },

  /**
   * Get patients by status
   */
  getPatientsByStatus: async (status) => {
    const response = await api.get(`/patients/status/${status}`);
    return response.data;
  }
};
