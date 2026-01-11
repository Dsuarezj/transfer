import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Text,
  SimpleGrid,
  Spinner,
  Center,
  InputGroup,
  InputLeftElement,
  useToast,
} from '@chakra-ui/react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { reportService, Invoice } from '../services/transfer/reportService';
import { dateRangeService } from '../services/transfer/dateRangeService';
import { STORAGE_KEYS } from '../constants/storageKeys';
import TransferCard from '../components/TransferCard';
import PageHeader from '../components/PageHeader';

const getInitialDateRange = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEYS.REVIEW_DATE_RANGE);
    if (saved) {
      const { startDate, endDate } = JSON.parse(saved);
      if (startDate && endDate) {
        return { startDate, endDate };
      }
    }
  } catch {}
  const today = format(new Date(), 'yyyy-MM-dd');
  return { startDate: today, endDate: today };
};

export default function ReviewTransfersPage() {
  const toast = useToast();
  const [transfers, setTransfers] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(() => getInitialDateRange().startDate);
  const [endDate, setEndDate] = useState<string>(() => getInitialDateRange().endDate);

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    const adjustment = dateRangeService.adjustDateRangeOnStartChange(newStartDate, endDate);
    if (adjustment.needsAdjustment && adjustment.adjustedDate) {
      setEndDate(adjustment.adjustedDate);
    }
  };

  const handleEndDateChange = (newEndDate: string) => {
    setEndDate(newEndDate);
    const adjustment = dateRangeService.adjustDateRangeOnEndChange(startDate, newEndDate);
    if (adjustment.needsAdjustment && adjustment.adjustedDate) {
      setStartDate(adjustment.adjustedDate);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      sessionStorage.setItem(
        STORAGE_KEYS.REVIEW_DATE_RANGE,
        JSON.stringify({ startDate, endDate })
      );
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (!startDate || !endDate) {
      return;
    }

    const validationError = dateRangeService.validateCustomDateRange(startDate, endDate);
    if (validationError) {
      if (validationError.includes('3 meses')) {
        return;
      }
      toast({
        title: 'Error de rango',
        description: validationError,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const loadTransfers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { start, end } = dateRangeService.getDateRangeFromStrings(startDate, endDate);
        const data = await reportService.getByDateRange(start, end);

        setTransfers(data);
      } catch (err) {
        setError('No se pudieron cargar las transferencias');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransfers();
  }, [startDate, endDate, toast]);

  const filteredTransfers = !searchQuery.trim()
    ? transfers
    : transfers.filter((transfer: Invoice) => {
        const query = searchQuery.toLowerCase();
        return (
          transfer.invoiceNumber.toLowerCase().includes(query) ||
          transfer.date.includes(query) ||
          (transfer.transferNumber && transfer.transferNumber.toLowerCase().includes(query))
        );
      });

  const getDateRangeLabel = (): string => {
    if (!startDate || !endDate) {
      return '';
    }
    const { start, end } = dateRangeService.getDateRangeFromStrings(startDate, endDate);
    return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM', { locale: es })}`;
  };

  return (
    <Box minH="100vh" w="100%" bgGradient="linear(135deg, accent.500, primary.500)" display="flex" flexDirection="column" position="relative">
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgGradient="radial(circle at 20% 50%, rgba(255, 255, 255, 0.1), transparent)"
        pointerEvents="none"
      />

      <PageHeader title="Transferencias" backPath="/" />

      <Box flex="1" position="relative" zIndex={1}>
        <Container maxW="md" py={4}>
          <VStack spacing={4} align="stretch">
            <Box bg="white" borderRadius="16px" boxShadow="card" p={3}>
              <VStack spacing={2} align="stretch">
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none" color="gray.400" h="32px">
                    🔍
                  </InputLeftElement>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    bg="gray.50"
                    borderRadius="8px"
                    border="1px solid"
                    borderColor="gray.200"
                    h="32px"
                    _focus={{
                      borderColor: 'accent.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-accent-500)',
                      bg: 'white',
                    }}
                  />
                </InputGroup>
                <HStack spacing={2}>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    size="sm"
                    bg="gray.50"
                    borderRadius="8px"
                    border="1px solid"
                    borderColor="gray.200"
                    h="32px"
                    flex={1}
                    min={dateRangeService.getMinStartDateString(endDate)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    _focus={{
                      borderColor: 'accent.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-accent-500)',
                      bg: 'white',
                    }}
                  />
                  <Text color="gray.400" fontSize="xs" flexShrink={0}>
                    →
                  </Text>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    size="sm"
                    bg="gray.50"
                    borderRadius="8px"
                    border="1px solid"
                    borderColor="gray.200"
                    h="32px"
                    flex={1}
                    min={startDate ? format(parse(startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') : ''}
                    max={dateRangeService.getMaxEndDateString(startDate)}
                    _focus={{
                      borderColor: 'accent.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-accent-500)',
                      bg: 'white',
                    }}
                  />
                </HStack>
                {!isLoading && !error && (
                  <Text color="gray.500" fontSize="xs" textAlign="center">
                    {filteredTransfers.length} {filteredTransfers.length === 1 ? 'transferencia' : 'transferencias'} · {getDateRangeLabel()}
                  </Text>
                )}
              </VStack>
            </Box>

          {isLoading && (
            <Center py={12}>
              <Spinner size="xl" color="neutral.50" thickness="4px" />
            </Center>
          )}

          {error && (
            <Box bg="danger.500" color="neutral.50" p={4} borderRadius="16px" boxShadow="card">
              <Text>{error}</Text>
            </Box>
          )}

          {!isLoading && !error && filteredTransfers.length === 0 && (
            <Center py={12}>
              <VStack spacing={2}>
                <Text fontSize="4xl">📭</Text>
                <Text color="neutral.100" fontSize="lg" textAlign="center">
                  {searchQuery ? 'No se encontraron resultados' : 'No hay transferencias en este periodo'}
                </Text>
              </VStack>
            </Center>
          )}

          {!isLoading && filteredTransfers.length > 0 && (
            <SimpleGrid columns={1} spacing={4}>
              {filteredTransfers.map((transfer, index) => (
                <TransferCard key={index} transfer={transfer} />
              ))}
            </SimpleGrid>
          )}
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}

