import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Text,
  VStack,
  useToast,
  Badge,
  HStack,
  SimpleGrid,
} from '@chakra-ui/react';
import { companyService } from '../services/company/companyService';
import { roleService } from '../services/roles/roleService';
import { USER_ROLES } from '../constants/roles';
import { Company } from '../types/company';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';

export default function CompanySelectPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const activeCompany = companyService.getActiveCompany();

  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoading(true);
      try {
        const detectedCompanies = await companyService.detectCompanies(roleService.getUserRole);
        setCompanies(detectedCompanies);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las empresas',
          status: 'error',
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanies();
  }, [toast]);

  const handleSelectCompany = async (companyId: string) => {
    if (activeCompany?.id === companyId) {
      return;
    }

    setIsSwitching(companyId);
    try {
      await companyService.switchActiveCompany(companyId, roleService.getUserRole);
      toast({
        title: 'Empresa cambiada',
        description: 'Has cambiado de empresa exitosamente',
        status: 'success',
        duration: 2000,
      });
      navigate('/', { replace: true });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al cambiar de empresa',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSwitching(null);
    }
  };

  const handleCreateCompany = () => {
    navigate('/create-company');
  };

  if (isLoading) {
    return <LoadingSpinner message="Cargando empresas..." fullScreen />;
  }

  return (
    <Box
      minH="100vh"
      w="100%"
      bgGradient="linear(135deg, accent.500, primary.500)"
      display="flex"
      flexDirection="column"
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

      <PageHeader title="Seleccionar Empresa" backPath="/" />

      <Box flex="1" position="relative" zIndex={1} py={{ base: 4, md: 6 }} px={{ base: 4, sm: 6 }}>
        <Container maxW="md" position="relative" zIndex={1}>
          <VStack spacing={{ base: 6, md: 8 }} align="stretch">
            <VStack spacing={{ base: 3, md: 5 }}>
              <Text
                color="whiteAlpha.900"
                textAlign="center"
                fontSize={{ base: 'md', md: 'lg' }}
                maxW="md"
              >
                Selecciona la empresa con la que deseas trabajar
              </Text>
            </VStack>

            {companies.length === 0 ? (
              <Box
                bg="white"
                p={{ base: 6, md: 8 }}
                borderRadius="22px"
                boxShadow="xl"
                w="full"
                border="1px solid"
                borderColor="blackAlpha.50"
                textAlign="center"
              >
                <VStack spacing={4}>
                  <Text fontSize="lg" fontWeight="medium" color="gray.700">
                    No tienes empresas
                  </Text>
                  <Text color="gray.600">
                    Crea una nueva empresa para empezar a gestionar tus transferencias
                  </Text>
                  <Button
                    size="lg"
                    w="full"
                    bg="accent.500"
                    color="white"
                    _hover={{ bg: 'accent.600' }}
                    _active={{ bg: 'accent.700' }}
                    onClick={handleCreateCompany}
                  >
                    Crear Nueva Empresa
                  </Button>
                </VStack>
              </Box>
            ) : (
              <>
                <SimpleGrid columns={1} spacing={3} w="full">
                  {companies.map((company) => {
                    const isActive = activeCompany?.id === company.id;
                    const isSwitchingThis = isSwitching === company.id;

                    return (
                      <Box
                        key={company.id}
                        bg="white"
                        p={{ base: 5, md: 6 }}
                        borderRadius="16px"
                        boxShadow="md"
                        border="2px solid"
                        borderColor={isActive ? 'accent.500' : 'transparent'}
                        position="relative"
                      >
                        <VStack spacing={3} align="stretch">
                          <HStack justifyContent="space-between" alignItems="start">
                            <VStack align="start" spacing={1} flex="1">
                              <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                                {company.name}
                              </Text>
                              <HStack>
                                <Badge
                                  colorScheme={company.role === USER_ROLES.ADMIN ? 'purple' : 'blue'}
                                  borderRadius="6px"
                                >
                                  {company.role === USER_ROLES.ADMIN ? 'Administrador' : 'Empleado'}
                                </Badge>
                                {isActive && (
                                  <Badge colorScheme="green" borderRadius="6px">
                                    Activa
                                  </Badge>
                                )}
                              </HStack>
                            </VStack>
                          </HStack>
                          <Button
                            size="md"
                            w="full"
                            bg={isActive ? 'gray.200' : 'accent.500'}
                            color={isActive ? 'gray.600' : 'white'}
                            _hover={isActive ? { bg: 'gray.300' } : { bg: 'accent.600' }}
                            _active={isActive ? { bg: 'gray.400' } : { bg: 'accent.700' }}
                            onClick={() => handleSelectCompany(company.id)}
                            isDisabled={isActive || isSwitchingThis}
                            isLoading={isSwitchingThis}
                            loadingText="Cambiando..."
                          >
                            {isActive ? 'Empresa Activa' : 'Seleccionar'}
                          </Button>
                        </VStack>
                      </Box>
                    );
                  })}
                </SimpleGrid>

                <Box
                  bg="white"
                  p={{ base: 6, md: 8 }}
                  borderRadius="22px"
                  boxShadow="xl"
                  w="full"
                  border="1px solid"
                  borderColor="blackAlpha.50"
                >
                  <Button
                    size="lg"
                    w="full"
                    bg="primary.500"
                    color="white"
                    _hover={{ bg: 'primary.600' }}
                    _active={{ bg: 'primary.700' }}
                    onClick={handleCreateCompany}
                  >
                    Crear Nueva Empresa
                  </Button>
                </Box>
              </>
            )}
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}

