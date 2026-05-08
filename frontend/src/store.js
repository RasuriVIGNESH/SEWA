import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // Import this to save data on refresh

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
        // Optional: Clear storage on logout
        localStorage.removeItem('sewa-auth-storage');
      }
    }),
    {
      name: 'sewa-auth-storage', // The key in localStorage
    }
  )
);

export const useAlertStore = create(
  persist(
    (set) => ({
      unreadCount: 0,
      alerts: [],

      addAlert: (alertData) => set((state) => {
        const newAlert = {
          ...alertData,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          read: false
        };
        return {
          alerts: [newAlert, ...state.alerts],
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
      name: 'sewa-alerts-storage', // Keep alerts even if page refreshes
    }
  )
);