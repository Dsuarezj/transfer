import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Input,
  Text,
  Button,
  SimpleGrid,
  Spinner,
  Center,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { dropboxService, Invoice } from '../services/dropbox.service';
import InvoiceCard from '../components/InvoiceCard';

export default function ReviewInvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchQuery, invoices]);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await dropboxService.getInvoices();
      setInvoices(data);
      setFilteredInvoices(data);
      setError(null);
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
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.date.includes(query) ||
        (invoice.transferNumber && invoice.transferNumber.toLowerCase().includes(query))
    );

    setFilteredInvoices(filtered);
  };

  return (
    <Box h="100%" w="100%" bg="neutral.50" display="flex" flexDirection="column" overflow="hidden">
      <Box bg="white" boxShadow="sm" py={4} flexShrink={0}>
        <Container maxW="md" display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="md" color="primary.600">
            Facturas
          </Heading>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/')}
          >
            Volver
          </Button>
        </Container>
      </Box>

      <Box flex="1" overflow="auto">
        <Container maxW="md" py={6}>
          <VStack spacing={6} align="stretch">
          <InputGroup>
            <InputLeftElement pointerEvents="none" color="neutral.400">
              🔍
            </InputLeftElement>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por factura, transferencia o fecha..."
              size="lg"
              bg="white"
              borderRadius="12px"
              _focus={{
                borderColor: 'primary.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
              }}
            />
          </InputGroup>

          {isLoading && (
            <Center py={12}>
              <Spinner size="xl" color="primary.500" thickness="4px" />
            </Center>
          )}

          {error && (
            <Box bg="danger.50" p={4} borderRadius="12px">
              <Text color="danger.700">{error}</Text>
            </Box>
          )}

          {!isLoading && !error && filteredInvoices.length === 0 && (
            <Center py={12}>
              <VStack spacing={2}>
                <Text fontSize="4xl">📭</Text>
                <Text color="neutral.600" fontSize="lg">
                  {searchQuery ? 'No se encontraron resultados' : 'No hay facturas registradas'}
                </Text>
              </VStack>
            </Center>
          )}

          {!isLoading && filteredInvoices.length > 0 && (
            <>
              <Text color="neutral.600" fontSize="sm">
                {filteredInvoices.length} {filteredInvoices.length === 1 ? 'factura' : 'facturas'}
              </Text>

              <SimpleGrid columns={1} spacing={4}>
                {filteredInvoices.map((invoice, index) => (
                  <InvoiceCard key={index} invoice={invoice} />
                ))}
              </SimpleGrid>
            </>
          )}
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
