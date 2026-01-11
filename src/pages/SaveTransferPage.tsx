import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Input,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Text,
  HStack,
  VStack,
  Container,
  Flex,
  IconButton,
  FormControl,
  FormLabel,
  Heading,
} from '@chakra-ui/react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { idService, TransferIds } from '../services/transfer/idService';
import { useTransferSave } from '../hooks/useTransferSave';
import { useTransferUpdate } from '../hooks/useTransferUpdate';
import { fileService } from '../services/dropbox/fileService';
import { Invoice } from '../types/dropbox';

type ModalType = 'none' | 'duplicate' | 'success';

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

interface LocationState {
  imageUrl?: string;
  photoBlob?: Blob;
  preloadedIds?: TransferIds;
  source?: 'camera' | 'file';
  editTransfer?: Invoice;
}

export default function SaveTransferPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { save } = useTransferSave();
  const { update } = useTransferUpdate();

  const { imageUrl, photoBlob, preloadedIds, source, editTransfer } = (location.state as LocationState) || {};

  const isEditMode = !!editTransfer;

  const [invoiceNumber, setInvoiceNumber] = useState(editTransfer?.invoiceNumber === 'SIN-FACTURA' ? '' : (editTransfer?.invoiceNumber || ''));
  const [transferNumber, setTransferNumber] = useState(editTransfer?.transferNumber || '');
  const [isUploading, setIsUploading] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('none');
  const [duplicateSuggestedId, setDuplicateSuggestedId] = useState('');
  const [savedTransferNumber, setSavedTransferNumber] = useState('');
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const [loadedIds, setLoadedIds] = useState<TransferIds | null>(preloadedIds || null);
  const [temporaryImageUrl, setTemporaryImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(isEditMode);

  const [bottomOffset, setBottomOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const displayImageUrl = isEditMode ? temporaryImageUrl : imageUrl;

  useEffect(() => {
    if (isEditMode && editTransfer?.imageUrl) {
      setIsLoadingImage(true);
      fileService.getTemporaryLink(editTransfer.imageUrl)
        .then((url) => {
          setTemporaryImageUrl(url);
        })
        .catch(() => {
          toast({
            title: 'Error',
            description: 'No se pudo cargar la imagen',
            status: 'error',
            duration: 3000,
          });
          navigate('/review', { replace: true });
        })
        .finally(() => {
          setIsLoadingImage(false);
        });
    }
  }, [isEditMode, editTransfer?.imageUrl, navigate, toast]);

  useEffect(() => {
    if (!isEditMode && !imageUrl) {
      const targetRoute = source === 'file' ? '/upload-file' : '/upload';
      navigate(targetRoute, { replace: true });
    }
  }, [imageUrl, navigate, isEditMode, source]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleViewportChange = () => {
      const offsetFromBottom = window.innerHeight - viewport.height - viewport.offsetTop;
      setBottomOffset(Math.max(0, offsetFromBottom));
    };

    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);

    handleViewportChange();

    return () => {
      viewport.removeEventListener('resize', handleViewportChange);
      viewport.removeEventListener('scroll', handleViewportChange);
    };
  }, [isMobile]);

  const handleSubmit = async () => {
    if (isEditMode) {
      await handleUpdate();
    } else {
      await handleSave();
    }
  };

  const handleSave = async () => {
    if (!photoBlob) {
      toast({ title: 'Error', description: 'No hay foto capturada', status: 'error', duration: 3000 });
      return;
    }

    const ids = loadedIds || await idService.getAll();
    setLoadedIds(ids);

    const prepared = idService.prepare(ids, transferNumber.trim());

    if (prepared.isDuplicate) {
      setDuplicateSuggestedId(prepared.finalNumber);
      setModalType('duplicate');
      return;
    }

    await saveTransfer(ids, prepared.finalNumber);
  };

  const handleUpdate = async () => {
    if (!editTransfer) return;

    const ids = loadedIds || await idService.getAll();
    setLoadedIds(ids);

    const newTransferNumber = transferNumber.trim();
    const originalNumber = editTransfer.transferNumber || '';

    if (newTransferNumber && newTransferNumber !== originalNumber) {
      const prepared = idService.prepare(ids, newTransferNumber);
      if (prepared.isDuplicate) {
        setDuplicateSuggestedId(prepared.finalNumber);
        setModalType('duplicate');
        return;
      }
    }

    await updateTransfer(ids, newTransferNumber);
  };

  const saveTransfer = async (ids: TransferIds, finalTransferNumber: string) => {
    if (!photoBlob) return;

    setIsUploading(true);

    try {
      const savedNumber = await save({
        photoBlob,
        invoiceNumber: invoiceNumber.trim(),
        transferNumber: finalTransferNumber,
        loadedIds: ids,
      });

      setSavedTransferNumber(savedNumber);
      setModalType('success');
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar la transferencia', status: 'error', duration: 3000 });
    } finally {
      setIsUploading(false);
    }
  };

  const updateTransfer = async (ids: TransferIds, finalTransferNumber: string) => {
    if (!editTransfer) return;

    setIsUploading(true);

    try {
      await update({
        date: editTransfer.date,
        time: editTransfer.time,
        imageUrl: editTransfer.imageUrl,
        invoiceNumber: invoiceNumber.trim(),
        transferNumber: finalTransferNumber,
        originalTransferNumber: editTransfer.transferNumber || '',
        loadedIds: ids,
      });

      setSavedTransferNumber(finalTransferNumber);
      setModalType('success');
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar la transferencia', status: 'error', duration: 3000 });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    if (isEditMode) {
      navigate('/review', { replace: true });
    } else {
      const targetRoute = source === 'file' ? '/upload-file' : '/upload';
      navigate(targetRoute, { replace: true });
    }
  };

  const handleSuccessClose = () => {
    setModalType('none');
    if (isEditMode) {
      navigate('/review');
    } else {
      navigate('/');
    }
  };

  const handleDuplicateConfirm = async () => {
    setModalType('none');
    if (loadedIds) {
      if (isEditMode) {
        await updateTransfer(loadedIds, duplicateSuggestedId);
      } else {
        await saveTransfer(loadedIds, duplicateSuggestedId);
      }
    }
  };

  const handleDuplicateCancel = () => {
    setModalType('none');
  };

  if (isLoadingImage) {
    return (
      <Box minH="100vh" w="100%" position="relative" overflow="hidden">
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgGradient="linear(135deg, #4299E1, #2B6CB0)"
          zIndex={0}
        />
        <Box
          position="relative"
          zIndex={1}
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack spacing={4}>
            <Box
              w="50px"
              h="50px"
              border="4px solid"
              borderColor="white"
              borderTopColor="transparent"
              borderRadius="full"
              animation="spin 1s linear infinite"
              sx={{ '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }}
            />
            <Text color="white" fontSize="lg">Cargando imagen...</Text>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (!displayImageUrl) return null;

  const formHeight = isEditMode ? 170 : 130;
  const pageTitle = isEditMode ? 'Editar Transferencia' : 'Nueva Transferencia';
  const successMessage = isEditMode ? 'Transferencia actualizada correctamente' : 'Transferencia guardada correctamente';
  const buttonText = isEditMode ? 'Actualizar' : 'Guardar';
  const loadingText = isEditMode ? 'Actualizando...' : 'Guardando...';

  if (isMobile) {
    return (
      <Box
        ref={containerRef}
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="black"
        overflow="hidden"
      >
        <IconButton
          aria-label="Cancelar"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          }
          position="absolute"
          top={3}
          left={3}
          zIndex={200}
          size="sm"
          variant="solid"
          bg="blackAlpha.600"
          color="white"
          borderRadius="full"
          _hover={{ bg: 'blackAlpha.700' }}
          _active={{ bg: 'blackAlpha.800' }}
          onClick={() => navigate(isEditMode ? '/review' : '/')}
        />

        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={`${formHeight + bottomOffset}px`}
          overflow="hidden"
          bg="black"
        >
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={4}
            centerOnInit
            wheel={{ disabled: true }}
            doubleClick={{ mode: 'reset' }}
          >
            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
              }}
              contentStyle={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}
            >
              <img
                src={displayImageUrl}
                alt="Transferencia"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                  objectPosition: 'top',
                }}
              />
            </TransformComponent>
          </TransformWrapper>
        </Box>

        <Box
          ref={formRef}
          position="absolute"
          left={0}
          right={0}
          bottom={`${bottomOffset}px`}
          bg="white"
          px={3}
          py={3}
          borderTopRadius="16px"
          boxShadow="0 -4px 20px rgba(0,0,0,0.3)"
          zIndex={100}
        >
          {isEditMode && editTransfer && (
            <HStack spacing={4} mb={2} px={1}>
              <Text fontSize="xs" color="gray.500">
                📅 {editTransfer.date}
              </Text>
              <Text fontSize="xs" color="gray.500">
                🕐 {editTransfer.time}
              </Text>
            </HStack>
          )}

          <HStack spacing={2} mb={3}>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>Comprobante</Text>
              <Input
                placeholder="Opcional"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                size="sm"
                bg="gray.100"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="8px"
                _focus={{ bg: 'white', borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
              />
            </Box>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>N° Transferencia</Text>
              <Input
                placeholder="Ingresa el número"
                value={transferNumber}
                onChange={(e) => setTransferNumber(e.target.value)}
                size="sm"
                bg="gray.100"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="8px"
                _focus={{ bg: 'white', borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
              />
            </Box>
          </HStack>

          <HStack spacing={2}>
            <Button
              flex={1}
              colorScheme="blue"
              size="md"
              borderRadius="10px"
              onClick={handleSubmit}
              isLoading={isUploading}
              loadingText={loadingText}
            >
              {buttonText}
            </Button>
            <IconButton
              aria-label={isEditMode ? 'Volver a transferencias' : 'Tomar otra foto'}
              icon={
                isEditMode ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6M23 20v-6h-6" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                  </svg>
                )
              }
              size="md"
              variant="outline"
              borderRadius="10px"
              onClick={handleRetake}
            />
          </HStack>
        </Box>

        <Modal isOpen={modalType === 'duplicate'} onClose={handleDuplicateCancel} isCentered>
          <ModalOverlay bg="blackAlpha.700" />
          <ModalContent borderRadius="20px" mx={4}>
            <ModalHeader textAlign="center" pt={6}>⚠️ Transferencia Duplicada</ModalHeader>
            <ModalBody textAlign="center">
              <Text>El número <strong>{transferNumber}</strong> ya existe.</Text>
              <Text mt={2} color="gray.600">Se guardará como: <strong>{duplicateSuggestedId}</strong></Text>
            </ModalBody>
            <ModalFooter justifyContent="center" pb={6}>
              <HStack spacing={3}>
                <Button variant="outline" onClick={handleDuplicateCancel}>Cancelar</Button>
                <Button colorScheme="orange" onClick={handleDuplicateConfirm} isLoading={isUploading}>
                  {buttonText}
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={modalType === 'success'} onClose={handleSuccessClose} isCentered>
          <ModalOverlay bg="blackAlpha.700" />
          <ModalContent borderRadius="20px" mx={4}>
            <ModalHeader textAlign="center" pt={6}>✅ {isEditMode ? '¡Actualizado!' : '¡Guardado!'}</ModalHeader>
            <ModalBody textAlign="center">
              <Text>{successMessage}</Text>
              {savedTransferNumber && (
                <Text mt={2} color="gray.600">Número: <strong>{savedTransferNumber}</strong></Text>
              )}
            </ModalBody>
            <ModalFooter justifyContent="center" pb={6}>
              <Button colorScheme="blue" onClick={handleSuccessClose}>Continuar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    );
  }

  return (
    <Box minH="100vh" w="100%" position="relative" overflow="hidden">
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bgGradient="linear(135deg, #4299E1, #2B6CB0)"
        zIndex={0}
      />
      <Box
        position="relative"
        zIndex={1}
        minH="100vh"
        display="flex"
        flexDirection="column"
      >
        <Box bg="#1a365d" py={4} boxShadow="md" flexShrink={0}>
          <Container maxW="5xl" display="flex" justifyContent="space-between" alignItems="center">
            <Heading size="md" color="white">{pageTitle}</Heading>
            <Button
              size="sm"
              variant="outline"
              color="white"
              borderColor="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={() => navigate(isEditMode ? '/review' : '/')}
            >
              Cancelar
            </Button>
          </Container>
        </Box>

        <Container maxW="5xl" py={6} flex="1" overflowY="auto">
        <Flex h="100%" gap={6}>
          <Box
            flex={1}
            bg="gray.900"
            borderRadius="16px"
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <img
              src={displayImageUrl}
              alt="Transferencia"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>

          <Flex w="320px" align="center" justify="center">
            <Box bg="white" p={6} borderRadius="20px" boxShadow="xl" w="100%">
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                  Datos de la transferencia
                </Text>

                {isEditMode && editTransfer && (
                  <HStack spacing={4} bg="gray.50" p={3} borderRadius="10px">
                    <Text fontSize="sm" color="gray.600">
                      📅 {editTransfer.date}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      🕐 {editTransfer.time}
                    </Text>
                  </HStack>
                )}

                <FormControl>
                  <FormLabel fontSize="sm" color="gray.600">Número de Comprobante</FormLabel>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Opcional"
                    bg="gray.50"
                    borderRadius="10px"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" color="gray.600">Número de Transferencia</FormLabel>
                  <Input
                    value={transferNumber}
                    onChange={(e) => setTransferNumber(e.target.value)}
                    placeholder="Ingresa el número"
                    bg="gray.50"
                    borderRadius="10px"
                  />
                </FormControl>

                <HStack spacing={2} pt={2}>
                  <Button
                    flex={1}
                    colorScheme="blue"
                    size="lg"
                    borderRadius="12px"
                    onClick={handleSubmit}
                    isLoading={isUploading}
                    loadingText={loadingText}
                  >
                    {buttonText}
                  </Button>
                  <IconButton
                    aria-label={isEditMode ? 'Volver a transferencias' : 'Tomar otra foto'}
                    icon={
                      isEditMode ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 4v6h6M23 20v-6h-6" />
                          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                        </svg>
                      )
                    }
                    size="lg"
                    variant="outline"
                    borderRadius="12px"
                    onClick={handleRetake}
                  />
                </HStack>
              </VStack>
            </Box>
          </Flex>
        </Flex>
      </Container>

      <Modal isOpen={modalType === 'duplicate'} onClose={handleDuplicateCancel} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="24px" mx={4}>
          <Box bg="orange.50" textAlign="center" pt={8}>
            <Text fontSize="5xl">⚠️</Text>
          </Box>
          <ModalHeader color="orange.600" textAlign="center">Transferencia Duplicada</ModalHeader>
          <ModalBody textAlign="center">
            <Text>El número <strong>{transferNumber}</strong> ya existe.</Text>
            <Text mt={2} color="gray.600">Se guardará como: <strong>{duplicateSuggestedId}</strong></Text>
          </ModalBody>
          <ModalFooter justifyContent="center" pb={6}>
            <HStack spacing={3}>
              <Button variant="outline" onClick={handleDuplicateCancel} size="lg">Cancelar</Button>
              <Button colorScheme="orange" onClick={handleDuplicateConfirm} isLoading={isUploading} size="lg">
                {buttonText}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={modalType === 'success'} onClose={handleSuccessClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="24px" mx={4}>
          <Box bg="green.50" textAlign="center" pt={8}>
            <Text fontSize="5xl">✅</Text>
          </Box>
          <ModalHeader color="green.600" textAlign="center">{isEditMode ? '¡Actualizado!' : '¡Éxito!'}</ModalHeader>
          <ModalBody textAlign="center">
            <Text>{successMessage}</Text>
            {savedTransferNumber && (
              <Text mt={2} color="gray.600">Número: <strong>{savedTransferNumber}</strong></Text>
            )}
          </ModalBody>
          <ModalFooter justifyContent="center" pb={6}>
            <Button colorScheme="blue" onClick={handleSuccessClose} size="lg">Continuar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </Box>
    </Box>
  );
}
