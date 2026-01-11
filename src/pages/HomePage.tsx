import { useEffect } from 'react';
import { Box, Container, Heading, SimpleGrid, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { companyService } from '../services/company/companyService';
import { roleService } from '../services/roles/roleService';
import ActionCard from '../components/ActionCard';
import HamburgerMenu from '../components/HamburgerMenu';

export default function HomePage() {
  const navigate = useNavigate();
  const activeCompany = companyService.getActiveCompany();

  useEffect(() => {
    const checkCompany = async () => {
      try {
        const result = await companyService.ensureActiveCompany(roleService.getUserRole);
        
        if (result.action === 'redirect') {
          navigate('/create-company', { replace: true });
        }
      } catch (error) {
        navigate('/create-company', { replace: true });
      }
    };

    checkCompany();
  }, [navigate]);

  return (
    <Box
      minH="100vh"
      w="100%"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bgGradient="linear(135deg, accent.500, primary.500)"
        zIndex={0}
      />
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgGradient="radial(circle at 20% 50%, rgba(255, 255, 255, 0.1), transparent)"
        pointerEvents="none"
        zIndex={0}
      />

      <Box
        position="relative"
        zIndex={1}
        minH="100vh"
        display="flex"
        flexDirection="column"
      >
        <Box bg="primary.700" boxShadow="md" py={4} flexShrink={0}>
          <Container maxW="md" display="flex" justifyContent="space-between" alignItems="center">
            <Heading size="md" color="neutral.50" noOfLines={1} title={activeCompany?.name || 'Transferencias'}>
              {activeCompany?.name || 'Transferencias'}
            </Heading>
            <HamburgerMenu />
          </Container>
        </Box>

        <Box flex="1" display="flex" alignItems="center">
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
    </Box>
  );
}

