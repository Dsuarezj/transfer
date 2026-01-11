import { useState, useEffect } from 'react';
import { companyService } from '../services/company/companyService';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { Company } from '../types/company';

export function useActiveCompany() {
  const [activeCompany, setActiveCompany] = useState<Company | null>(() => companyService.getActiveCompany());

  useEffect(() => {
    const updateActiveCompany = () => {
      setActiveCompany(companyService.getActiveCompany());
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ACTIVE_COMPANY || e.key === STORAGE_KEYS.COMPANIES_CACHE) {
        updateActiveCompany();
      }
    };

    const handleCompanyChange = () => {
      updateActiveCompany();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('company-change', handleCompanyChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('company-change', handleCompanyChange);
    };
  }, []);

  return activeCompany;
}

