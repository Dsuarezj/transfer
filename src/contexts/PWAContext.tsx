import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export enum PWAInstallState {
  INSTALLED = 'INSTALLED',
  AVAILABLE = 'AVAILABLE',
  DISMISSED = 'DISMISSED',
}

interface PWAContextType {
  installState: PWAInstallState;
  canInstall: boolean;
  isOnline: boolean;
  isServiceWorkerRegistered: boolean;
  install: () => Promise<boolean>;
  isIOS: boolean;
  dismissInstall: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [installState, setInstallState] = useState<PWAInstallState>(PWAInstallState.AVAILABLE);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [hasInstallCapability, setHasInstallCapability] = useState(false);

  const markAsInstalled = () => {
    setInstallState(PWAInstallState.INSTALLED);
    setHasInstallCapability(false);
    setDeferredPrompt(null);
    localStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
    localStorage.removeItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED);
  };

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const platform = window.navigator.platform.toLowerCase();
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isIPad = /ipad/.test(userAgent) || (platform === 'macintel' && navigator.maxTouchPoints > 1);
    const isIPhone = /iphone/.test(userAgent);
    const isIOSDevice = isIPad || isIPhone;
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const hasServiceWorker = 'serviceWorker' in navigator;

    const installedFromDisplayMode = isStandalone || isIOSStandalone;
    const installedFromStorage = localStorage.getItem(STORAGE_KEYS.PWA_INSTALLED) === 'true';
    const installed = installedFromDisplayMode || installedFromStorage;

    if (installed) {
      if (!installedFromStorage && installedFromDisplayMode) {
        localStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
      }
      setInstallState(PWAInstallState.INSTALLED);
      localStorage.removeItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED);
    } else {
      const dismissed = localStorage.getItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED) === 'true';
      setInstallState(dismissed ? PWAInstallState.DISMISSED : PWAInstallState.AVAILABLE);
    }

    setIsIOS(isIOSDevice && !isIOSStandalone);
    setHasInstallCapability(!installed && (isIOSDevice || (isMobile && hasServiceWorker)));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      markAsInstalled();
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        setIsServiceWorkerRegistered(registrations.length > 0);
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setIsServiceWorkerRegistered(true);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const dismissInstall = () => {
    setInstallState(PWAInstallState.DISMISSED);
    localStorage.setItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED, 'true');
  };

  const install = async (): Promise<boolean> => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        markAsInstalled();
        return false;
      } else if (choiceResult.outcome === 'dismissed') {
        setDeferredPrompt(null);
        dismissInstall();
        return false;
      }
    }
    return true;
  };

  const value: PWAContextType = {
    installState,
    canInstall: hasInstallCapability && installState !== PWAInstallState.INSTALLED,
    isOnline,
    isServiceWorkerRegistered,
    install,
    isIOS,
    dismissInstall,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function usePWAContext() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
}

