import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';

export function useCurrentUser() {
  const [email, setEmail] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.DROPBOX_USER_EMAIL);
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const storedEmail = localStorage.getItem(STORAGE_KEYS.DROPBOX_USER_EMAIL);
      setEmail(storedEmail);
    };

    const handleAuthChange = () => {
      const storedEmail = localStorage.getItem(STORAGE_KEYS.DROPBOX_USER_EMAIL);
      setEmail(storedEmail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dropbox-auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dropbox-auth-change', handleAuthChange);
    };
  }, []);

  return { email };
}

