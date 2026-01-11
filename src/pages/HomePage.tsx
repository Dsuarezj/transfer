import { useEffect } from 'react';
import { Box, Container, Heading, SimpleGrid, VStack, IconButton, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, Button, Divider } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useDropboxAuth } from '../hooks/useDropboxAuth';
import { companyService } from '../services/company/companyService';
import ActionCard from '../components/ActionCard';

export default function HomePage() {
  const navigate = useNavigate();
  const { logout } = useDropboxAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const checkCompany = async () => {
      try {
        const activeCompany = companyService.getActiveCompany();
        
        if (!activeCompany) {
          const companies = await companyService.detectCompanies();
          
          if (companies.length === 0) {
            navigate('/create-company', { replace: true });
            return;
          }
          
          if (companies.length === 1) {
            companyService.setActiveCompany(companies[0].id);
          } else {
            companyService.setActiveCompany(companies[0].id);
          }
        } else {
          const companies = await companyService.detectCompanies();
          const companyStillExists = companies.find(c => c.id === activeCompany.id);
          
          if (!companyStillExists) {
            if (companies.length === 0) {
              navigate('/create-company', { replace: true });
              return;
            }
            companyService.setActiveCompany(companies[0].id);
          }
        }
      } catch (error) {
        navigate('/create-company', { replace: true });
      }
    };

    checkCompany();
  }, [navigate]);

  return (
    <Box
      h="100%"
      w="100%"
      bgGradient="linear(135deg, accent.500, primary.500)"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      position="relative"
    >
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgGradient="radial(circle at 20% 50%, rgba(255, 255, 255, 0.1), transparent)"
        pointerEvents="none"
      />

      <Box bg="primary.700" boxShadow="md" py={4} flexShrink={0} position="relative" zIndex={1}>
        <Container maxW="md" display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="md" color="neutral.50">
            Transferencias
          </Heading>
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
        </Container>
      </Box>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menú</DrawerHeader>
          <DrawerBody p={0}>
            <VStack spacing={0} align="stretch">
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

      <Box flex="1" overflow="auto" position="relative" zIndex={1} display="flex" alignItems="center">
        <Container maxW="md" w="full" py={{ base: 4, md: 8 }}>
          <VStack
            spacing={{ base: 6, md: 8 }}
            w="full"
            align="stretch"
          >
            <Heading size="md" color="neutral.50" textAlign="center">
              ¿Qué deseas hacer?
            </Heading>

            <SimpleGrid columns={1} spacing={3} w="full">
              <ActionCard
                title="Tomar Foto"
                description="Captura una foto del comprobante de transferencia y registra los datos de la operación"
                icon="📸"
                onClick={() => navigate('/upload')}
              />

              <ActionCard
                title="Subir Archivo"
                description="Sube una imagen del comprobante de transferencia desde tu dispositivo"
                icon="📁"
                onClick={() => navigate('/upload-file')}
              />

              <ActionCard
                title="Revisar transferencias"
                description="Consulta y busca las transferencias que ya has registrado anteriormente"
                icon="📋"
                onClick={() => navigate('/review')}
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}

