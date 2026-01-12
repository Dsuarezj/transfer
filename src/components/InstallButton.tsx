import { Button, useDisclosure } from '@chakra-ui/react';
import { usePWA } from '../hooks/usePWA';
import { PWAInstallState } from '../contexts/PWAContext';
import InstallInstructionsModal from './InstallInstructionsModal';

interface InstallButtonProps {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function InstallButton({ variant = 'solid', size = 'md', fullWidth = false }: InstallButtonProps) {
  const { installState, canInstall, isIOS, install } = usePWA();
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (installState === PWAInstallState.INSTALLED || !canInstall) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      onOpen();
    } else {
      const shouldShowModal = await install();
      if (shouldShowModal) {
        onOpen();
      }
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        w={fullWidth ? 'full' : 'auto'}
        leftIcon={<span>📱</span>}
      >
        Instalar aplicación
      </Button>
      <InstallInstructionsModal isOpen={isOpen} onClose={onClose} isIOS={isIOS} />
    </>
  );
}

