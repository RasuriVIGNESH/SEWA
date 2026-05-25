import { create } from 'zustand';

/**
 * Vitals History Store (v2 - Enhanced for Chart Support)
 * Maintains a rolling history of complete vital readings for each patient
 * Used to render both sparkline graphs and comprehensive 2D charts
 * 
 * Structure: { [fhirPatientId]: [...readings] }
 * Where each reading is: { timestamp, heartRate, spo2, respiratoryRate, map, lactate, temperature, ... }
 */
export const useVitalsHistoryStore = create((set, get) => ({
  vitalsHistory: {},

  /**
   * Add a new vital reading to the history
   * Keeps only the last 100 readings for performance
   */
  addVitalReading: (fhirId, vitals) =>
    set((state) => {
      const MAX_READINGS = 100; // Keep last 100 readings (~8 minutes at 1 reading/5s)

      const current = state.vitalsHistory[fhirId] || [];

      // Create a complete reading object with all vital data
      const newReading = {
        timestamp: vitals.timestamp || new Date().toISOString(),
        heart_rate: vitals.heartRate,
        heartRate: vitals.heartRate,
        spo2: vitals.spo2,
        respiratory_rate: vitals.respiratoryRate,
        respiratoryRate: vitals.respiratoryRate,
        map: vitals.meanArterialPressure,
        meanArterialPressure: vitals.meanArterialPressure,
        lactate: vitals.lactate,
        temperature: vitals.temperature,
        systolicBP: vitals.systolicBP,
        diastolicBP: vitals.diastolicBP,
        sepsisLabel: vitals.sepsisLabel
      };

      const updated = [...current, newReading].slice(-MAX_READINGS);

      return {
        vitalsHistory: {
          ...state.vitalsHistory,
          [fhirId]: updated
        }
      };
    }),

  /**
   * Get historical readings for a specific patient
   * Returns array of complete vital objects for chart rendering
   */
  getReadings: (fhirId) => {
    const store = get();
    return store.vitalsHistory[fhirId] || [];
  },

  /**
   * Get readings for a specific vital metric
   * Extracts just the values for a particular metric
   */
  getMetricReadings: (fhirId, metricKey) => {
    const store = get();
    const readings = store.vitalsHistory[fhirId] || [];
    return readings.map(r => ({
      timestamp: r.timestamp,
      [metricKey]: r[metricKey]
    }));
  },

  /**
   * Clear history for a patient (e.g., on discharge)
   */
  clearHistory: (fhirId) =>
    set((state) => {
      const updated = { ...state.vitalsHistory };
      delete updated[fhirId];
      return { vitalsHistory: updated };
    }),

  /**
   * Clear all history
   */
  clearAllHistory: () => set({ vitalsHistory: {} })
}));