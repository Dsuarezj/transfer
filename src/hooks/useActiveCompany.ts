import { useState, useEffect } from 'react';
import { companyService } from '../services/company/companyService';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { Company } from '../types/company';

export function useActiveCompany() {
  const [activeCompany, setActiveCompany] = useState<Company | null>(() => companyService.getActiveCompany());

  useEffect(() => {
    const updateActiveCompany = () => {
      const newCompany = companyService.getActiveCompany();
      setActiveCompany(prevCompany => {
        if (prevCompany?.id === newCompany?.id) {
          return prevCompany;
        }
        return newCompany;
      });
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ACTIVE_COMPANY || e.key === STORAGE_KEYS.COMPANIES_CACHE) {
        updateActiveCompany();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('company-change', updateActiveCompany);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('company-change', updateActiveCompany);
    };
  }, []);

  return activeCompany;
}

