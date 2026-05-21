'use client';

import { useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, login, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.getMe()
        .then((userData) => {
          setUser(userData as { id: string; email: string; display_name: string; avatar_url: string | null });
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [setUser, setLoading, logout]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    login(data.user as { id: string; email: string; display_name: string }, data.access_token, data.refresh_token);
    return data;
  }, [login]);

  const handleSignup = useCallback(async (email: string, password: string, displayName: string) => {
    const data = await api.signup(email, password, displayName);
    login(data.user as { id: string; email: string; display_name: string }, data.access_token, data.refresh_token);
    return data;
  }, [login]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    signup: handleSignup,
    logout,
  };
}
