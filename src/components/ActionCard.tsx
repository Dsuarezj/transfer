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
      borderRadius="20px"
      boxShadow="card"
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
    >
      <VStack align="start" spacing={3}>
        <Box fontSize="3xl">{icon}</Box>
        <Heading size="md" color="neutral.800">
          {title}
        </Heading>
        <Text color="neutral.600" fontSize="sm">
          {description}
        </Text>
      </VStack>
    </Box>
  );
}
