import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, setUnauthorizedHandler } from '../api/client';
import { ROLES } from './roles';

const AuthContext = createContext(null);
const STORAGE_KEY = 'neev.auth';

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadStored); // { token, name, role } | null

  useEffect(() => {
    setToken(session?.token ?? null);
  }, [session]);

  useEffect(() => {
    setUnauthorizedHandler(() => signOut());
  }, []);

  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  async function signIn(email, password) {
    const { token, name, role } = await api.login(email, password);
    const next = { token, name, role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }

  const value = {
    session,
    role: session ? ROLES[session.role] : null,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
