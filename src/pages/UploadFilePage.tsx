import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Text,
  VStack,
  Container,
  Input,
  useToast,
  Heading,
} from '@chakra-ui/react';
import { fileService } from '../services/transfer/fileService';
import { idService, TransferIds } from '../services/transfer/idService';

export default function UploadFilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [preloadedIds, setPreloadedIds] = useState<TransferIds | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    idService.getAll().then(setPreloadedIds).catch(() => {});
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const validation = fileService.validateImageFile(file);

    if (!validation.isValid) {
      setError(validation.error || 'El archivo no es válido');
      return;
    }

    try {
      const blob = await fileService.fileToBlob(file);
      const imageUrl = URL.createObjectURL(blob);

      navigate('/save', {
        state: {
          imageUrl,
          photoBlob: blob,
          preloadedIds,
          source: 'file',
        },
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo procesar el archivo',
        status: 'error',
        duration: 3000,
      });
    }
  };


  const handleCancel = () => {
    navigate('/');
  };

  return (
    <Box
      h="100%"
      w="100%"
      bgGradient="linear(135deg, accent.500, primary.500)"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      position="relative"
    >
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgGradient="radial(circle at 20% 50%, rgba(255, 255, 255, 0.1), transparent)"
        pointerEvents="none"
      />

      <Box bg="primary.700" boxShadow="md" py={4} flexShrink={0} position="relative" zIndex={1}>
        <Container maxW="md" display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="md" color="neutral.50">
            Subir Archivo
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

      <Container maxW="md" flex="1" display="flex" alignItems="center" py={6} position="relative" zIndex={1}>
        <VStack spacing={6} w="full">
          <VStack spacing={4} w="full">
            <Box
              w="full"
              p={6}
              bg="white"
              borderRadius="20px"
              boxShadow="card"
            >
              <VStack spacing={4}>
                <Text fontSize="lg" fontWeight="semibold" color="primary.700">
                  Selecciona una imagen
                </Text>

                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  display="none"
                  id="file-input"
                />

                <label htmlFor="file-input">
                  <Button
                    as="span"
                    w="full"
                    size="lg"
                    colorScheme="blue"
                    borderRadius="12px"
                    cursor="pointer"
                  >
                    Seleccionar Archivo
                  </Button>
                </label>

                {error && (
                  <Box
                    w="full"
                    p={3}
                    bg="danger.50"
                    borderRadius="8px"
                    border="1px solid"
                    borderColor="danger.200"
                  >
                    <Text fontSize="sm" color="danger.700">
                      {error}
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}

