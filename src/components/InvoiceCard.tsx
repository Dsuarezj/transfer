import { Box, VStack, HStack, Text, Badge, Link } from '@chakra-ui/react';
import { Invoice } from '../types/dropbox';

interface InvoiceCardProps {
  invoice: Invoice;
}

export default function InvoiceCard({ invoice }: InvoiceCardProps) {
  return (
    <Box
      bg="white"
      p={5}
      borderRadius="20px"
      boxShadow="medium"
      _hover={{
        boxShadow: 'cardHover',
        transform: 'translateY(-2px)',
      }}
      transition="all 0.2s"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="0"
        left="0"
        w="4px"
        h="100%"
        bg="accent.500"
      />
      <VStack align="stretch" spacing={3} pl={2}>
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <Text fontWeight="bold" fontSize="lg" color="primary.700">
            {invoice.invoiceNumber}
          </Text>
          <Badge
            bg="accent.100"
            color="primary.700"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
            fontWeight="semibold"
          >
            ✓ Registrada
          </Badge>
        </HStack>

        <VStack align="stretch" spacing={1} bg="accent.50" p={3} borderRadius="12px">
          <HStack>
            <Text fontSize="sm" color="neutral.600" minW="80px" fontWeight="medium">
              📅 Fecha:
            </Text>
            <Text fontSize="sm" color="neutral.700" fontWeight="semibold">
              {invoice.date}
            </Text>
          </HStack>

          <HStack>
            <Text fontSize="sm" color="neutral.600" minW="80px" fontWeight="medium">
              🕐 Hora:
            </Text>
            <Text fontSize="sm" color="neutral.700" fontWeight="semibold">
              {invoice.time}
            </Text>
          </HStack>

          {invoice.transferNumber && (
            <HStack>
              <Text fontSize="sm" color="neutral.600" minW="80px" fontWeight="medium">
                🔢 N° Transf:
              </Text>
              <Text fontSize="sm" color="neutral.700" fontWeight="semibold">
                {invoice.transferNumber}
              </Text>
            </HStack>
          )}
        </VStack>

        <Link
          href={invoice.imageUrl}
          isExternal
          color="accent.600"
          fontSize="xs"
          fontWeight="semibold"
          _hover={{ color: 'accent.700', textDecoration: 'underline' }}
        >
          🔗 Ver archivo
        </Link>
      </VStack>
    </Box>
  );
}
