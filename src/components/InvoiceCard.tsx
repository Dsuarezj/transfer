import { Box, VStack, HStack, Text, Badge } from '@chakra-ui/react';
import { Invoice } from '../types/dropbox';

interface InvoiceCardProps {
  invoice: Invoice;
}

export default function InvoiceCard({ invoice }: InvoiceCardProps) {
  return (
    <Box
      bg="white"
      p={5}
      borderRadius="16px"
      boxShadow="card"
      _hover={{
        boxShadow: 'cardHover',
      }}
      transition="all 0.2s"
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Text fontWeight="bold" fontSize="lg" color="neutral.800">
            {invoice.invoiceNumber}
          </Text>
          <Badge
            colorScheme="green"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
          >
            Registrada
          </Badge>
        </HStack>

        <VStack align="stretch" spacing={1}>
          <HStack>
            <Text fontSize="sm" color="neutral.500" minW="80px">
              Fecha:
            </Text>
            <Text fontSize="sm" color="neutral.700" fontWeight="medium">
              {invoice.date}
            </Text>
          </HStack>

          <HStack>
            <Text fontSize="sm" color="neutral.500" minW="80px">
              Hora:
            </Text>
            <Text fontSize="sm" color="neutral.700" fontWeight="medium">
              {invoice.time}
            </Text>
          </HStack>

          {invoice.transferNumber && (
            <HStack>
              <Text fontSize="sm" color="neutral.500" minW="80px">
                N° Transf:
              </Text>
              <Text fontSize="sm" color="neutral.700" fontWeight="medium">
                {invoice.transferNumber}
              </Text>
            </HStack>
          )}
        </VStack>

        <Text fontSize="xs" color="neutral.400" isTruncated>
          📁 {invoice.imageUrl}
        </Text>
      </VStack>
    </Box>
  );
}
