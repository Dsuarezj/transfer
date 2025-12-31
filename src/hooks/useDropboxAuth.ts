import { useState, useEffect } from 'react';
import { authService } from '../services/dropbox/authService';

export function useDropboxAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (window.location.search.includes('code=')) {
        const success = await authService.handleRedirect();
        setIsAuthenticated(success);
      } else {
        setIsAuthenticated(authService.isAuthenticated());
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async () => {
    const url = await authService.getAuthUrl();
    window.location.href = url;
  };

  const logout = () => {
    authService.logout();
  };

  return { isAuthenticated, isLoading, login, logout };
}
