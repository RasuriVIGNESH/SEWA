import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * AUTH STORE
 * Uses sessionStorage: Survives page refresh (F5), but logs out when tab is closed.
 * This is the secure middle-ground for medical applications.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      doctorId: null,
      doctorName: null,
      isAuthenticated: false,

      login: (token, doctorName, doctorId) => set({
        token,
        doctorName,
        doctorId,
        isAuthenticated: true
      }),

      logout: () => {
        set({
          token: null,
          doctorName: null,
          doctorId: null,
          isAuthenticated: false
        });
        sessionStorage.removeItem('sewa-auth-session');
      }
    }),
    {
      name: 'sewa-auth-session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

/**
 * VITALS STORE
 * Caches the latest vital readings for each patient
 */
export const useVitalsStore = create(
  persist(
    (set) => ({
      vitals: {},

      updateVitals: (fhirId, data) => set((state) => ({
        vitals: {
          ...state.vitals,
          [fhirId]: data
        }
      })),

      clearVitals: () => set({ vitals: {} })
    }),
    {
      name: 'sewa-vitals-cache',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

/**
 * ALERT STORE
 * Uses localStorage: Persists alerts even if the browser is closed.
 * Includes a performance cap of 50 alerts.
 */
export const useAlertStore = create(
  persist(
    (set) => ({
      unreadCount: 0,
      alerts: [],

      addAlert: (alertData) => set((state) => {
        const newAlert = {
          ...alertData,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false
        };

        const updatedAlerts = [newAlert, ...state.alerts].slice(0, 50);

        return {
          alerts: updatedAlerts,
          unreadCount: state.unreadCount + 1
        };
      }),

      markRead: (alertId) => set((state) => {
        const alert = state.alerts.find(a => a.id === alertId);
        const wasUnread = alert && !alert.read;
        return {
          alerts: state.alerts.map(a => a.id === alertId ? { ...a, read: true } : a),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        };
      }),

      markAllRead: () => set((state) => ({
        alerts: state.alerts.map(a => ({ ...a, read: true })),
        unreadCount: 0
      }))
    }),
    {
      name: 'sewa-alerts-storage',
    }
  )
);

/**
 * VITALS HISTORY STORE (Enhanced v2)
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