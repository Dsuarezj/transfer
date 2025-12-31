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
          <Box bg="danger.500" color="neutral.50" p={4} borderRadius="16px" boxShadow="card">
            <Text fontWeight="semibold">{camera.error}</Text>
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
            <Box bg="blackAlpha.600" backdropFilter="blur(8px)" px={4} py={2} borderRadius="full">
              <Text color="neutral.50" fontSize="sm" textAlign="center" fontWeight="medium">
                📸 Centra el comprobante de transferencia
              </Text>
            </Box>

            {camera.isActive && (
              <Button
                size="lg"
                w="full"
                maxW="300px"
                bg="accent.500"
                color="neutral.50"
                _hover={{ bg: 'accent.600', boxShadow: 'buttonHover' }}
                _active={{ bg: 'accent.700' }}
                onClick={onCapture}
                boxShadow="buttonHover"
                h="56px"
                fontSize="lg"
                fontWeight="semibold"
              >
                📷 Capturar Foto
              </Button>
            )}
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
