import { api } from '../api';

export const alertService = {
  /**
   * Get active alerts
   */
  getActiveAlerts: async () => {
    const response = await api.get('/alerts/active');
    return response.data;
  },

  /**
   * Get alerts for a specific patient
   */
  getPatientAlerts: async (fhirPatientId) => {
    const response = await api.get(`/alerts/patient/${fhirPatientId}`);
    return response.data;
  },

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert: async (alertId) => {
    const response = await api.patch(`/alerts/${alertId}/acknowledge`);
    return response.data;
  }
};
