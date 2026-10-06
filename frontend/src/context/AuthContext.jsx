/**
 * AuthContext — single source of truth for the authenticated user.
 *
 * - Persists the JWT token in localStorage.
 * - Attaches the token to every axios request via api.js interceptor.
 * - Exposes: user, token, isAuthenticated, isAdmin, login(), register(), logout(), loading
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthCtx = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

const TOKEN_KEY = 'volthaus.token';
const USER_KEY = 'volthaus.user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Validate token on mount — fetch fresh user profile from backend
  useEffect(() => {
    if (!token) return;
    api.getMe()
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      })
      .catch(() => {
        // Token invalid / expired — clear everything
        logout();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login({ email, password });
      persist(data.token, data.user);
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err?.response?.data?.error || 'Login failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (full_name, email, password, phone) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.register({ full_name, email, password, phone });
      persist(data.token, data.user);
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err?.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'ADMIN',
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
