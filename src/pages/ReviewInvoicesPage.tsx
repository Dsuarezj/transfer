import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Input,
  Text,
  Button,
  SimpleGrid,
  Spinner,
  Center,
  InputGroup,
  InputLeftElement,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { reportService, Invoice } from '../services/transfer/reportService';
import { dateRangeService } from '../services/transfer/dateRangeService';
import InvoiceCard from '../components/InvoiceCard';

export default function ReviewInvoicesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));

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

    const loadInvoices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { start, end } = dateRangeService.getDateRangeFromStrings(startDate, endDate);
        const data = await reportService.getByDateRange(start, end);

        setInvoices(data);
      } catch (err) {
        setError('No se pudieron cargar las facturas');
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, [startDate, endDate, toast]);

  const filteredInvoices = !searchQuery.trim()
    ? invoices
    : invoices.filter((invoice: Invoice) => {
        const query = searchQuery.toLowerCase();
        return (
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          invoice.date.includes(query) ||
          (invoice.transferNumber && invoice.transferNumber.toLowerCase().includes(query))
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
    <Box h="100%" w="100%" bgGradient="linear(135deg, accent.500, primary.500)" display="flex" flexDirection="column" overflow="hidden" position="relative">
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
            Facturas
          </Heading>
          <Button
            size="sm"
            variant="outline"
            color="neutral.50"
            borderColor="neutral.50"
            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            onClick={() => navigate('/')}
          >
            Volver
          </Button>
        </Container>
      </Box>

      <Box flex="1" overflow="auto" position="relative" zIndex={1}>
        <Container maxW="md" py={6}>
          <VStack spacing={4} align="stretch">
            <InputGroup flex={1}>
              <InputLeftElement pointerEvents="none" color="neutral.400">
                🔍
              </InputLeftElement>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                size="lg"
                bg="white"
                borderRadius="16px"
                border="none"
                boxShadow="card"
                _focus={{
                  borderColor: 'accent.500',
                  boxShadow: '0 0 0 2px var(--chakra-colors-accent-500)',
                }}
              />
            </InputGroup>

            <HStack spacing={3}>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                size="lg"
                bg="white"
                borderRadius="16px"
                border="none"
                boxShadow="card"
                min={dateRangeService.getMinStartDateString(endDate)}
                max={format(new Date(), 'yyyy-MM-dd')}
                _focus={{
                  borderColor: 'accent.500',
                  boxShadow: '0 0 0 2px var(--chakra-colors-accent-500)',
                }}
              />
              <Text color="neutral.100" fontSize="sm" opacity={0.8}>
                hasta
              </Text>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                size="lg"
                bg="white"
                borderRadius="16px"
                border="none"
                boxShadow="card"
                min={startDate ? format(parse(startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') : ''}
                max={dateRangeService.getMaxEndDateString(startDate)}
                _focus={{
                  borderColor: 'accent.500',
                  boxShadow: '0 0 0 2px var(--chakra-colors-accent-500)',
                }}
              />
            </HStack>

            {!isLoading && !error && (
              <Text color="neutral.100" fontSize="sm" opacity={0.8}>
                {filteredInvoices.length} {filteredInvoices.length === 1 ? 'factura' : 'facturas'} · {getDateRangeLabel()}
              </Text>
            )}

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

          {!isLoading && !error && filteredInvoices.length === 0 && (
            <Center py={12}>
              <VStack spacing={2}>
                <Text fontSize="4xl">📭</Text>
                <Text color="neutral.100" fontSize="lg" textAlign="center">
                  {searchQuery ? 'No se encontraron resultados' : 'No hay facturas en este periodo'}
                </Text>
              </VStack>
            </Center>
          )}

          {!isLoading && filteredInvoices.length > 0 && (
            <SimpleGrid columns={1} spacing={4}>
              {filteredInvoices.map((invoice, index) => (
                <InvoiceCard key={index} invoice={invoice} />
              ))}
            </SimpleGrid>
          )}
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
