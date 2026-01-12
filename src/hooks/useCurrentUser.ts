import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';

export function useCurrentUser() {
  const [email, setEmail] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.DROPBOX_USER_EMAIL);
  });

  useEffect(() => {
    const updateEmail = () => {
      const storedEmail = localStorage.getItem(STORAGE_KEYS.DROPBOX_USER_EMAIL);
      setEmail(prevEmail => prevEmail !== storedEmail ? storedEmail : prevEmail);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.DROPBOX_USER_EMAIL) {
        updateEmail();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dropbox-auth-change', updateEmail);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dropbox-auth-change', updateEmail);
    };
  }, []);

  return { email };
}

