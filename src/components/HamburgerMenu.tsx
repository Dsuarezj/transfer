import { Box, IconButton, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, Button, Divider, VStack, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useDropboxAuth } from '../hooks/useDropboxAuth';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useActiveCompany } from '../hooks/useActiveCompany';
import { USER_ROLES } from '../constants/roles';
import { usePWA } from '../hooks/usePWA';
import { useCallback } from 'react';

export default function HamburgerMenu() {
  const navigate = useNavigate();
  const { logout } = useDropboxAuth();
  const { email } = useCurrentUser();
  const activeCompany = useActiveCompany();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { canInstall, canShowAppleInstructions, showInstallPrompt } = usePWA();
  const isAdmin = activeCompany?.role === USER_ROLES.ADMIN;

  const handleInstallAppClick = useCallback(() => {
    onClose();
    setTimeout(() => {
      showInstallPrompt();
    }, 150);
  }, [onClose, showInstallPrompt]);

  return (
    <>
      <IconButton
        aria-label="Abrir menú"
        icon={
          <Box>
            <Box w="20px" h="2px" bg="neutral.50" mb="4px" borderRadius="2px" />
            <Box w="20px" h="2px" bg="neutral.50" mb="4px" borderRadius="2px" />
            <Box w="20px" h="2px" bg="neutral.50" borderRadius="2px" />
          </Box>
        }
        variant="ghost"
        color="neutral.50"
        _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
        _active={{ bg: 'rgba(255, 255, 255, 0.15)' }}
        onClick={onOpen}
      />

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="semibold">Menú</Text>
              {email && (
                <Text fontSize="sm" color="gray.600" fontWeight="normal">
                  {email}
                </Text>
              )}
            </VStack>
          </DrawerHeader>
          <DrawerBody p={0}>
            <VStack spacing={0} align="stretch">
              {(canInstall || canShowAppleInstructions) && (
                <>
                  <Box px={6} py={4}>
                    <Button
                      variant="solid"
                      size="md"
                      w="full"
                      leftIcon={<span>📱</span>}
                      onClick={handleInstallAppClick}
                    >
                      Instalar aplicación
                    </Button>
                  </Box>
                  <Divider />
                </>
              )}
              {isAdmin && (
                <>
                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    h="60px"
                    px={6}
                    borderRadius={0}
                    onClick={() => {
                      onClose();
                      navigate('/company/members');
                    }}
                    _hover={{ bg: 'neutral.50' }}
                  >
                    Añadir empleado
                  </Button>
                  <Divider />
                </>
              )}
              <Button
                variant="ghost"
                justifyContent="flex-start"
                h="60px"
                px={6}
                borderRadius={0}
                onClick={() => {
                  onClose();
                  navigate('/select-company');
                }}
                _hover={{ bg: 'neutral.50' }}
              >
                Cambiar empresa
              </Button>
              <Divider />
              <Button
                variant="ghost"
                justifyContent="flex-start"
                h="60px"
                px={6}
                borderRadius={0}
                onClick={() => {
                  onClose();
                  navigate('/privacy');
                }}
                _hover={{ bg: 'neutral.50' }}
              >
                Políticas de privacidad
              </Button>
              <Divider />
              <Button
                variant="ghost"
                justifyContent="flex-start"
                h="60px"
                px={6}
                borderRadius={0}
                onClick={() => {
                  onClose();
                  navigate('/contact');
                }}
                _hover={{ bg: 'neutral.50' }}
              >
                Contacto
              </Button>
              <Divider />
              <Button
                variant="ghost"
                justifyContent="flex-start"
                h="60px"
                px={6}
                borderRadius={0}
                colorScheme="red"
                onClick={() => {
                  onClose();
                  logout();
                }}
                _hover={{ bg: 'danger.50' }}
              >
                Salir
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

