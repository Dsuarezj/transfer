import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Text, VStack, Container } from '@chakra-ui/react';
import { useCamera } from '../hooks/useCamera';

export default function UploadTransferPage() {
  const navigate = useNavigate();
  const camera = useCamera();

  useEffect(() => {
    camera.startCamera();
    return () => {
      camera.stopCamera();
    };
  }, []);

  const handleCapture = async () => {
    const blob = await camera.capturePhoto();
    if (blob) {
      // Crear URL directamente del blob (no depender del estado async)
      const imageUrl = URL.createObjectURL(blob);
      camera.stopCamera();
      // Navegar a la página de guardado con la imagen
      navigate('/save', {
        state: {
          imageUrl,
          photoBlob: blob,
        },
      });
    }
  };

  const handleCancel = () => {
    camera.stopCamera();
    navigate('/');
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="black"
      overflow="hidden"
    >
      {/* Video de la cámara */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
      >
        <video
          ref={camera.videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>

      {/* Error */}
      {camera.error && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="red.500"
          color="white"
          p={4}
          borderRadius="12px"
          textAlign="center"
          maxW="300px"
        >
          <Text fontWeight="bold">{camera.error}</Text>
        </Box>
      )}

      {/* Controles */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        pb="calc(24px + env(safe-area-inset-bottom))"
        pt={4}
        bgGradient="linear(to top, blackAlpha.800, transparent)"
      >
        <Container maxW="md">
          <VStack spacing={3}>
            <Box
              bg="blackAlpha.600"
              px={4}
              py={2}
              borderRadius="full"
            >
              <Text color="white" fontSize="sm" textAlign="center">
                Toca la pantalla para enfocar
              </Text>
            </Box>

            {camera.isActive && (
              <Button
                w="full"
                maxW="300px"
                size="lg"
                colorScheme="blue"
                onClick={handleCapture}
                isLoading={camera.isCapturing}
                loadingText="Capturando..."
                borderRadius="12px"
                h="54px"
              >
                Capturar Foto
              </Button>
            )}

            <Button
              variant="ghost"
              color="white"
              onClick={handleCancel}
              _hover={{ bg: 'whiteAlpha.200' }}
            >
              Cancelar
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
