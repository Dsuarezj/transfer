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
  Select,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { format, subMonths, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { reportService, Invoice } from '../services/transfer';
import InvoiceCard from '../components/InvoiceCard';

type DateRange = '7days' | '1month' | '2months' | '3months';

export default function ReviewInvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('7days');

  useEffect(() => {
    loadInvoices();
  }, [dateRange]);

  useEffect(() => {
    filterInvoices();
  }, [searchQuery, invoices]);

  const getDateRangeParams = (): { start: Date; end: Date } => {
    const end = new Date();
    let start: Date;

    switch (dateRange) {
      case '7days':
        start = subDays(end, 7);
        break;
      case '1month':
        start = subMonths(end, 1);
        break;
      case '2months':
        start = subMonths(end, 2);
        break;
      case '3months':
        start = subMonths(end, 3);
        break;
      default:
        start = subDays(end, 7);
    }

    return { start, end };
  };

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { start, end } = getDateRangeParams();
      const data = await reportService.getByDateRange(start, end);

      setInvoices(data);
      setFilteredInvoices(data);
    } catch (err) {
      setError('No se pudieron cargar las facturas');
    } finally {
      setIsLoading(false);
    }
  };

  const filterInvoices = () => {
    if (!searchQuery.trim()) {
      setFilteredInvoices(invoices);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = invoices.filter(
      (invoice: Invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.date.includes(query) ||
        (invoice.transferNumber && invoice.transferNumber.toLowerCase().includes(query))
    );

    setFilteredInvoices(filtered);
  };

  const getDateRangeLabel = (): string => {
    const { start, end } = getDateRangeParams();
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
            <HStack spacing={3}>
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
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                size="lg"
                bg="white"
                borderRadius="16px"
                border="none"
                boxShadow="card"
                w="auto"
                minW="130px"
                _focus={{
                  borderColor: 'accent.500',
                  boxShadow: '0 0 0 2px var(--chakra-colors-accent-500)',
                }}
              >
                <option value="7days">7 días</option>
                <option value="1month">1 mes</option>
                <option value="2months">2 meses</option>
                <option value="3months">3 meses</option>
              </Select>
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
