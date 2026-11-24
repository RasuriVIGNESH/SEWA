// SEWA style reminder: authentication should feel quiet and trustworthy; never flash protected clinical content before session state is known.

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { api, clearAuthSession, getAuthSession, saveAuthSession, type AuthSession, type DoctorPayload } from "@/lib/api";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<AuthSession>;
  signUp: (payload: DoctorPayload) => Promise<AuthSession>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());

  const value = useMemo<AuthContextValue>(() => ({
    session,
    isAuthenticated: Boolean(session?.token),
    isReady: true,
    signIn: async (email, password) => {
      const next = await api.login({ email, password });
      saveAuthSession({ ...next, email });
      setSession({ ...next, email });
      return { ...next, email };
    },
    signUp: async (payload) => {
      const next = await api.register(payload);
      saveAuthSession({ ...next, email: payload.email });
      setSession({ ...next, email: payload.email });
      return { ...next, email: payload.email };
    },
    signOut: () => {
      clearAuthSession();
      setSession(null);
    },
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
