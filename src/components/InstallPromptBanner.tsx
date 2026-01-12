import { useState, useEffect } from 'react';
import { Box, Button, IconButton, HStack, VStack, Text, useDisclosure } from '@chakra-ui/react';
import { usePWA } from '../hooks/usePWA';
import { PWAInstallState } from '../contexts/PWAContext';
import InstallInstructionsModal from './InstallInstructionsModal';

export default function InstallPromptBanner() {
  const { installState, canInstall, isIOS, install, dismissInstall } = usePWA();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (installState !== PWAInstallState.AVAILABLE || !canInstall) {
      setShowBanner(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [installState, canInstall]);

  if (!showBanner) {
    return null;
  }

  const handleInstall = async () => {
    setShowBanner(false);

    if (isIOS) {
      dismissInstall();
      onOpen();
    } else {
      const shouldShowModal = await install();
      if (shouldShowModal) {
        dismissInstall();
        onOpen();
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    dismissInstall();
  };

  return (
    <>
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
            <Button
              size="sm"
              colorScheme="accent"
              onClick={handleInstall}
            >
              Instalar
            </Button>
            <IconButton
              aria-label="Cerrar"
              icon={<span>✕</span>}
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
            />
          </HStack>
        </HStack>
      </Box>
      <InstallInstructionsModal isOpen={isOpen} onClose={onClose} isIOS={isIOS} />
    </>
  );
}

