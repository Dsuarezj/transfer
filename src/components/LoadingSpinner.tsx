import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

export default function LoadingSpinner({ 
  message = 'Cargando...', 
  fullScreen = false,
  overlay = false,
}: LoadingSpinnerProps) {
  const content = (
    <VStack spacing={3}>
      <Spinner
        size="lg"
        thickness="3px"
        speed="0.8s"
        color="primary.500"
        emptyColor="neutral.200"
      />
      <Text color="neutral.600" fontSize="md" fontWeight="medium">
        {message}
      </Text>
    </VStack>
  );

  if (overlay) {
    return (
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.400"
        backdropFilter="blur(2px)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={1000}
        borderRadius="inherit"
      >
        <Box
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="xl"
        >
          {content}
        </Box>
      </Box>
    );
  }

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="neutral.50"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={9999}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={12}
    >
      {content}
    </Box>
  );
}

