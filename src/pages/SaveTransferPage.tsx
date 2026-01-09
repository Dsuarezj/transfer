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
import { idService, TransferIds } from '../services/transfer/idService';
import { useTransferSave } from '../hooks/useTransferSave';

type ModalType = 'none' | 'duplicate' | 'success';

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

export default function SaveTransferPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { save } = useTransferSave();

  const { imageUrl, photoBlob, preloadedIds } = (location.state as {
    imageUrl?: string;
    photoBlob?: Blob;
    preloadedIds?: TransferIds;
  }) || {};

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('none');
  const [duplicateSuggestedId, setDuplicateSuggestedId] = useState('');
  const [savedTransferNumber, setSavedTransferNumber] = useState('');
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const [loadedIds, setLoadedIds] = useState<TransferIds | null>(preloadedIds || null);

  const [bottomOffset, setBottomOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageUrl) {
      navigate('/upload', { replace: true });
    }
  }, [imageUrl, navigate]);

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

  const handleRetake = () => {
    navigate('/upload', { replace: true });
  };

  const handleSuccessClose = () => {
    setModalType('none');
    navigate('/');
  };

  const handleDuplicateConfirm = async () => {
    setModalType('none');
    if (loadedIds) {
      await saveTransfer(loadedIds, duplicateSuggestedId);
    }
  };

  const handleDuplicateCancel = () => {
    setModalType('none');
  };

  if (!imageUrl) return null;

  const formHeight = 130;

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
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={`${formHeight + bottomOffset}px`}
          overflow="auto"
          bg="black"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <img
            src={imageUrl}
            alt="Transferencia"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              minHeight: '100%',
              objectFit: 'contain',
              objectPosition: 'top',
            }}
          />
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
          <HStack spacing={2} mb={3}>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>Factura</Text>
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
              loadingText="Guardando..."
            >
              Guardar
            </Button>
            <IconButton
              aria-label="Tomar otra foto"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                </svg>
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
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={modalType === 'success'} onClose={handleSuccessClose} isCentered>
          <ModalOverlay bg="blackAlpha.700" />
          <ModalContent borderRadius="20px" mx={4}>
            <ModalHeader textAlign="center" pt={6}>✅ ¡Guardado!</ModalHeader>
            <ModalBody textAlign="center">
              <Text>Transferencia guardada correctamente</Text>
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
    <Box h="100vh" bgGradient="linear(135deg, #4299E1, #2B6CB0)">
      <Box bg="#1a365d" py={4} boxShadow="md">
        <Container maxW="5xl" display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="md" color="white">Nueva Transferencia</Heading>
          <Button
            size="sm"
            variant="outline"
            color="white"
            borderColor="white"
            _hover={{ bg: 'whiteAlpha.200' }}
            onClick={() => navigate('/')}
          >
            Cancelar
          </Button>
        </Container>
      </Box>

      <Container maxW="5xl" py={6} h="calc(100vh - 72px)">
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
              src={imageUrl}
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

                <FormControl>
                  <FormLabel fontSize="sm" color="gray.600">Número de Factura</FormLabel>
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
                    loadingText="Guardando..."
                  >
                    Guardar
                  </Button>
                  <IconButton
                    aria-label="Tomar otra foto"
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 4v6h6M23 20v-6h-6" />
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                      </svg>
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
                Guardar
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
          <ModalHeader color="green.600" textAlign="center">¡Éxito!</ModalHeader>
          <ModalBody textAlign="center">
            <Text>La transferencia se guardó correctamente</Text>
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
  );
}
