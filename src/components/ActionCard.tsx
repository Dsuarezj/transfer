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
      boxShadow="0 10px 40px rgba(0,0,0,0.2)"
      _hover={{
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
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
        bg="purple.50"
        borderRadius="full"
        transform="translate(30%, -30%)"
      />
      <VStack align="start" spacing={3} position="relative" zIndex={1}>
        <Box
          fontSize="3xl"
          bg="purple.50"
          p={3}
          borderRadius="16px"
          transition="all 0.2s"
        >
          {icon}
        </Box>
        <Heading size="md" color="purple.700">
          {title}
        </Heading>
        <Text color="neutral.600" fontSize="sm">
          {description}
        </Text>
      </VStack>
    </Box>
  );
}
