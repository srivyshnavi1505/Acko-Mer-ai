import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token is still valid by fetching user
      authAPI.getMe()
        .then((res) => {
          setUser(res.data.user);
        })
        .catch(() => {
          // Token invalid or expired - clear it
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('token', res.token);
    setUser(res.data.user);
    return res;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    localStorage.setItem('token', res.token);
    setUser(res.data.user);
    return res;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('token');
    setUser(null);
  };

  // Show nothing while checking auth status
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};