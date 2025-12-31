import { useEffect } from 'react';
import { Box, Button, VStack, Text, Container } from '@chakra-ui/react';

interface CameraViewProps {
  camera: {
    videoRef: React.MutableRefObject<HTMLVideoElement | null>;
    isActive: boolean;
    error: string | null;
    startCamera: () => void;
  };
  onCapture: () => void;
}

export default function CameraView({ camera, onCapture }: CameraViewProps) {
  useEffect(() => {
    camera.startCamera();
  }, []);

  return (
    <Box position="relative" minH="calc(100vh - 72px)">
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="black"
      >
        <video
          ref={camera.videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>

      {camera.error && (
        <Container maxW="md" pt={8}>
          <Box bg="danger.500" color="white" p={4} borderRadius="12px">
            <Text>{camera.error}</Text>
          </Box>
        </Container>
      )}

      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        pb={8}
      >
        <Container maxW="md">
          <VStack spacing={4}>
            <Text color="white" fontSize="sm" textAlign="center" px={4}>
              Centra el comprobante de transferencia en la cámara
            </Text>

            {camera.isActive && (
              <Button
                size="lg"
                w="full"
                maxW="300px"
                bg="white"
                color="primary.600"
                _hover={{ bg: 'gray.100' }}
                _active={{ bg: 'gray.200' }}
                onClick={onCapture}
                boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
              >
                Capturar Foto
              </Button>
            )}
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
