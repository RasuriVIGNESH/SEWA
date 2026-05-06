import apiClient from './apiClient';

export const patientsApi = {
    /** All patients */
    async getPatients() {
        const { data } = await apiClient.get('/api/patients');
        return data;
    },

    /** Patients assigned to a specific doctor */
    async getDoctorPatients(doctorId) {
        const { data } = await apiClient.get(`/api/doctors/${doctorId}/patients`);
        return data;
    },

    /** Unassigned patients (no doctor) */
    async getUnassigned() {
        const { data } = await apiClient.get('/api/patients/unassigned');
        return data;
    },

    /** Filter patients by status: STABLE | CRITICAL | UNDER_OBSERVATION | DISCHARGED */
    async getByStatus(status) {
        const { data } = await apiClient.get(`/api/patients/status/${status}`);
        return data;
    },

    /** Single patient by ID */
    async getPatient(patientId) {
        const { data } = await apiClient.get(`/api/patients/${patientId}`);
        return data;
    },

    /**
     * Admit / create a new patient.
     * Fields: name, phoneNumber, bedNumber, fhirPatientId, status,
     *         gender, bloodGroup, admissionDate (yyyy-MM-dd),
     *         address, admissionReason, medicalHistory
     */
    async admitPatient(patientData) {
        const { data } = await apiClient.post('/api/patients/new', patientData);
        return data;
    },

    /**
     * Partial update (PATCH). Send only fields to change.
     */
    async updatePatient(patientId, updates) {
        const { data } = await apiClient.patch(`/api/patients/${patientId}`, updates);
        return data;
    },

    /**
     * Assign patient to a doctor.
     * Body: { patientId, doctorId }
     */
    async assignPatient(patientId, doctorId) {
        await apiClient.post('/api/patients/assign', { patientId, doctorId });
    },

    /** Discharge a patient (status → DISCHARGED) */
    async dischargePatient(patientId) {
        await apiClient.post(`/api/patients/${patientId}/discharge`);
    },

    /** Delete patient record */
    async deletePatient(patientId) {
        await apiClient.delete(`/api/patients/${patientId}`);
    },
};
