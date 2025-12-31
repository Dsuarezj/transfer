import { Box, Button, Container, Heading, Text, VStack, SimpleGrid } from '@chakra-ui/react';
import { authService } from '../services/dropbox/authService';

export default function LoginPage() {
  const login = async () => {
    const url = await authService.getAuthUrl();
    window.location.href = url;
  };

  const features = [
    { emoji: '🔐', title: 'Privado', desc: 'Solo tú tienes acceso' },
    { emoji: '🛡️', title: 'Seguro', desc: 'Protegido por Dropbox' },
    { emoji: '☁️', title: 'Tu nube', desc: 'En tu espacio personal' }
  ];

  return (
    <Box
      h="100%"
      w="100%"
      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
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

      <Container maxW="md" px={6} position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          <VStack spacing={4}>
            <Box
              bg="white"
              borderRadius="24px"
              p={4}
              boxShadow="0 10px 40px rgba(0,0,0,0.2)"
            >
              <Text fontSize="6xl" fontWeight="bold" color="purple.600">
                📤
              </Text>
            </Box>

            <Heading
              as="h1"
              size="2xl"
              color="white"
              textAlign="center"
              fontWeight="bold"
            >
              Transferido
            </Heading>

            <Text
              color="whiteAlpha.900"
              textAlign="center"
              fontSize="lg"
              fontWeight="medium"
            >
              Registra transferencias con privacidad total
            </Text>
          </VStack>

          <Box
            bg="white"
            p={8}
            borderRadius="24px"
            boxShadow="0 20px 60px rgba(0,0,0,0.3)"
          >
            <VStack spacing={6}>
              <SimpleGrid columns={3} spacing={3} w="full">
                {features.map((feature) => (
                  <VStack
                    key={feature.title}
                    spacing={2}
                    bg="purple.50"
                    p={4}
                    borderRadius="16px"
                    transition="all 0.2s"
                    _hover={{ transform: 'translateY(-2px)', bg: 'purple.100' }}
                  >
                    <Text fontSize="2xl">{feature.emoji}</Text>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="purple.700"
                      textAlign="center"
                    >
                      {feature.title}
                    </Text>
                    <Text
                      fontSize="xs"
                      color="neutral.600"
                      textAlign="center"
                      lineHeight="short"
                    >
                      {feature.desc}
                    </Text>
                  </VStack>
                ))}
              </SimpleGrid>

              <Box w="full" h="1px" bg="neutral.200" />

              <Text color="neutral.600" textAlign="center" fontSize="md" lineHeight="tall">
                Tus datos se guardan únicamente en <strong>tu Dropbox personal</strong>.
                Tú tienes el control total.
              </Text>

              <Button
                size="lg"
                w="full"
                onClick={login}
                bg="purple.600"
                color="white"
                _hover={{ bg: 'purple.700' }}
                _active={{ bg: 'purple.800' }}
                h="56px"
                fontSize="lg"
                fontWeight="semibold"
                boxShadow="0 4px 14px rgba(103, 58, 183, 0.4)"
              >
                Conectar con Dropbox
              </Button>

              <Text fontSize="xs" color="neutral.500" textAlign="center" lineHeight="tall">
                Al conectar, solo autorizas el acceso a una carpeta privada en tu cuenta.
                Nadie más puede ver tus datos.
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
