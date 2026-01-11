import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Input,
  FormControl,
  FormLabel,
  useToast,
} from '@chakra-ui/react';
import { companyService } from '../services/company/companyService';
import { COMPANY_FOLDER_PREFIX } from '../constants/dropbox';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CompanyCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [companyName, setCompanyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un nombre para tu empresa',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (companyName.trim().length < 3) {
      toast({
        title: 'Error',
        description: 'El nombre debe tener al menos 3 caracteres',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsCreating(true);

    try {
      await companyService.createCompany(companyName.trim());
      toast({
        title: 'Empresa creada',
        description: 'Tu empresa ha sido creada exitosamente',
        status: 'success',
        duration: 3000,
      });
      navigate('/', { replace: true });
    } catch (error: any) {
      const errorMessage = error.message || 'Error al crear la empresa';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
      setIsCreating(false);
    }
  };

  if (isCreating) {
    return <LoadingSpinner message="Creando empresa..." fullScreen />;
  }

  return (
    <Box
      minH="100vh"
      w="100%"
      bgGradient="linear(135deg, accent.500, primary.500)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={{ base: 4, md: 6 }}
      px={{ base: 4, sm: 6 }}
      position="relative"
    >
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
          <VStack spacing={{ base: 3, md: 5 }}>
            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '3xl' }}
              color="white"
              textAlign="center"
              fontWeight="bold"
            >
              Crear Empresa
            </Heading>

            <Text
              color="whiteAlpha.900"
              textAlign="center"
              fontSize={{ base: 'md', md: 'lg' }}
              maxW="md"
            >
              Ingresa el nombre de tu empresa para comenzar
            </Text>
          </VStack>

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
            <form onSubmit={handleSubmit}>
              <VStack spacing={{ base: 5, md: 7 }} align="stretch">
                <VStack spacing={2} textAlign="center">
                  <Text
                    color="gray.700"
                    fontSize={{ base: 'md', md: 'lg' }}
                    fontWeight="medium"
                  >
                    Configura tu empresa
                  </Text>
                  <Text
                    color="gray.500"
                    fontSize={{ base: 'sm', md: 'md' }}
                  >
                    Este nombre se usará para identificar tu carpeta
                  </Text>
                </VStack>

                <FormControl isRequired>
                  <FormLabel color="gray.700" fontSize={{ base: 'sm', md: 'md' }}>
                    Nombre de la empresa
                  </FormLabel>
                  <Input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej: Mi Empresa"
                    size="lg"
                    borderRadius="12px"
                    borderColor="gray.300"
                    _focus={{
                      borderColor: 'accent.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-accent-500)',
                    }}
                    disabled={isCreating}
                  />
                  <Box
                    bg="orange.50"
                    border="1px solid"
                    borderColor="orange.200"
                    borderRadius="8px"
                    p={3}
                    mt={2}
                  >
                    <Text
                      fontSize="xs"
                      color="orange.800"
                      fontWeight="medium"
                      mb={1}
                    >
                      ⚠️ Importante
                    </Text>
                    <Text
                      fontSize="xs"
                      color="orange.700"
                    >
                      Este nombre no se podrá cambiar después, ya que será el identificador único de la carpeta. Elige un nombre que represente bien a tu empresa.
                    </Text>
                  </Box>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    mt={2}
                  >
                    El nombre se convertirá automáticamente a formato válido (sin espacios ni caracteres especiales)
                  </Text>
                </FormControl>

                <Button
                  type="submit"
                  size="lg"
                  w="full"
                  bg="accent.500"
                  color="white"
                  boxShadow="0 4px 14px rgba(58, 124, 165, 0.4)"
                  _hover={{
                    bg: 'accent.600',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(58, 124, 165, 0.5)',
                  }}
                  _active={{
                    bg: 'accent.700',
                    transform: 'translateY(0)',
                    boxShadow: '0 2px 8px rgba(58, 124, 165, 0.4)',
                  }}
                  h={{ base: '52px', md: '58px' }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="semibold"
                  borderRadius="14px"
                  transition="all 0.2s ease-out"
                  isLoading={isCreating}
                  loadingText="Creando..."
                  disabled={isCreating || !companyName.trim()}
                >
                  Crear Empresa
                </Button>

                <Text
                  fontSize="xs"
                  color="gray.500"
                  textAlign="center"
                >
                  Se creará una carpeta con el nombre "{COMPANY_FOLDER_PREFIX}{companyName.toLowerCase().replace(/\s+/g, '-')}"
                </Text>
              </VStack>
            </form>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

