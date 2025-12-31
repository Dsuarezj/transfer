import { authService } from '../services/dropbox/authService';

export function useDropboxAuth() {
  const isAuthenticated = authService.isAuthenticated();

  const login = async () => {
    const url = await authService.getAuthUrl();
    window.location.href = url;
  };

  const logout = () => {
    authService.logout();
  };

  return { isAuthenticated, login, logout };
}
