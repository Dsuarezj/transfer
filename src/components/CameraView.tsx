import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Container,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  IconButton,
} from '@chakra-ui/react';

interface CameraCapabilities {
  exposureCompensation?: { min: number; max: number; step: number };
  torch?: boolean;
  zoom?: { min: number; max: number; step: number };
}

interface CameraSettings {
  exposureCompensation: number;
  torch: boolean;
  zoom: number;
}

interface CameraViewProps {
  camera: {
    videoRef: React.MutableRefObject<HTMLVideoElement | null>;
    isActive: boolean;
    error: string | null;
    capabilities: CameraCapabilities;
    settings: CameraSettings;
    isCapturing: boolean;
    startCamera: () => void;
    stopCamera: () => void;
    focusOnPoint: (x: number, y: number) => void;
  };
  onCapture: () => void;
}

interface FocusPoint {
  x: number;
  y: number;
  id: number;
}

export default function CameraView({ camera, onCapture }: CameraViewProps) {
  const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);

  useEffect(() => {
    camera.startCamera();
    return () => {
      camera.stopCamera();
    };
  }, []);

  useEffect(() => {
    if (focusPoint) {
      const timer = setTimeout(() => setFocusPoint(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [focusPoint]);

  const handleVideoTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      setFocusPoint({ x: clientX - rect.left, y: clientY - rect.top, id: Date.now() });
      camera.focusOnPoint(x, y);
    },
    [camera]
  );

  return (
    <Box
      position="relative"
      minH="calc(100vh - 64px)"
      maxH="calc(100vh - 64px)"
      overflow="hidden"
      userSelect="none"
      bg="black"
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="black"
        onClick={handleVideoTap}
        onTouchStart={handleVideoTap}
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
            transform: 'translateZ(0)',
          }}
        />

        {focusPoint && (
          <Box
            position="absolute"
            left={`${focusPoint.x}px`}
            top={`${focusPoint.y}px`}
            transform="translate(-50%, -50%)"
            pointerEvents="none"
          >
            <Box
              w="70px"
              h="70px"
              border="2px solid"
              borderColor="yellow.400"
              borderRadius="md"
              animation="focusPulse 0.3s ease-out"
              sx={{
                '@keyframes focusPulse': {
                  '0%': { transform: 'scale(1.5)', opacity: 0 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            />
          </Box>
        )}
      </Box>

      {camera.error && (
        <Container maxW="md" pt={8} position="relative" zIndex={10}>
          <Box bg="danger.500" color="neutral.50" p={4} borderRadius="16px" boxShadow="card">
            <Text fontWeight="semibold">{camera.error}</Text>
          </Box>
        </Container>
      )}

      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        pb="calc(16px + env(safe-area-inset-bottom))"
        zIndex={10}
        bgGradient="linear(to top, blackAlpha.700, transparent)"
      >
        <Container maxW="md">
          <VStack spacing={3}>
            <Box
              bg="blackAlpha.600"
              backdropFilter="blur(10px)"
              px={4}
              py={2}
              borderRadius="full"
              maxW="260px"
            >
              <Text color="neutral.50" fontSize="sm" textAlign="center" fontWeight="medium">
                Toca la pantalla para enfocar
              </Text>
            </Box>

            {camera.isActive && (
              <Button
                size="lg"
                w="full"
                maxW="320px"
                bg="accent.500"
                color="neutral.50"
                _hover={{ bg: 'accent.600', boxShadow: 'buttonHover' }}
                _active={{ bg: 'accent.700' }}
                onClick={onCapture}
                boxShadow="buttonHover"
                h="54px"
                fontSize="md"
                fontWeight="semibold"
                isLoading={camera.isCapturing}
                loadingText="Capturando..."
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
