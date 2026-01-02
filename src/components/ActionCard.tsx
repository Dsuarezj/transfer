import { Box, Heading, Text, VStack } from '@chakra-ui/react';

interface ActionCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

export default function ActionCard({ title, description, icon, onClick }: ActionCardProps) {
  return (
    <Box
      as="button"
      w="full"
      p={6}
      borderRadius="24px"
      bgGradient="linear(145deg, white 0%, #f7fafc 100%)"
      boxShadow="2xl"
      border="1px solid"
      borderColor="blue.50"
      _hover={{
        boxShadow: 'cardHover',
        transform: 'translateY(-5px)',
      }}
      _active={{
        transform: 'translateY(-1px)',
      }}
      transition="all 0.2s ease"
      onClick={onClick}
      textAlign="left"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="0"
        right="0"
        w="100px"
        h="100px"
        bg="accent.50"
        borderRadius="full"
        transform="translate(30%, -30%)"
      />
      <VStack align="start" spacing={3} position="relative" zIndex={1}>
        <Box
          fontSize="3xl"
          bgGradient="linear(135deg, accent.50 0%, white 100%)"
          p={3}
          borderRadius="16px"
          boxShadow="lg"
          transition="all 0.2s"
        >
          {icon}
        </Box>
        <Heading size="md" color="primary.700">
          {title}
        </Heading>
        <Text color="neutral.600" fontSize="sm">
          {description}
        </Text>
      </VStack>
    </Box>
  );
}
