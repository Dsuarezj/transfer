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
    setExposureCompensation: (value: number) => void;
    setTorch: (enabled: boolean) => void;
    setZoom: (value: number) => void;
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
  const [showControls, setShowControls] = useState(true);

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

  const hasExposureControl = !!camera.capabilities.exposureCompensation;
  const hasTorch = !!camera.capabilities.torch;
  const hasZoom = !!camera.capabilities.zoom;

  // Aproximamos la altura del header en 64px para evitar overflow del botón
  const viewportAvailable = 'calc(100vh - 64px)';

  return (
    <Box position="relative" minH={viewportAvailable} maxH={viewportAvailable} userSelect="none" bg="black" overflow="hidden">
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

      {camera.isActive && showControls && (hasExposureControl || hasTorch || hasZoom) && (
        <Box
          position="absolute"
          top={4}
          right={4}
          zIndex={10}
        >
          <VStack
            spacing={3}
            bg="blackAlpha.700"
            backdropFilter="blur(8px)"
            p={3}
            borderRadius="xl"
            align="stretch"
            minW="180px"
          >
            {hasExposureControl && (
              <VStack spacing={1} align="stretch">
                <HStack justify="space-between">
                  <Text color="neutral.50" fontSize="xs" fontWeight="medium">
                    Brillo
                  </Text>
                  <Text color="neutral.300" fontSize="xs">
                    {camera.settings.exposureCompensation > 0 ? '+' : ''}
                    {camera.settings.exposureCompensation.toFixed(1)}
                  </Text>
                </HStack>
                <Slider
                  min={camera.capabilities.exposureCompensation!.min}
                  max={camera.capabilities.exposureCompensation!.max}
                  step={camera.capabilities.exposureCompensation!.step}
                  value={camera.settings.exposureCompensation}
                  onChange={camera.setExposureCompensation}
                  size="sm"
                >
                  <SliderTrack bg="whiteAlpha.300">
                    <SliderFilledTrack bg="yellow.400" />
                  </SliderTrack>
                  <SliderThumb boxSize={4} bg="yellow.400" />
                </Slider>
              </VStack>
            )}

            {hasZoom && (
              <VStack spacing={1} align="stretch">
                <HStack justify="space-between">
                  <Text color="neutral.50" fontSize="xs" fontWeight="medium">
                    Zoom
                  </Text>
                  <Text color="neutral.300" fontSize="xs">
                    {camera.settings.zoom.toFixed(1)}x
                  </Text>
                </HStack>
                <Slider
                  min={camera.capabilities.zoom!.min}
                  max={Math.min(camera.capabilities.zoom!.max, 5)}
                  step={camera.capabilities.zoom!.step}
                  value={camera.settings.zoom}
                  onChange={camera.setZoom}
                  size="sm"
                >
                  <SliderTrack bg="whiteAlpha.300">
                    <SliderFilledTrack bg="blue.400" />
                  </SliderTrack>
                  <SliderThumb boxSize={4} bg="blue.400" />
                </Slider>
              </VStack>
            )}

            {hasTorch && (
              <Button
                size="sm"
                variant={camera.settings.torch ? 'solid' : 'outline'}
                colorScheme="yellow"
                onClick={() => camera.setTorch(!camera.settings.torch)}
                leftIcon={
                  <Text>{camera.settings.torch ? 'ON' : 'OFF'}</Text>
                }
              >
                Linterna
              </Button>
            )}
          </VStack>
        </Box>
      )}

      {camera.isActive && (
        <IconButton
          aria-label="Toggle controls"
          position="absolute"
          top={4}
          left={4}
          zIndex={10}
          size="sm"
          bg="blackAlpha.600"
          color="white"
          _hover={{ bg: 'blackAlpha.700' }}
          onClick={() => setShowControls(!showControls)}
          icon={<Text fontSize="lg">{showControls ? '[-]' : '[+]'}</Text>}
        />
      )}

      <Box
        position="absolute"
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
