import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { authService } from '../services/dropbox/authService';

export default function LoginPage() {
  const login = async () => {
    const url = await authService.getAuthUrl();
    window.location.href = url;
  };

  const pills = [
    { emoji: '⚡', label: 'Rápido' },
    { emoji: '🗂️', label: 'Ordenado' },
    { emoji: '👥', label: 'Para el equipo' },
  ];

  return (
    <Box
      minH="100vh"
      w="100%"
      bgGradient="linear(135deg, accent.500, primary.500)"
      py={{ base: 8, md: 12 }}
      px={{ base: 4, sm: 6 }}
      position="relative"
    >
      {/* Fondos decorativos */}
      <Box
        position="absolute"
        top="-120px"
        left="-80px"
        w="260px"
        h="260px"
        bg="whiteAlpha.200"
        rounded="full"
        filter="blur(80px)"
      />
      <Box
        position="absolute"
        bottom="-140px"
        right="-100px"
        w="300px"
        h="300px"
        bg="blackAlpha.300"
        rounded="full"
        filter="blur(90px)"
      />

      <Container maxW={{ base: 'md', md: 'lg' }} position="relative" zIndex={1}>
        <VStack spacing={{ base: 8, md: 12 }} align="stretch">
          {/* Header */}
          <VStack spacing={{ base: 3, md: 5 }}>
            <Box
              bg="white"
              borderRadius={{ base: '16px', md: '20px' }}
              p={{ base: 2, md: 3 }}
              boxShadow="lg"
            >
              <Text fontSize={{ base: '3xl', md: '5xl' }}>📤</Text>
            </Box>

            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '3xl' }}
              color="white"
              textAlign="center"
              fontWeight="bold"
            >
              Transferido
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
            borderRadius="22px"
            boxShadow="xl"
            w="full"
            maxW={{ base: 'md', md: 'lg' }}
            border="1px solid"
            borderColor="blackAlpha.50"
          >
            <VStack spacing={{ base: 5, md: 7 }} align="stretch">
              {/* Feature pills compactas */}
              <HStack
                spacing={{ base: 2, md: 3 }}
                justify="center"
                wrap="wrap"
              >
                {pills.map((pill, idx) => (
                  <HStack
                    key={pill.label}
                    bg="gray.50"
                    borderRadius="full"
                    py={{ base: 2, md: 3 }}
                    px={{ base: 3, md: 4 }}
                    spacing={2}
                    boxShadow="md"
                    border="1px solid"
                    borderColor={idx === 0 ? 'accent.100' : 'gray.100'}
                  >
                    <Text fontSize={{ base: 'lg', md: 'xl' }}>{pill.emoji}</Text>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="semibold" color="gray.700">
                      {pill.label}
                    </Text>
                  </HStack>
                ))}
              </HStack>

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
                  Conecta tu Dropbox y sincroniza al instante
                </Text>
              </VStack>

              <Button
                size="lg"
                w="full"
                onClick={login}
                bg="accent.500"
                color="white"
                _hover={{ bg: 'accent.600', transform: 'translateY(-1px)', boxShadow: 'xl' }}
                _active={{ bg: 'accent.700', transform: 'translateY(0)' }}
                h={{ base: '50px', md: '56px' }}
                fontSize={{ base: 'md', md: 'lg' }}
                fontWeight="semibold"
                borderRadius="14px"
                transition="all 0.2s"
              >
                Comenzar con Dropbox
              </Button>

              <Text 
                fontSize="xs" 
                color="gray.500" 
                textAlign="center"
              >
                Tus datos se guardan en tu Dropbox personal
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
  );
}
