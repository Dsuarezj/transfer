import { Button, useDisclosure } from '@chakra-ui/react';
import { usePWA } from '../hooks/usePWA';
import InstallInstructionsModal from './InstallInstructionsModal';

interface InstallButtonProps {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function InstallButton({ variant = 'solid', size = 'md', fullWidth = false }: InstallButtonProps) {
  const { isInstalled, canInstall, isIOS, install, deferredPrompt } = usePWA();
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (isInstalled) {
    return null;
  }

  if (!canInstall) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      onOpen();
    } else if (deferredPrompt) {
      await install();
    } else {
      onOpen();
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

