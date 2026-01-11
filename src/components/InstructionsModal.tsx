import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  VStack,
  Heading,
  Text,
  Box,
  Button,
  HStack,
} from '@chakra-ui/react';
import { ReactNode } from 'react';

interface InstructionStep {
  number: number;
  text: string;
}

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  steps: InstructionStep[];
  buttonText?: string;
  children?: ReactNode;
}

export default function InstructionsModal({
  isOpen,
  onClose,
  title,
  subtitle,
  steps,
  buttonText = 'Entendido',
  children,
}: InstructionsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent
        bg="white"
        borderRadius="0"
        maxW="100%"
        maxH="100%"
        m={0}
        display="flex"
        flexDirection="column"
      >
        <ModalCloseButton
          size="lg"
          color="gray.600"
          _hover={{ color: 'gray.800' }}
          top={4}
          right={4}
        />
        <ModalBody
          flex="1"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          px={{ base: 6, md: 12 }}
          py={12}
        >
          <VStack spacing={8} maxW="2xl" w="full" align="stretch">
            <VStack spacing={4} textAlign="center">
              <Heading
                as="h1"
                fontSize={{ base: '2xl', md: '3xl' }}
                color="gray.800"
                fontWeight="bold"
              >
                {title}
              </Heading>
              {subtitle && (
                <Text
                  fontSize={{ base: 'md', md: 'lg' }}
                  color="gray.600"
                >
                  <span dangerouslySetInnerHTML={{ __html: subtitle }} />
                </Text>
              )}
            </VStack>

            <Box
              bg="gray.50"
              p={6}
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.200"
            >
              <VStack spacing={4} align="stretch">
                <Heading
                  as="h2"
                  fontSize={{ base: 'lg', md: 'xl' }}
                  color="gray.800"
                  fontWeight="semibold"
                >
                  Siguientes Pasos
                </Heading>
                <VStack spacing={3} align="stretch" pl={4}>
                  {steps.map((step) => (
                    <HStack key={step.number} align="start" spacing={3}>
                      <Text
                        fontSize="xl"
                        fontWeight="bold"
                        color="primary.500"
                        minW="24px"
                      >
                        {step.number}.
                      </Text>
                      <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.700">
                        {step.text}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </Box>

            {children && (
              <Box>
                {children}
              </Box>
            )}

            <Button
              size="lg"
              w="full"
              bg="primary.500"
              color="white"
              _hover={{ bg: 'primary.600' }}
              _active={{ bg: 'primary.700' }}
              onClick={onClose}
              fontSize={{ base: 'md', md: 'lg' }}
              h={{ base: '48px', md: '56px' }}
              borderRadius="12px"
            >
              {buttonText}
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

