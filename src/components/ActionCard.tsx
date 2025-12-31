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
      bg="white"
      p={6}
      borderRadius="24px"
      boxShadow="medium"
      _hover={{
        boxShadow: 'cardHover',
        transform: 'translateY(-4px)',
      }}
      _active={{
        transform: 'translateY(0)',
      }}
      transition="all 0.3s"
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
          bg="accent.50"
          p={3}
          borderRadius="16px"
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
