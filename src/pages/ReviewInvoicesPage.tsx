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
import { invoiceService } from '../services/invoiceService';
import { Invoice } from '../types/dropbox';
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
      const data = await invoiceService.getAll();
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
    <Box h="100%" w="100%" bgGradient="linear(135deg, secondary.300, pastel.blue.400)" display="flex" flexDirection="column" overflow="hidden" position="relative">
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgGradient="radial(circle at 20% 50%, whiteAlpha.200, transparent)"
        pointerEvents="none"
      />

      <Box bg="accent.700" boxShadow="md" py={4} flexShrink={0} position="relative" zIndex={1}>
        <Container maxW="md" display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="md" color="white">
            Facturas
          </Heading>
          <Button
            size="sm"
            variant="outline"
            color="white"
            borderColor="white"
            _hover={{ bg: 'whiteAlpha.200' }}
            onClick={() => navigate('/')}
          >
            Volver
          </Button>
        </Container>
      </Box>

      <Box flex="1" overflow="auto" position="relative" zIndex={1}>
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
              borderRadius="16px"
              border="none"
              boxShadow="card"
              _focus={{
                borderColor: 'accent.500',
                boxShadow: '0 0 0 2px var(--chakra-colors-accent-500)',
              }}
            />
          </InputGroup>

          {isLoading && (
            <Center py={12}>
              <Spinner size="xl" color="white" thickness="4px" />
            </Center>
          )}

          {error && (
            <Box bg="danger.500" color="white" p={4} borderRadius="16px" boxShadow="card">
              <Text>{error}</Text>
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
              <Box bg="whiteAlpha.200" px={4} py={2} borderRadius="full" alignSelf="flex-start">
                <Text color="white" fontSize="sm" fontWeight="semibold">
                  {filteredInvoices.length} {filteredInvoices.length === 1 ? 'factura' : 'facturas'}
                </Text>
              </Box>

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
