import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem('reciprocity_token');
      const savedUser = localStorage.getItem('reciprocity_user');
      if (token && savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id && parsed.role) {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem('reciprocity_token');
      localStorage.removeItem('reciprocity_user');
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: u, token } = res.data;
    if (!u || !token) throw new Error('Invalid login response');
    localStorage.setItem('reciprocity_token', token);
    localStorage.setItem('reciprocity_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (data) => {
    const res = await api.post('/auth/signup', data);
    const { user: u, token } = res.data;
    if (!u || !token) throw new Error('Invalid signup response');
    localStorage.setItem('reciprocity_token', token);
    localStorage.setItem('reciprocity_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('reciprocity_token');
    localStorage.removeItem('reciprocity_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('reciprocity_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
