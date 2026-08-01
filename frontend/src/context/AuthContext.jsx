import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('clinic_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('clinic_token') || null);
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post('/login', { username, password });
      if (res.data.success) {
        const { token: userToken, user: userData } = res.data.data;
        setToken(userToken);
        setUser(userData);
        localStorage.setItem('clinic_token', userToken);
        localStorage.setItem('clinic_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      let errorMsg = 'Login gagal. Periksa username dan password Anda.';
      if (err.response) {
        errorMsg = err.response.data?.message || errorMsg;
      } else if (err.request) {
        errorMsg = 'Gagal terhubung ke server backend. Pastikan server backend (npm run dev pada folder backend) sudah dinyalakan.';
      }
      const errors = err.response?.data?.errors || {};
      return { success: false, message: errorMsg, errors };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      console.warn('Logout endpoint call error', e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('clinic_token');
      localStorage.removeItem('clinic_user');
    }
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
