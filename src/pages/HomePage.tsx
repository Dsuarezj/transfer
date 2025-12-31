import { Box, Container, Heading, SimpleGrid, VStack, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useDropboxAuth } from '../hooks/useDropboxAuth';
import ActionCard from '../components/ActionCard';

export default function HomePage() {
  const navigate = useNavigate();
  const { logout } = useDropboxAuth();

  return (
    <Box minH="100vh" bg="neutral.50" pb={8}>
      <Box bg="white" boxShadow="sm" py={4} mb={6}>
        <Container maxW="md" display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="md" color="primary.600">
            Transferencias
          </Heading>
          <Button
            size="sm"
            variant="outline"
            onClick={logout}
          >
            Salir
          </Button>
        </Container>
      </Box>

      <Container maxW="md">
        <VStack spacing={6}>
          <Heading size="lg" color="neutral.700" textAlign="center">
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
