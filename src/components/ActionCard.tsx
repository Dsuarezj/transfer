import { Box, Heading, Text, VStack, Flex } from '@chakra-ui/react';

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
      p={4}
      borderRadius="16px"
      bgGradient="linear(145deg, white 0%, #f7fafc 100%)"
      boxShadow="lg"
      border="1px solid"
      borderColor="blue.50"
      _hover={{
        boxShadow: 'cardHover',
        transform: 'translateY(-2px)',
      }}
      _active={{
        transform: 'translateY(0px)',
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
        w="60px"
        h="60px"
        bg="accent.50"
        borderRadius="full"
        transform="translate(20%, -20%)"
      />
      <Flex align="center" gap={3} position="relative" zIndex={1}>
        <Box
          fontSize="2xl"
          bgGradient="linear(135deg, accent.50 0%, white 100%)"
          p={2.5}
          borderRadius="10px"
          boxShadow="sm"
          transition="all 0.2s"
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {icon}
        </Box>
        <VStack align="start" spacing={1} flex="1">
          <Heading size="sm" color="primary.700">
            {title}
          </Heading>
          <Text color="neutral.600" fontSize="xs">
            {description}
          </Text>
        </VStack>
      </Flex>
    </Box>
  );
}
