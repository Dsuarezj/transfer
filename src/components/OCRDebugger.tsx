import { Badge, Box, Code, HStack, Text, VStack } from '@chakra-ui/react';
import { OCRResult } from '../types/ocr';

interface OCRDebuggerProps {
  result: OCRResult;
}

export default function OCRDebugger({ result }: OCRDebuggerProps) {
  return (
    <VStack align="stretch" spacing={4} bg="gray.50" p={4} borderRadius="md" boxShadow="sm">
      <HStack>
        <Text fontWeight="bold">Resultado:</Text>
        <Badge colorScheme={result.number ? 'green' : 'red'}>{result.number || 'No detectado'}</Badge>
        <Badge colorScheme={result.confidence > 70 ? 'green' : 'orange'}>{result.confidence}% confianza</Badge>
      </HStack>

      {result.bankDetected && (
        <Text fontSize="sm">
          <strong>Banco:</strong> {result.bankDetected}
        </Text>
      )}

      <Text fontSize="sm">
        <strong>Tiempo:</strong> {result.processingTime}ms
      </Text>

      <Box>
        <Text fontSize="sm" fontWeight="bold" mb={2}>
          Texto extraído:
        </Text>
        <Code display="block" p={2} fontSize="xs" whiteSpace="pre-wrap">
          {result.rawText || '(vacío)'}
        </Code>
      </Box>

      {result.region && (
        <Text fontSize="sm" color="gray.600">
          Región detectada: {result.region.x}, {result.region.y} ({result.region.width}x{result.region.height})
        </Text>
      )}
    </VStack>
  );
}

