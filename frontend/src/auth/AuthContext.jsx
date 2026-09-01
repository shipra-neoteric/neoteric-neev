import { createContext, useContext, useState } from 'react';
import { setCurrentRole } from '../api/client';
import { ROLES } from './roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [roleKey, setRoleKey] = useState(null);

  const value = {
    roleKey,
    role: roleKey ? ROLES[roleKey] : null,
    signIn: (key) => { setCurrentRole(key); setRoleKey(key); },
    signOut: () => { setCurrentRole(null); setRoleKey(null); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
