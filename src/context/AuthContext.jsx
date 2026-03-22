import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newHotCount, setNewHotCount] = useState(0);

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching current user
          // /auth/me returns { user: {...} } — extract the user object
          const response = await auth.getCurrentUser();
          setUser(response.data.user);
        } catch (error) {
          // Token invalid — clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await auth.login(email, password);
      // Backend returns { user: {...}, access_token: "...", refresh_token: "..." }
      const { access_token, refresh_token, user: userData } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Rotate login timestamps so Dashboard can compute "new since last login"
      const prevLogin = localStorage.getItem('this_login_at');
      if (prevLogin) localStorage.setItem('prev_login_at', prevLogin);
      localStorage.setItem('this_login_at', new Date().toISOString());

      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      // Pass refresh token so the server can blocklist it too
      await auth.logout(refreshToken);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // Backend requires first_name and last_name — not just email/password
  const register = async (email, password, firstName, lastName) => {
    try {
      const response = await auth.register(email, password, firstName, lastName);
      const { access_token, refresh_token, user: userData } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed. Please try again.',
      };
    }
  };

  // Called after accept-invite — store tokens and set user without a separate API call
  const loginWithTokens = (userData, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    loginWithTokens,
    newHotCount,
    setNewHotCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
