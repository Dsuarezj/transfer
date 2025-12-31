import { useState, useEffect } from 'react';
import { authService } from '../services/dropbox/authService';

export function useDropboxAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };

    checkAuth();

    window.addEventListener('storage', checkAuth);
    window.addEventListener('dropbox-auth-change', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('dropbox-auth-change', checkAuth);
    };
  }, []);

  const login = async () => {
    const url = await authService.getAuthUrl();
    window.location.href = url;
  };

  const logout = () => {
    authService.logout();
  };

  return { isAuthenticated, login, logout };
}
