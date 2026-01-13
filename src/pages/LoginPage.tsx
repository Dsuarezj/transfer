import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Image,
} from '@chakra-ui/react';
import { authService } from '../services/dropbox/authService';
import { APP_VERSION } from '../constants/version';

export default function LoginPage() {
  const login = async () => {
    const url = await authService.getAuthUrl();
    window.location.href = url;
  };

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
        top="-120px"
        left="-80px"
        w="260px"
        h="260px"
        bg="whiteAlpha.200"
        rounded="full"
        filter="blur(80px)"
        zIndex={0}
      />
      <Box
        position="fixed"
        bottom="-140px"
        right="-100px"
        w="300px"
        h="300px"
        bg="blackAlpha.300"
        rounded="full"
        filter="blur(90px)"
        zIndex={0}
      />

      <Box
        position="relative"
        zIndex={1}
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        py={{ base: 4, md: 6 }}
        px={{ base: 4, sm: 6 }}
      >
        <Container maxW={{ base: 'md', md: 'lg' }}>
        <VStack spacing={{ base: 8, md: 12 }} align="stretch">
          {/* Header */}
          <VStack spacing={{ base: 3, md: 5 }}>
            <Box
              bg="white"
              borderRadius={{ base: '16px', md: '20px' }}
              p={{ base: 3, md: 4 }}
              boxShadow="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Image
                src={`/login.png?v=${APP_VERSION}`}
                alt="Transferido Ya"
                maxW={{ base: '120px', md: '150px' }}
                h="auto"
                objectFit="contain"
                loading="eager"
                decoding="async"
              />
            </Box>

            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '3xl' }}
              color="white"
              textAlign="center"
              fontWeight="bold"
            >
              Transferido Ya!
            </Heading>

            <Text
              color="whiteAlpha.900"
              textAlign="center"
              fontSize={{ base: 'md', md: 'lg' }}
              maxW="md"
            >
              Registra transferencias rápido, ordénalas y compártelas con tu equipo
            </Text>
          </VStack>

          {/* Card principal */}
          <Box
            bg="white"
            p={{ base: 6, md: 8 }}
            pt={{ base: 8, md: 10 }}
            borderRadius="22px"
            boxShadow="xl"
            w="full"
            maxW={{ base: 'md', md: 'lg' }}
            border="1px solid"
            borderColor="blackAlpha.50"
          >
            <VStack spacing={{ base: 5, md: 7 }} align="stretch">
              <VStack spacing={2} textAlign="center">
                <Text 
                  color="gray.700" 
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="medium"
                >
                  Empieza a organizar tus transferencias
                </Text>
                <Text 
                  color="gray.500" 
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  Conecta tu cuenta y sincroniza al instante
                </Text>
              </VStack>

              <Button
                size="lg"
                w="full"
                onClick={login}
                bg="accent.500"
                color="white"
                boxShadow="0 4px 14px rgba(58, 124, 165, 0.4)"
                _hover={{ 
                  bg: 'accent.600', 
                  transform: 'translateY(-2px)', 
                  boxShadow: '0 6px 20px rgba(58, 124, 165, 0.5)' 
                }}
                _active={{ 
                  bg: 'accent.700', 
                  transform: 'translateY(0)',
                  boxShadow: '0 2px 8px rgba(58, 124, 165, 0.4)'
                }}
                h={{ base: '52px', md: '58px' }}
                fontSize={{ base: 'md', md: 'lg' }}
                fontWeight="semibold"
                borderRadius="14px"
                transition="all 0.2s ease-out"
              >
                Conectar cuenta
              </Button>

              <Text 
                fontSize="xs" 
                color="gray.500" 
                textAlign="center"
              >
                Tus datos se guardan de forma segura en tu cuenta
              </Text>
            </VStack>
          </Box>

          {/* Footer info minimal */}
          <VStack spacing={1} color="whiteAlpha.900" fontSize={{ base: 'sm', md: 'md' }} textAlign="center">
            <Text>Conecta • Captura • Comparte</Text>
            <Text color="whiteAlpha.700" fontSize={{ base: 'xs', md: 'sm' }}>
              En segundos, para todo tu equipo
            </Text>
          </VStack>
        </VStack>
      </Container>
      </Box>
    </Box>
  );
}
