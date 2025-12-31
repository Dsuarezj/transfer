import { useState, useEffect } from 'react';
import { dropboxService } from '../services/dropbox.service';

export function useDropboxAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (window.location.search.includes('code=')) {
        const success = await dropboxService.handleRedirect();
        setIsAuthenticated(success);
      } else {
        setIsAuthenticated(dropboxService.isAuthenticated());
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async () => {
    const url = await dropboxService.getAuthUrl();
    window.location.href = url;
  };

  const logout = () => {
    dropboxService.logout();
    setIsAuthenticated(false);
  };

  return { isAuthenticated, isLoading, login, logout };
}
