import { createContext, useEffect, useState, type ReactNode } from "react";

import type { Session, User } from "../dtos/helpdesk";
import { api } from "../services/Api";

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  save: (session: Session) => void;
  remove: () => void;
};

const STORAGE_KEY = "helpdesk:session";

function readSession(): Session | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored) as Session;
    if (!session.token || !session.user?.id || !session.user?.role) return null;
    api.defaults.headers.common.Authorization = `Bearer ${session.token}`;
    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);
  const [isLoading, setIsLoading] = useState(Boolean(session));

  function save(data: Session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    setSession(data);
  }

  function remove() {
    localStorage.removeItem(STORAGE_KEY);
    delete api.defaults.headers.common.Authorization;
    setSession(null);
    setIsLoading(false);
  }

  useEffect(() => {
    if (!session) return;
    let mounted = true;

    api.get<User>("/me")
      .then(({ data: user }) => {
        if (mounted) save({ token: session.token, user });
      })
      .catch(() => {
        if (mounted) remove();
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => { mounted = false; };
    // Validate only the session loaded from storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, save, remove }}>
      {children}
    </AuthContext.Provider>
  );
}
