import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { OCREngine } from '../utils/ocr';
import OCRDebugger from '../components/OCRDebugger';
import { localLearningService } from '../services/localLearningService';
import { OCRResult } from '../types/ocr';
import banksData from '../config/banksData.json';

export default function TestOCRPage() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [correctNumber, setCorrectNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('generic');
  const [history, setHistory] = useState<OCRResult[]>([]);

  const ocrEngine = useMemo(() => new OCREngine(), []);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (picked) {
      setFile(picked);
      const url = URL.createObjectURL(picked);
      setImageUrl(url);
      setOcrResult(null);
      setCorrectNumber('');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const result = await ocrEngine.extractTransferNumber(file);
      setOcrResult(result);
      setSelectedBank(result.bankDetected || 'generic');
      setHistory((prev) => [result, ...prev].slice(0, 5));
      setCorrectNumber(result.number || '');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error analizando la imagen',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!ocrResult || !correctNumber.trim()) return;
    const learned = await localLearningService.learnFromCorrection({
      ocrResult,
      correctNumber: correctNumber.trim(),
      bankId: selectedBank || 'generic',
    });
    if (learned) {
      toast({
        title: 'Aprendizaje local',
        description: 'Se agregó un patrón para mejorar futuras detecciones',
        status: 'success',
        duration: 2500,
      });
    } else {
      toast({
        title: 'No se pudo aprender',
        description: 'No se encontró el número en el texto extraído',
        status: 'warning',
        duration: 2500,
      });
    }
  };

  return (
    <Box bg="neutral.900" minH="100vh" py={6}>
      <Container maxW="4xl">
        <Stack direction="row" align="center" justify="space-between" mb={6}>
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              Test OCR
            </Text>
            <Text color="neutral.200">Sube imágenes locales para depurar la detección</Text>
          </Box>
          <Badge colorScheme="purple" variant="solid">
            Laboratorio
          </Badge>
        </Stack>

        <Stack spacing={6} bg="white" p={6} borderRadius="16px" boxShadow="lg">
          <FormControl>
            <FormLabel>Imagen de comprobante</FormLabel>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
          </FormControl>

          {imageUrl && (
            <Box border="1px solid" borderColor="gray.200" borderRadius="12px" overflow="hidden">
              <img src={imageUrl} alt="Preview" style={{ width: '100%', display: 'block' }} />
            </Box>
          )}

          <HStack spacing={4}>
            <Button onClick={handleAnalyze} isLoading={isProcessing} colorScheme="blue" isDisabled={!file}>
              Analizar
            </Button>
            {ocrResult && (
              <Text fontSize="sm" color="gray.600">
                Confianza: {ocrResult.confidence}%
              </Text>
            )}
          </HStack>

          {ocrResult && (
            <Stack spacing={4} borderTop="1px solid" borderColor="gray.100" pt={4}>
              <FormControl>
                <FormLabel>Número correcto</FormLabel>
                <Input value={correctNumber} onChange={(e) => setCorrectNumber(e.target.value)} placeholder="Editar número" />
              </FormControl>

              <FormControl>
                <FormLabel>Banco</FormLabel>
                <Select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                  {banksData.banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <Button onClick={handleSaveCorrection} colorScheme="green">
                Guardar corrección (aprendizaje local)
              </Button>

              <OCRDebugger result={ocrResult} />
            </Stack>
          )}

          {history.length > 0 && (
            <Box>
              <Text fontWeight="bold" mb={2}>
                Últimos resultados
              </Text>
              <Stack spacing={2}>
                {history.map((item, idx) => (
                  <HStack key={`${item.rawText}-${idx}`} spacing={3} fontSize="sm">
                    <Badge colorScheme={item.number ? 'green' : 'red'}>{item.number || 'No detectado'}</Badge>
                    <Text color="gray.600">Confianza: {item.confidence}%</Text>
                    {item.bankDetected && <Badge colorScheme="purple">{item.bankDetected}</Badge>}
                  </HStack>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

