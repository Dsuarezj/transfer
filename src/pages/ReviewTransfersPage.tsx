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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@chakra-ui/react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { reportService, Invoice } from '../services/transfer/reportService';
import { dateRangeService } from '../services/transfer/dateRangeService';
import { exportService } from '../services/transfer/exportService';
import { useTransferDelete } from '../hooks/useTransferDelete';
import { idService } from '../services/transfer/idService';
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
  const { deleteTransfer } = useTransferDelete();
  const [transfers, setTransfers] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(() => getInitialDateRange().startDate);
  const [endDate, setEndDate] = useState<string>(() => getInitialDateRange().endDate);
  const [transferToDelete, setTransferToDelete] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = (transfer: Invoice) => {
    setTransferToDelete(transfer);
  };

  const handleDeleteConfirm = async () => {
    if (!transferToDelete) return;

    setIsDeleting(true);
    try {
      const loadedIds = await idService.getAll();
      await deleteTransfer({
        date: transferToDelete.date,
        time: transferToDelete.time,
        imageUrl: transferToDelete.imageUrl,
        transferNumber: transferToDelete.transferNumber,
        loadedIds,
      });

      setTransfers(transfers.filter(t =>
        !(t.date === transferToDelete.date &&
          t.time === transferToDelete.time &&
          t.imageUrl === transferToDelete.imageUrl)
      ));

      setTransferToDelete(null);
      toast({
        title: 'Eliminado',
        description: 'Transferencia eliminada correctamente',
        status: 'success',
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la transferencia',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setTransferToDelete(null);
  };

  const downloadCSV = () => {
    if (filteredTransfers.length === 0) {
      toast({ title: 'Sin datos', description: 'No hay transferencias para exportar', status: 'warning', duration: 3000 });
      return;
    }

    const content = exportService.generateCSV(filteredTransfers);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transferencias_${startDate}_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Descargado', description: 'Reporte CSV descargado', status: 'success', duration: 2000 });
  };

  const downloadPDF = () => {
    if (filteredTransfers.length === 0) {
      toast({ title: 'Sin datos', description: 'No hay transferencias para exportar', status: 'warning', duration: 3000 });
      return;
    }

    const html = exportService.generatePDFHTML(filteredTransfers, getDateRangeLabel());
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      const cleanup = () => {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      
      printWindow.addEventListener('load', () => {
        printWindow.print();
        cleanup();
      });
      
      printWindow.addEventListener('beforeunload', cleanup);
    }
  };

  return (
    <Box minH="100vh" w="100%" position="relative" overflow="hidden">
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bgGradient="linear(135deg, accent.500, primary.500)"
        zIndex={0}
      />
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgGradient="radial(circle at 20% 50%, rgba(255, 255, 255, 0.1), transparent)"
        pointerEvents="none"
        zIndex={0}
      />

      <Box
        position="relative"
        zIndex={1}
        minH="100vh"
        display="flex"
        flexDirection="column"
      >
        <PageHeader title="Transferencias" backPath="/" />

        <Box flex="1">
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
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label="Descargar reporte"
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      }
                      size="sm"
                      h="32px"
                      w="32px"
                      minW="32px"
                      bg="accent.500"
                      color="white"
                      borderRadius="8px"
                      _hover={{ bg: 'accent.600' }}
                      _active={{ bg: 'accent.700' }}
                      isDisabled={filteredTransfers.length === 0}
                    />
                    <MenuList w="max-content" minW="auto" borderRadius="12px" boxShadow="lg" py={2} px={1}>
                      <Text px={3} py={1} fontSize="xs" color="gray.500" fontWeight="medium">
                        Descargar reporte
                      </Text>
                      <MenuItem
                        onClick={downloadCSV}
                        borderRadius="8px"
                        _hover={{ bg: 'gray.100' }}
                      >
                        <HStack spacing={2}>
                          <Text>📊</Text>
                          <Text>CSV (Excel)</Text>
                        </HStack>
                      </MenuItem>
                      <MenuItem
                        onClick={downloadPDF}
                        borderRadius="8px"
                        _hover={{ bg: 'gray.100' }}
                      >
                        <HStack spacing={2}>
                          <Text>📄</Text>
                          <Text>PDF (Imprimir)</Text>
                        </HStack>
                      </MenuItem>
                    </MenuList>
                  </Menu>
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
                <TransferCard key={index} transfer={transfer} onDelete={handleDelete} />
              ))}
            </SimpleGrid>
          )}
          </VStack>
        </Container>
        </Box>
      </Box>

      <Modal isOpen={!!transferToDelete} onClose={handleDeleteCancel} isCentered>
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent borderRadius="20px" mx={4}>
          <ModalHeader textAlign="center" pt={6} color="red.600">
            ⚠️ Eliminar Transferencia
          </ModalHeader>
          <ModalBody textAlign="center">
            <VStack spacing={3}>
              <Text>¿Estás seguro de que deseas eliminar esta transferencia?</Text>
              {transferToDelete && (
                <Box bg="gray.50" p={4} borderRadius="12px" w="100%">
                  <VStack align="stretch" spacing={2}>
                    <HStack>
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">Comprobante:</Text>
                      <Text fontSize="sm" fontWeight="semibold">{transferToDelete.invoiceNumber}</Text>
                    </HStack>
                    <HStack>
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">Fecha:</Text>
                      <Text fontSize="sm" fontWeight="semibold">{transferToDelete.date} {transferToDelete.time}</Text>
                    </HStack>
                    {transferToDelete.transferNumber && (
                      <HStack>
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">N° Transferencia:</Text>
                        <Text fontSize="sm" fontWeight="semibold">{transferToDelete.transferNumber}</Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              )}
              <Text fontSize="xs" color="gray.500">
                Esta acción no se puede deshacer. Se eliminará el registro, la imagen y el número de transferencia.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="center" pb={6}>
            <HStack spacing={3}>
              <Button variant="outline" onClick={handleDeleteCancel} isDisabled={isDeleting}>
                Cancelar
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
                loadingText="Eliminando..."
              >
                Eliminar
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

