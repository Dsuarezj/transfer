import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Box, Button, IconButton, HStack, VStack, Text, useDisclosure } from '@chakra-ui/react';
import { STORAGE_KEYS } from '../constants/storageKeys';
import InstallInstructionsModal from '../components/InstallInstructionsModal';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export enum PWAInstallState {
  INSTALLED = 'INSTALLED',
  AVAILABLE = 'AVAILABLE',
  DISMISSED = 'DISMISSED',
}

const checkInstallationStatus = (): boolean => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAppleInstalled = isApple && (window.navigator as any).standalone;
  const isInstalledInStorage = localStorage.getItem(STORAGE_KEYS.PWA_INSTALLED) === 'true';
  return isStandalone || isAppleInstalled || isInstalledInStorage;
};

const isAppleDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const isAppleDeviceNotInstalled = (): boolean => {
  return isAppleDevice() && !checkInstallationStatus();
};

interface PWAContextType {
  installState: PWAInstallState;
  canInstall: boolean;
  canShowAppleInstructions: boolean;
  isOnline: boolean;
  isServiceWorkerRegistered: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  installApp: () => Promise<boolean>;
  showInstallPrompt: () => void;
  hideInstallPrompt: () => void;
  dismissInstall: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [installState, setInstallState] = useState<PWAInstallState>(() => {
    if (checkInstallationStatus()) {
      localStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
      return PWAInstallState.INSTALLED;
    }
    const dismissed = localStorage.getItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED) === 'true';
    return dismissed ? PWAInstallState.DISMISSED : PWAInstallState.AVAILABLE;
  });

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const canInstall = installState === PWAInstallState.AVAILABLE && installPrompt !== null && !checkInstallationStatus();
  const canShowAppleInstructions = isAppleDeviceNotInstalled() && installState !== PWAInstallState.INSTALLED && !checkInstallationStatus();

  const markAsInstalled = useCallback(() => {
    setInstallState(PWAInstallState.INSTALLED);
    setInstallPrompt(null);
    localStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
    localStorage.removeItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED);
  }, []);

  const dismissInstall = useCallback(() => {
    setInstallState(PWAInstallState.DISMISSED);
    localStorage.setItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED, 'true');
  }, []);

  const showInstallPrompt = useCallback(() => {
    if (canInstall || canShowAppleInstructions) {
      setShouldShowPrompt(true);
    }
  }, [canInstall, canShowAppleInstructions]);

  const hideInstallPrompt = useCallback(() => {
    setShouldShowPrompt(false);
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (isIOS) {
      return false;
    }

    if (!installPrompt) {
      return false;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      setInstallPrompt(null);
      setShouldShowPrompt(false);

      if (outcome === 'accepted') {
        markAsInstalled();
        return true;
      } else {
        dismissInstall();
        return false;
      }
    } catch (error) {
      setInstallPrompt(null);
      setShouldShowPrompt(false);
      return false;
    }
  }, [installPrompt, isIOS, markAsInstalled, dismissInstall]);

  useEffect(() => {
    const isCurrentlyInstalled = checkInstallationStatus();
    if (isCurrentlyInstalled && installState !== PWAInstallState.INSTALLED) {
      setInstallState(PWAInstallState.INSTALLED);
      setInstallPrompt(null);
      setShouldShowPrompt(false);
      return;
    }

    if (installState === PWAInstallState.INSTALLED) {
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const platform = window.navigator.platform.toLowerCase();
    const isIPad = /ipad/.test(userAgent) || (platform === 'macintel' && navigator.maxTouchPoints > 1);
    const isIPhone = /iphone/.test(userAgent);
    const isIOSDevice = isIPad || isIPhone;
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIOSDevice && !checkInstallationStatus());
    setIsAndroid(isAndroidDevice && !checkInstallationStatus());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;

      setInstallPrompt(promptEvent);
      setInstallState(PWAInstallState.AVAILABLE);

      const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen');
      if (!hasSeenPrompt) {
        setShouldShowPrompt(true);
        localStorage.setItem('pwa-prompt-seen', 'true');
      }
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

    if (isIOSDevice && installState === PWAInstallState.AVAILABLE) {
      setInstallState(PWAInstallState.AVAILABLE);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [installState, markAsInstalled]);

  const handleBannerInstall = async () => {
    setShouldShowPrompt(false);

    if (isIOS || !canInstall) {
      dismissInstall();
      onOpen();
    } else {
      const installed = await installApp();
      if (!installed) {
        dismissInstall();
        onOpen();
      }
    }
  };

  const handleBannerDismiss = () => {
    setShouldShowPrompt(false);
    dismissInstall();
  };

  const value: PWAContextType = {
    installState,
    canInstall,
    canShowAppleInstructions,
    isOnline,
    isServiceWorkerRegistered,
    isIOS,
    isAndroid,
    installApp,
    showInstallPrompt,
    hideInstallPrompt,
    dismissInstall,
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
      {shouldShowPrompt && canInstall && (
        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="white"
          boxShadow="0 -4px 20px rgba(0, 0, 0, 0.1)"
          zIndex={1000}
          p={4}
          borderTopWidth="1px"
          borderTopColor="gray.200"
        >
          <HStack spacing={4} justify="space-between" align="center">
            <HStack spacing={3} flex="1">
              <Box
                w={10}
                h={10}
                borderRadius="lg"
                bg="accent.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xl"
              >
                📱
              </Box>
              <VStack align="start" spacing={0} flex="1">
                <Text fontWeight="semibold" fontSize="sm">
                  Instalar TransferidoYa
                </Text>
                <Text fontSize="xs" color="gray.600">
                  Acceso rápido desde tu pantalla de inicio
                </Text>
              </VStack>
            </HStack>
            <HStack spacing={2}>
              <Button size="sm" colorScheme="accent" onClick={handleBannerInstall}>
                Instalar
              </Button>
              <IconButton
                aria-label="Cerrar"
                icon={<span>✕</span>}
                size="sm"
                variant="ghost"
                onClick={handleBannerDismiss}
              />
            </HStack>
          </HStack>
        </Box>
      )}
      {shouldShowPrompt && canShowAppleInstructions && (
        <InstallInstructionsModal isOpen={true} onClose={hideInstallPrompt} isIOS={isIOS} />
      )}
      {isOpen && <InstallInstructionsModal isOpen={isOpen} onClose={onClose} isIOS={isIOS} />}
    </PWAContext.Provider>
  );
}

export function usePWAContext() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
}