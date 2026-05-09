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
        // Clear session storage manually on logout to be safe
        sessionStorage.removeItem('sewa-auth-session');
      }
    }),
    {
      name: 'sewa-auth-session',
      storage: createJSONStorage(() => sessionStorage), // Fixes the "logout on refresh" issue
    }
  )
);

export const useVitalsStore = create(
  persist(
    (set) => ({
      vitals: {}, // Key: fhirPatientId, Value: Vitals DTO

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
        // Prevent duplicate alerts for the same patient within a short window if needed,
        // but here we just add the alert with a unique ID.
        const newAlert = {
          ...alertData,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false
        };

        // PERFORMANCE FIX: Keep only the most recent 50 alerts
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
      name: 'sewa-alerts-storage', // Defaults to localStorage
    }
  )
); 