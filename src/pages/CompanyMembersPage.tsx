import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
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
import { dropboxGateway } from '../gateway/dropboxGateway';
import { getCompanyFolderPath, getWorkspaceFolderPath } from '../constants/dropbox';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { USER_ROLES, UserRole } from '../constants/roles';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import InstructionsModal from '../components/InstructionsModal';
import type { files } from 'dropbox/types';

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
  const { isOpen: isInstructionsOpen, onOpen: onInstructionsOpen, onClose: onInstructionsClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(USER_ROLES.EMPLOYEE);
  const [isInviting, setIsInviting] = useState(false);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberToRemove, setMemberToRemove] = useState<CompanyMember | null>(null);
  const [invitedMemberEmail, setInvitedMemberEmail] = useState<string>('');
  const [invitedMemberRole, setInvitedMemberRole] = useState<UserRole>(USER_ROLES.EMPLOYEE);

  const activeCompany = companyService.getActiveCompany();

  useEffect(() => {
    if (!activeCompany) {
      navigate('/', { replace: true });
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      try {
        await dropboxGateway.refreshTokenIfNeeded();
        const dbx = dropboxGateway.getClient();

        const mainFolderPath = getCompanyFolderPath(activeCompany.name);
        const workspaceFolderPath = getWorkspaceFolderPath(activeCompany.name);

        const [mainFolderMetadata, workspaceFolderMetadata] = await Promise.all([
          dbx.filesGetMetadata({ path: mainFolderPath }).catch(() => null),
          dbx.filesGetMetadata({ path: workspaceFolderPath }).catch(() => null),
        ]);

        const mainFolderResult = mainFolderMetadata?.result;
        if (!mainFolderResult || mainFolderResult['.tag'] !== 'folder') {
          throw new Error('No tienes permisos de administrador');
        }

        const mainFolderSharedId = (mainFolderResult as files.FolderMetadataReference).shared_folder_id || null;

        let workspaceFolderSharedId: string | null = null;
        const workspaceFolderResult = workspaceFolderMetadata?.result;
        if (workspaceFolderResult && workspaceFolderResult['.tag'] === 'folder') {
          workspaceFolderSharedId = (workspaceFolderResult as files.FolderMetadataReference).shared_folder_id || null;
        }

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

        if (isMounted) {
          setIsLoading(true);
          try {
            const companyMembers = await memberService.getCompanyMembers({
              companyId: activeCompany.id,
              mainFolderSharedId,
              workspaceFolderSharedId,
            });
            if (isMounted) {
              setMembers(companyMembers);
            }
          } catch (error: any) {
            if (isMounted) {
              toast({
                title: 'Error',
                description: 'No se pudieron cargar los miembros',
                status: 'error',
                duration: 3000,
              });
            }
          } finally {
            if (isMounted) {
              setIsLoading(false);
            }
          }
        }
      } catch (error: any) {
        if (isMounted) {
          if (error.message === 'No tienes permisos de administrador') {
            navigate('/', { replace: true });
          } else {
            toast({
              title: 'Error',
              description: 'No se pudieron cargar los miembros',
              status: 'error',
              duration: 3000,
            });
          }
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  async function loadMembers() {
    if (!activeCompany) {
      return;
    }

    setIsLoading(true);
    try {
      await dropboxGateway.refreshTokenIfNeeded();
      const dbx = dropboxGateway.getClient();

      const mainFolderPath = getCompanyFolderPath(activeCompany.name);
      const workspaceFolderPath = getWorkspaceFolderPath(activeCompany.name);

      const [mainFolderMetadata, workspaceFolderMetadata] = await Promise.all([
        dbx.filesGetMetadata({ path: mainFolderPath }).catch(() => null),
        dbx.filesGetMetadata({ path: workspaceFolderPath }).catch(() => null),
      ]);

      const mainFolderResult = mainFolderMetadata?.result;
      const mainFolderSharedId = mainFolderResult && mainFolderResult['.tag'] === 'folder'
        ? (mainFolderResult as files.FolderMetadataReference).shared_folder_id || null
        : null;

      let workspaceFolderSharedId: string | null = null;
      const workspaceFolderResult = workspaceFolderMetadata?.result;
      if (workspaceFolderResult && workspaceFolderResult['.tag'] === 'folder') {
        workspaceFolderSharedId = (workspaceFolderResult as files.FolderMetadataReference).shared_folder_id || null;
      }

      const companyMembers = await memberService.getCompanyMembers({
        companyId: activeCompany.id,
        mainFolderSharedId,
        workspaceFolderSharedId,
      });
      setMembers(companyMembers);
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

    const normalizedEmail = email.trim().toLowerCase();
    const existingMember = members.find(
      (member) => member.email.toLowerCase() === normalizedEmail
    );

    if (existingMember) {
      toast({
        title: 'Usuario ya existe',
        description: `${existingMember.email} ya está en la lista de miembros. Primero debes eliminarlo para poder asignarle un nuevo rol.`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsInviting(true);

    try {
      await memberService.addMember(activeCompany.id, email.trim(), role);
      setInvitedMemberEmail(email.trim());
      setInvitedMemberRole(role);
      setEmail('');
      setRole(USER_ROLES.EMPLOYEE);
      await loadMembers();
      onInstructionsOpen();
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

    onRemoveClose();
    setIsLoading(true);

    try {
      await memberService.removeMember(activeCompany.id, memberToRemove.accountId);
      toast({
        title: 'Miembro removido',
        description: `${memberToRemove.email} ha sido removido de la empresa`,
        status: 'success',
        duration: 3000,
      });
      setMemberToRemove(null);
      await loadMembers();
    } catch (error: any) {
      const errorMessage = error.message || 'No se pudo remover al miembro';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
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

      <PageHeader title="Gestionar Empleados" backPath="/" />

      <Box flex="1" position="relative" zIndex={1} py={{ base: 4, md: 6 }} px={{ base: 4, sm: 6 }}>
        <Container maxW={{ base: 'md', md: 'lg' }} position="relative" zIndex={1}>
          <VStack spacing={{ base: 6, md: 8 }} align="stretch">
            <VStack spacing={{ base: 3, md: 5 }}>
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
        </VStack>
      </Container>
      </Box>

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

      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={onInstructionsClose}
        title="Invitación Enviada"
        subtitle={`Se ha invitado a <strong>${invitedMemberEmail}</strong> como <strong>${invitedMemberRole === USER_ROLES.ADMIN ? 'administrador' : 'empleado'}</strong>`}
        steps={[
          {
            number: 1,
            text: 'El empleado debe entrar a su correo electrónico y buscar la invitación de Dropbox',
          },
          {
            number: 2,
            text: 'Debe aceptar la invitación y añadir la carpeta compartida a su Dropbox',
          },
          {
            number: 3,
            text: 'Luego debe hacer login en esta aplicación con su cuenta de Dropbox',
          },
          {
            number: 4,
            text: 'Una vez dentro, podrá empezar a subir las transferencias',
          },
        ]}
      />
    </Box>
  );
}

