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
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { dropboxService } from '../services/dropbox.service';
import CameraView from '../components/CameraView';
import { extractTransferNumber } from '../utils/ocr';

export default function UploadTransferPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const camera = useCamera();

  const [step, setStep] = useState<'camera' | 'form'>('camera');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  const handleCapture = async () => {
    const blob = await camera.capturePhoto();
    if (blob) {
      setPhotoBlob(blob);
      camera.stopCamera();
      setStep('form');

      setIsProcessingOCR(true);
      try {
        const detectedNumber = await extractTransferNumber(blob);
        if (detectedNumber) {
          setTransferNumber(detectedNumber);

          const isDuplicate = await dropboxService.checkDuplicateTransfer(detectedNumber);
          if (isDuplicate) {
            toast({
              title: 'Transferencia duplicada',
              description: `El número ${detectedNumber} ya está registrado`,
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
          }
        }
      } catch (error) {
        console.log('OCR not available or error:', error);
      } finally {
        setIsProcessingOCR(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!invoiceNumber.trim() || !photoBlob) {
      toast({
        title: 'Error',
        description: 'Por favor completa el número de factura',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsUploading(true);

    try {
      const imageUrl = await dropboxService.uploadPhoto(photoBlob, invoiceNumber);
      await dropboxService.updateCSV(invoiceNumber, imageUrl, transferNumber || undefined);

      setShowSuccess(true);
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

  const handleSuccessClose = () => {
    setShowSuccess(false);
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
    <Box h="100%" w="100%" bg="neutral.900" display="flex" flexDirection="column" overflow="hidden">
      <Box bg="primary.600" py={4} boxShadow="md" flexShrink={0}>
        <Container maxW="md" display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="md" color="white">
            Nueva Transferencia
          </Heading>
          <Button
            size="sm"
            variant="outline"
            color="white"
            borderColor="white"
            _hover={{ bg: 'whiteAlpha.200' }}
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
            onCancel={handleCancel}
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

            <Box bg="white" p={6} borderRadius="20px" boxShadow="card">
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel color="neutral.700">Número de Factura</FormLabel>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Ej: F001-123456"
                    size="lg"
                    borderRadius="12px"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="neutral.700">
                    Número de Transferencia
                    {isProcessingOCR && (
                      <Text as="span" fontSize="sm" color="primary.500" ml={2}>
                        (Detectando...)
                      </Text>
                    )}
                  </FormLabel>
                  <Input
                    value={transferNumber}
                    onChange={(e) => setTransferNumber(e.target.value)}
                    placeholder="Opcional - Se detectará automáticamente"
                    size="lg"
                    borderRadius="12px"
                  />
                </FormControl>

                <VStack w="full" spacing={3} pt={2}>
                  <Button
                    w="full"
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={isUploading}
                    loadingText="Guardando..."
                  >
                    Guardar Transferencia
                  </Button>

                  <Button
                    w="full"
                    size="lg"
                    variant="outline"
                    onClick={handleRetake}
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

      <Modal isOpen={showSuccess} onClose={handleSuccessClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="20px" mx={4}>
          <ModalHeader color="success.600" fontSize="2xl" textAlign="center" pt={8}>
            ¡Éxito!
          </ModalHeader>
          <ModalBody textAlign="center" pb={6}>
            <Text fontSize="lg" color="neutral.700">
              La transferencia se guardó correctamente en tu Dropbox
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="center" pb={8}>
            <Button size="lg" onClick={handleSuccessClose} px={12}>
              Continuar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
