import { useState, useEffect, useRef } from 'react';
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
  Select,
  useToast,
  List,
  ListItem,
  HStack,
  Badge,
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { companyService } from '../services/company/companyService';
import { memberService } from '../services/company/memberService';
import { roleService } from '../services/roles/roleService';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { USER_ROLES, UserRole } from '../constants/roles';
import LoadingSpinner from '../components/LoadingSpinner';

interface CompanyMember {
  email: string;
  accountId: string;
  role: UserRole;
  joinedAt: string;
}

export default function CompanyMembersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isRemoveOpen, onOpen: onRemoveOpen, onClose: onRemoveClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(USER_ROLES.EMPLOYEE);
  const [isInviting, setIsInviting] = useState(false);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberToRemove, setMemberToRemove] = useState<CompanyMember | null>(null);

  const activeCompany = companyService.getActiveCompany();

  useEffect(() => {
    const validateAccess = async () => {
      if (!activeCompany) {
        navigate('/', { replace: true });
        return;
      }

      try {
        await roleService.requireAdmin(activeCompany.name);
        
        if (activeCompany.role !== USER_ROLES.ADMIN) {
          const updatedCompany = { ...activeCompany, role: USER_ROLES.ADMIN };
          const cachedCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES_CACHE);
          if (cachedCompanies) {
            const companies = JSON.parse(cachedCompanies);
            const index = companies.findIndex((c: any) => c.id === activeCompany.id);
            if (index >= 0) {
              companies[index] = updatedCompany;
              localStorage.setItem(STORAGE_KEYS.COMPANIES_CACHE, JSON.stringify(companies));
            }
          }
        }

        loadMembers();
      } catch (error) {
        navigate('/', { replace: true });
      }
    };

    validateAccess();
  }, [navigate, activeCompany]);

  async function loadMembers() {
    setIsLoading(true);
    try {
      // TODO: Implementar getCompanyMembers en companyService
      // const companyMembers = await companyService.getCompanyMembers(activeCompany!.id);
      // setMembers(companyMembers);
      setMembers([]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los miembros',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un email',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un email válido',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!activeCompany) {
      return;
    }

    setIsInviting(true);

    try {
      await memberService.addMember(activeCompany.id, email.trim(), role);
      toast({
        title: 'Invitación enviada',
        description: `Se ha invitado a ${email} como ${role === USER_ROLES.ADMIN ? 'administrador' : 'empleado'}. El usuario debe aceptar la invitación y añadir la carpeta compartida a su cuenta para poder pertenecer a la organización.`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      });
      setEmail('');
      setRole(USER_ROLES.EMPLOYEE);
      await loadMembers();
    } catch (error: any) {
      const errorMessage = error.message || 'Error al invitar al empleado';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemove() {
    if (!memberToRemove || !activeCompany) {
      return;
    }

    try {
      // TODO: Implementar removeMember en companyService
      // await companyService.removeMember(activeCompany.id, memberToRemove.accountId);
      toast({
        title: 'Miembro removido',
        description: `${memberToRemove.email} ha sido removido de la empresa`,
        status: 'success',
        duration: 3000,
      });
      onRemoveClose();
      setMemberToRemove(null);
      await loadMembers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo remover al miembro',
        status: 'error',
        duration: 3000,
      });
    }
  }

  function openRemoveDialog(member: CompanyMember) {
    setMemberToRemove(member);
    onRemoveOpen();
  }

  if (isLoading) {
    return <LoadingSpinner message="Cargando miembros..." fullScreen />;
  }

  if (!activeCompany) {
    return null;
  }

  return (
    <Box
      minH="100vh"
      w="100%"
      bgGradient="linear(135deg, accent.500, primary.500)"
      py={{ base: 4, md: 6 }}
      px={{ base: 4, sm: 6 }}
      position="relative"
    >
      <Box
        position="fixed"
        top="-120px"
        left="-80px"
        w="260px"
        h="260px"
        bg="whiteAlpha.200"
        rounded="full"
        filter="blur(80px)"
        pointerEvents="none"
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
        pointerEvents="none"
      />

      <Container maxW={{ base: 'md', md: 'lg' }} position="relative" zIndex={1} py={2}>
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          <VStack spacing={{ base: 3, md: 5 }}>
            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '3xl' }}
              color="white"
              textAlign="center"
              fontWeight="bold"
            >
              Gestionar Empleados
            </Heading>
            <Text
              color="whiteAlpha.900"
              textAlign="center"
              fontSize={{ base: 'md', md: 'lg' }}
              maxW="md"
            >
              Invita y gestiona los miembros de tu empresa
            </Text>
          </VStack>

          <Box
            bg="white"
            p={{ base: 6, md: 8 }}
            borderRadius="22px"
            boxShadow="xl"
            w="full"
            border="1px solid"
            borderColor="blackAlpha.50"
          >
            <VStack spacing={{ base: 6, md: 8 }} align="stretch">
              <VStack spacing={2} textAlign="center">
                <Text
                  color="gray.700"
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="medium"
                >
                  Invitar Nuevo Miembro
                </Text>
              </VStack>

              <form onSubmit={handleInvite}>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel color="gray.700" fontSize={{ base: 'sm', md: 'md' }}>
                      Email del empleado
                    </FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="empleado@ejemplo.com"
                      size="lg"
                      borderRadius="12px"
                      borderColor="gray.300"
                      _focus={{
                        borderColor: 'accent.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-accent-500)',
                      }}
                      disabled={isInviting}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color="gray.700" fontSize={{ base: 'sm', md: 'md' }}>
                      Rol
                    </FormLabel>
                    <Select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      size="lg"
                      borderRadius="12px"
                      borderColor="gray.300"
                      _focus={{
                        borderColor: 'accent.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-accent-500)',
                      }}
                      disabled={isInviting}
                    >
                      <option value={USER_ROLES.EMPLOYEE}>Empleado</option>
                      <option value={USER_ROLES.ADMIN}>Administrador</option>
                    </Select>
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      Los administradores pueden gestionar empleados y configurar la empresa
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
                    isLoading={isInviting}
                    loadingText="Enviando invitación..."
                    disabled={isInviting || !email.trim()}
                  >
                    Invitar
                  </Button>
                </VStack>
              </form>
            </VStack>
          </Box>

          <Box
            bg="white"
            p={{ base: 6, md: 8 }}
            borderRadius="22px"
            boxShadow="xl"
            w="full"
            border="1px solid"
            borderColor="blackAlpha.50"
          >
            <VStack spacing={4} align="stretch">
              <Text
                color="gray.700"
                fontSize={{ base: 'md', md: 'lg' }}
                fontWeight="medium"
              >
                Miembros Actuales
              </Text>

              {members.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={4}>
                  No hay miembros aún. Invita a alguien para comenzar.
                </Text>
              ) : (
                <List spacing={3}>
                  {members.map((member) => (
                    <ListItem
                      key={member.accountId}
                      p={4}
                      borderRadius="12px"
                      border="1px solid"
                      borderColor="gray.200"
                      bg="gray.50"
                    >
                      <HStack justify="space-between" align="center">
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontWeight="medium" color="gray.700">
                            {member.email}
                          </Text>
                          <HStack>
                            <Badge
                              colorScheme={member.role === USER_ROLES.ADMIN ? 'purple' : 'blue'}
                              borderRadius="6px"
                            >
                              {member.role === USER_ROLES.ADMIN ? 'Administrador' : 'Empleado'}
                            </Badge>
                            {activeCompany.ownerAccountId === member.accountId && (
                              <Badge colorScheme="orange" borderRadius="6px">
                                Propietario
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                        {activeCompany.ownerAccountId !== member.accountId && (
                          <IconButton
                            aria-label="Remover miembro"
                            icon={<Text fontSize="lg">🗑️</Text>}
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => openRemoveDialog(member)}
                          />
                        )}
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              )}
            </VStack>
          </Box>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            color="white"
            borderColor="whiteAlpha.500"
            _hover={{
              bg: 'whiteAlpha.200',
              borderColor: 'white',
            }}
            size="lg"
            borderRadius="14px"
          >
            Volver
          </Button>
        </VStack>
      </Container>

      <AlertDialog
        isOpen={isRemoveOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRemoveClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remover Miembro
            </AlertDialogHeader>
            <AlertDialogBody>
              ¿Estás seguro de que deseas remover a {memberToRemove?.email} de la empresa?
              Esta acción no se puede deshacer.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onRemoveClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={handleRemove} ml={3}>
                Remover
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

