import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  isInstalled: boolean;
  canInstall: boolean;
  isOnline: boolean;
  isServiceWorkerRegistered: boolean;
  install: () => Promise<void>;
  deferredPrompt: BeforeInstallPromptEvent | null;
  isIOS: boolean;
  isInstallDismissed: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [hasInstallCapability, setHasInstallCapability] = useState(false);
  const [isInstallDismissed, setIsInstallDismissed] = useState(false);

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

    const installed = isStandalone || isIOSStandalone;
    setIsInstalled(installed);

    if (installed) {
      localStorage.removeItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED);
      setIsInstallDismissed(false);
    } else {
      const dismissed = localStorage.getItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED) === 'true';
      setIsInstallDismissed(dismissed);
    }

    setIsIOS(isIOSDevice && !isIOSStandalone);
    setHasInstallCapability(!installed && (isIOSDevice || (isMobile && hasServiceWorker)));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setHasInstallCapability(false);
      setDeferredPrompt(null);
      localStorage.removeItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED);
      setIsInstallDismissed(false);
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

  const install = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        localStorage.removeItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED);
        setIsInstallDismissed(false);
      } else if (choiceResult.outcome === 'dismissed') {
        setDeferredPrompt(null);
        localStorage.setItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED, 'true');
        setIsInstallDismissed(true);
      }
    }
  };

  const value: PWAContextType = {
    isInstalled,
    canInstall: hasInstallCapability && !isInstalled,
    isOnline,
    isServiceWorkerRegistered,
    install,
    deferredPrompt,
    isIOS,
    isInstallDismissed,
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

