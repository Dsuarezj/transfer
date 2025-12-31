import { useMemo, useState } from 'react';
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
import { invoiceService } from '../services/invoiceService';
import CameraView from '../components/CameraView';
import { OCREngine } from '../utils/ocr';
import { localLearningService } from '../services/localLearningService';
import { OCRResult } from '../types/ocr';

export default function UploadTransferPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const camera = useCamera();
  const ocrEngine = useMemo(() => new OCREngine(), []);

  const [step, setStep] = useState<'camera' | 'form'>('camera');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  const handleCapture = async () => {
    const blob = await camera.capturePhoto();
    if (blob) {
      setPhotoBlob(blob);
      camera.stopCamera();
      setStep('form');

      setIsProcessingOCR(true);
      try {
        const result = await ocrEngine.extractTransferNumber(blob);
        setOcrResult(result);

        if (result.number) {
          console.log('[Upload] OCR detectó número', result.number, 'confianza', result.confidence);
          setTransferNumber(result.number);

          const isDuplicate = await invoiceService.checkDuplicate(result.number);
          if (isDuplicate) {
            toast({
              title: 'Transferencia duplicada',
              description: `El número ${result.number} ya está registrado`,
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
          } else {
            toast({
              title: 'Número detectado',
              description: `Confianza: ${result.confidence}%`,
              status: 'info',
              duration: 3000,
            });
          }
        } else {
          console.log('[Upload] OCR no encontró número. Confianza', result.confidence, 'Banco detectado', result.bankDetected);
        }
      } catch (error) {
        console.error('[Upload] OCR error:', error);
      } finally {
        setIsProcessingOCR(false);
      }
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

    setIsUploading(true);
    const finalInvoiceNumber = invoiceNumber.trim() || 'SIN-FACTURA';

    try {
      const userNumber = transferNumber.trim();

      // Aprendizaje local si el usuario corrige el número detectado
      if (ocrResult?.number && userNumber && ocrResult.number !== userNumber) {
        await localLearningService.learnFromCorrection({
          ocrResult,
          correctNumber: userNumber,
          bankId: ocrResult.bankDetected || 'generic',
        });
      }

      const imageUrl = await invoiceService.uploadPhoto(photoBlob, finalInvoiceNumber);
      await invoiceService.add(finalInvoiceNumber, imageUrl, userNumber || undefined);

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
                    {isProcessingOCR && (
                      <Text as="span" fontSize="sm" color="accent.500" ml={2}>
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

      <Modal isOpen={showSuccess} onClose={handleSuccessClose} isCentered>
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
              La transferencia se guardó correctamente en tu Dropbox
            </Text>
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
