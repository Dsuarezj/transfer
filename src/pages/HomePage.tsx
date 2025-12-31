import { Box, Container, Heading, SimpleGrid, VStack, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useDropboxAuth } from '../hooks/useDropboxAuth';
import ActionCard from '../components/ActionCard';

export default function HomePage() {
  const navigate = useNavigate();
  const { logout } = useDropboxAuth();

  return (
    <Box
      h="100%"
      w="100%"
      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
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
        bg="radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)"
        pointerEvents="none"
      />

      <Box bg="purple.700" boxShadow="md" py={4} flexShrink={0} position="relative" zIndex={1}>
        <Container maxW="md" display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="md" color="white">
            Transferencias
          </Heading>
          <Button
            size="sm"
            variant="outline"
            color="white"
            borderColor="white"
            _hover={{ bg: 'whiteAlpha.200' }}
            onClick={logout}
          >
            Salir
          </Button>
        </Container>
      </Box>

      <Container maxW="md" flex="1" display="flex" alignItems="center" py={6} position="relative" zIndex={1}>
        <VStack spacing={6} w="full">
          <Heading size="lg" color="white" textAlign="center">
            ¿Qué deseas hacer?
          </Heading>

          <SimpleGrid columns={1} spacing={4} w="full">
            <ActionCard
              title="Subir Transferencia"
              description="Toma una foto del comprobante y registra los datos"
              icon="📸"
              onClick={() => navigate('/upload')}
            />

            <ActionCard
              title="Revisar Facturas"
              description="Consulta y busca las transferencias registradas"
              icon="📋"
              onClick={() => navigate('/review')}
            />
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}
