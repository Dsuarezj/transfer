import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { useDropboxAuth } from '../hooks/useDropboxAuth';

export default function LoginPage() {
  const { login } = useDropboxAuth();

  return (
    <Box minH="100vh" bg="neutral.50" display="flex" alignItems="center">
      <Container maxW="md">
        <VStack spacing={8} align="stretch">
          <VStack spacing={3}>
            <Heading
              as="h1"
              size="2xl"
              color="primary.600"
              textAlign="center"
            >
              Transferencias
            </Heading>
            <Heading
              as="h2"
              size="lg"
              color="neutral.600"
              fontWeight="medium"
              textAlign="center"
            >
              Sistema Contable
            </Heading>
          </VStack>

          <Box
            bg="white"
            p={8}
            borderRadius="24px"
            boxShadow="card"
          >
            <VStack spacing={6}>
              <Text color="neutral.600" textAlign="center" fontSize="md">
                Conecta tu cuenta de Dropbox para comenzar a registrar transferencias
                de forma segura y descentralizada.
              </Text>

              <Button
                size="lg"
                w="full"
                onClick={login}
              >
                Conectar con Dropbox
              </Button>

              <Text fontSize="sm" color="neutral.500" textAlign="center">
                Tus datos se guardarán únicamente en tu Dropbox personal
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
