import { Box, Button, Container, Heading, Text, VStack, HStack, Flex } from '@chakra-ui/react';
import { authService } from '../services/dropbox/authService';

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 10H16.74C16.38 7.71 14.4 6 12 6C9.6 6 7.62 7.71 7.26 10H6C3.79 10 2 11.79 2 14C2 16.21 3.79 18 6 18H18C20.21 18 22 16.21 22 14C22 11.79 20.21 10 18 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function LoginPage() {
  const login = async () => {
    const url = await authService.getAuthUrl();
    window.location.href = url;
  };

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
              <VStack spacing={4} w="full">
                <Flex gap={4} w="full" flexWrap="wrap" justify="center">
                  <HStack spacing={2} flex="1" minW="140px" justify="center">
                    <Box color="purple.500">
                      <LockIcon />
                    </Box>
                    <Text fontSize="sm" color="neutral.700" fontWeight="medium">
                      Privado
                    </Text>
                  </HStack>

                  <HStack spacing={2} flex="1" minW="140px" justify="center">
                    <Box color="purple.500">
                      <ShieldIcon />
                    </Box>
                    <Text fontSize="sm" color="neutral.700" fontWeight="medium">
                      Seguro
                    </Text>
                  </HStack>

                  <HStack spacing={2} flex="1" minW="140px" justify="center">
                    <Box color="purple.500">
                      <CloudIcon />
                    </Box>
                    <Text fontSize="sm" color="neutral.700" fontWeight="medium">
                      Tu nube
                    </Text>
                  </HStack>
                </Flex>
              </VStack>

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
