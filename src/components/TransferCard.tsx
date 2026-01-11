import { useNavigate } from 'react-router-dom';
import { Box, VStack, HStack, Text, Badge } from '@chakra-ui/react';
import { Invoice } from '../types/dropbox';

interface TransferCardProps {
  transfer: Invoice;
}

export default function TransferCard({ transfer }: TransferCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/save', {
      state: {
        editTransfer: transfer,
      },
    });
  };

  return (
    <Box
      bg="white"
      p={5}
      borderRadius="20px"
      boxShadow="medium"
      _hover={{
        boxShadow: 'cardHover',
        transform: 'translateY(-2px)',
        cursor: 'pointer',
      }}
      transition="all 0.2s"
      position="relative"
      overflow="hidden"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
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
            {transfer.invoiceNumber}
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
              {transfer.date}
            </Text>
          </HStack>

          <HStack>
            <Text fontSize="sm" color="neutral.600" minW="80px" fontWeight="medium">
              🕐 Hora:
            </Text>
            <Text fontSize="sm" color="neutral.700" fontWeight="semibold">
              {transfer.time}
            </Text>
          </HStack>

          {transfer.transferNumber && (
            <HStack>
              <Text fontSize="sm" color="neutral.600" minW="80px" fontWeight="medium">
                🔢 N° Transf:
              </Text>
              <Text fontSize="sm" color="neutral.700" fontWeight="semibold">
                {transfer.transferNumber}
              </Text>
            </HStack>
          )}
        </VStack>

        <Text
          color="accent.600"
          fontSize="xs"
          fontWeight="semibold"
        >
          ✏️ Toca para ver o editar
        </Text>
      </VStack>
    </Box>
  );
}
