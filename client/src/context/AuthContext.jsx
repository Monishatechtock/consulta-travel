import { createContext, useContext, useMemo, useState } from 'react';
import {
  api,
  clearAuthSession,
  getStoredAdmin,
  isAuthenticated,
  setAuthSession,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() =>
    isAuthenticated() ? getStoredAdmin() : null
  );

  const login = async (username, password) => {
    const data = await api.login({ username, password });
    setAuthSession({ token: data.token, admin: data.admin });
    setAdmin(data.admin);
    return data.admin;
  };

  const logout = () => {
    clearAuthSession();
    setAdmin(null);
  };

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: Boolean(admin),
      login,
      logout,
    }),
    [admin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
