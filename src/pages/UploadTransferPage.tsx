import { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Text,
  Heading,
  HStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { invoiceService } from '../services/invoiceService';
import CameraView from '../components/CameraView';

type ModalType = 'none' | 'duplicate' | 'success';

export default function UploadTransferPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const camera = useCamera();

  const [step, setStep] = useState<'camera' | 'form'>('camera');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('none');
  const [duplicateSuggestedId, setDuplicateSuggestedId] = useState('');
  const [savedTransferNumber, setSavedTransferNumber] = useState('');

  const handleCapture = async () => {
    const blob = await camera.capturePhoto();
    if (blob) {
      setPhotoBlob(blob);
      camera.stopCamera();
      setStep('form');
    }
  };

  const handleSubmit = async () => {
    if (!photoBlob) {
      toast({
        title: 'Error',
        description: 'No hay foto capturada',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (transferNumber.trim()) {
      setIsUploading(true);
      try {
        const result = await invoiceService.checkDuplicate(transferNumber.trim());
        
        if (result.isDuplicate) {
          setDuplicateSuggestedId(result.suggestedId);
          setModalType('duplicate');
          setIsUploading(false);
          return;
        }
      } catch (error) {
        console.error('Error verificando duplicado:', error);
      }
      setIsUploading(false);
    }

    await saveTransfer();
  };

  const saveTransfer = async () => {
    if (!photoBlob) return;

    setIsUploading(true);
    const finalInvoiceNumber = invoiceNumber.trim() || 'SIN-FACTURA';

    try {
      const imageUrl = await invoiceService.uploadPhoto(photoBlob, finalInvoiceNumber);
      const finalTransferNumber = await invoiceService.add(
        finalInvoiceNumber, 
        imageUrl, 
        transferNumber.trim() || undefined
      );

      setSavedTransferNumber(finalTransferNumber);
      setModalType('success');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la transferencia',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDuplicateConfirm = async () => {
    setModalType('none');
    await saveTransfer();
  };

  const handleDuplicateCancel = () => {
    setModalType('none');
  };

  const handleSuccessClose = () => {
    setModalType('none');
    navigate('/');
  };

  const handleCancel = () => {
    camera.stopCamera();
    camera.resetCapture();
    navigate('/');
  };

  const handleRetake = () => {
    camera.resetCapture();
    setPhotoBlob(null);
    setInvoiceNumber('');
    setTransferNumber('');
    setStep('camera');
    camera.startCamera();
  };

  return (
    <Box h="100%" w="100%" bgGradient="linear(135deg, accent.500, primary.500)" display="flex" flexDirection="column" overflow="hidden">
      <Box bg="primary.700" py={4} boxShadow="md" flexShrink={0}>
        <Container maxW="md" display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="md" color="neutral.50">
            Nueva Transferencia
          </Heading>
          <Button
            size="sm"
            variant="outline"
            color="neutral.50"
            borderColor="neutral.50"
            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            onClick={handleCancel}
          >
            Cancelar
          </Button>
        </Container>
      </Box>

      <Box flex="1" overflow="auto">
        {step === 'camera' && (
          <CameraView
            camera={camera}
            onCapture={handleCapture}
          />
        )}

        {step === 'form' && (
          <Container maxW="md" py={6}>
            <VStack spacing={6} align="stretch">
            {camera.capturedImage && (
              <Box
                borderRadius="16px"
                overflow="hidden"
                boxShadow="card"
              >
                <img
                  src={camera.capturedImage}
                  alt="Captured"
                  style={{ width: '100%', display: 'block' }}
                />
              </Box>
            )}

            <Box bg="white" p={6} borderRadius="24px" boxShadow="cardHover">
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel color="neutral.700" fontWeight="semibold">Número de Factura</FormLabel>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Opcional - Se generará automáticamente"
                    size="lg"
                    borderRadius="12px"
                    bg="accent.50"
                    border="none"
                    _focus={{
                      bg: 'white',
                      borderColor: 'accent.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-accent-500)',
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="neutral.700" fontWeight="semibold">
                    Número de Transferencia
                  </FormLabel>
                  <Input
                    value={transferNumber}
                    onChange={(e) => setTransferNumber(e.target.value)}
                    placeholder="Ingresa el número de la transferencia"
                    size="lg"
                    borderRadius="12px"
                    bg="accent.50"
                    border="none"
                    _focus={{
                      bg: 'white',
                      borderColor: 'accent.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-accent-500)',
                    }}
                  />
                </FormControl>

                <VStack w="full" spacing={3} pt={2}>
                  <Button
                    w="full"
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={isUploading}
                    loadingText="Guardando..."
                    bg="accent.500"
                    color="neutral.50"
                    _hover={{ bg: 'accent.600', boxShadow: 'buttonHover' }}
                    _active={{ bg: 'accent.700' }}
                    boxShadow="buttonHover"
                  >
                    Guardar Transferencia
                  </Button>

                  <Button
                    w="full"
                    size="lg"
                    variant="outline"
                    onClick={handleRetake}
                    borderColor="accent.500"
                    color="accent.500"
                    _hover={{ bg: 'accent.50' }}
                  >
                    Tomar otra foto
                  </Button>
                </VStack>
              </VStack>
            </Box>
          </VStack>
        </Container>
        )}
      </Box>

      <Modal isOpen={modalType === 'duplicate'} onClose={handleDuplicateCancel} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="24px" mx={4} overflow="hidden">
          <Box bg="orange.50" textAlign="center" pt={8}>
            <Text fontSize="6xl">⚠️</Text>
          </Box>
          <ModalHeader color="orange.600" fontSize="xl" textAlign="center" pt={4}>
            Transferencia Duplicada
          </ModalHeader>
          <ModalBody textAlign="center" pb={4}>
            <Text fontSize="md" color="neutral.700">
              El número <strong>{transferNumber}</strong> ya existe.
            </Text>
            <Text fontSize="md" color="neutral.600" mt={2}>
              Se guardará como: <strong>{duplicateSuggestedId}</strong>
            </Text>
            <Text fontSize="sm" color="neutral.500" mt={4}>
              ¿Deseas continuar?
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="center" pb={8}>
            <HStack spacing={3}>
              <Button
                size="lg"
                variant="outline"
                onClick={handleDuplicateCancel}
                px={8}
                borderColor="neutral.300"
                color="neutral.600"
              >
                Cancelar
              </Button>
              <Button
                size="lg"
                onClick={handleDuplicateConfirm}
                px={8}
                bg="orange.500"
                color="white"
                _hover={{ bg: 'orange.600' }}
                isLoading={isUploading}
              >
                Sí, guardar
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={modalType === 'success'} onClose={handleSuccessClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="24px" mx={4} overflow="hidden">
          <Box bg="accent.50" textAlign="center" pt={8}>
            <Text fontSize="6xl">✅</Text>
          </Box>
          <ModalHeader color="primary.700" fontSize="2xl" textAlign="center" pt={4}>
            ¡Éxito!
          </ModalHeader>
          <ModalBody textAlign="center" pb={6}>
            <Text fontSize="lg" color="neutral.700">
              La transferencia se guardó correctamente
            </Text>
            {savedTransferNumber && (
              <Text fontSize="md" color="neutral.500" mt={2}>
                Número: <strong>{savedTransferNumber}</strong>
              </Text>
            )}
          </ModalBody>
          <ModalFooter justifyContent="center" pb={8}>
            <Button
              size="lg"
              onClick={handleSuccessClose}
              px={12}
              bg="accent.500"
              color="neutral.50"
              _hover={{ bg: 'accent.600', boxShadow: 'buttonHover' }}
              _active={{ bg: 'accent.700' }}
            >
              Continuar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
