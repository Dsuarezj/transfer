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
          <Button
            size="sm"
            variant="outline"
            color="neutral.50"
            borderColor="neutral.50"
            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            onClick={logout}
          >
            Salir
          </Button>
        </Container>
      </Box>

      <Container maxW="md" flex="1" display="flex" alignItems="center" py={6} position="relative" zIndex={1}>
        <VStack spacing={6} w="full">
          <Heading size="lg" color="neutral.50" textAlign="center">
            ¿Qué deseas hacer?
          </Heading>

          <SimpleGrid columns={1} spacing={4} w="full">
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
  );
}
