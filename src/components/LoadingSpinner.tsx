import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  message = 'Cargando...', 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const content = (
    <VStack spacing={4}>
      <Spinner
        size="xl"
        thickness="4px"
        speed="0.8s"
        color="primary.500"
        emptyColor="neutral.200"
      />
      <Text color="neutral.600" fontSize="lg" fontWeight="medium">
        {message}
      </Text>
    </VStack>
  );

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

