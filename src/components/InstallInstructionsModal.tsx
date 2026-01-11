import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Box,
  Button,
} from '@chakra-ui/react';

interface InstallInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
}

interface StepProps {
  number: number;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <Box display="flex" alignItems="start" gap={3}>
      <Box
        flexShrink={0}
        w={8}
        h={8}
        borderRadius="full"
        bg="accent.500"
        color="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontWeight="bold"
        fontSize="sm"
      >
        {number}
      </Box>
      <Box flex="1">
        <Text fontWeight="semibold" mb={1}>
          {title}
        </Text>
        <Text fontSize="sm" color="gray.600">
          {description}
        </Text>
      </Box>
    </Box>
  );
}

export default function InstallInstructionsModal({ isOpen, onClose, isIOS }: InstallInstructionsModalProps) {
  if (isIOS) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Instalar en tu dispositivo</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              <Text fontSize="md" color="gray.700">
                Sigue estos pasos para instalar la aplicación en tu pantalla de inicio:
              </Text>

              <VStack spacing={4} align="stretch">
                <Step
                  number={1}
                  title="Abre el menú compartir"
                  description="Toca el botón de compartir en la parte inferior de la pantalla de Safari"
                />
                <Step
                  number={2}
                  title='Selecciona "Agregar a pantalla de inicio"'
                  description='Desplázate hacia abajo en el menú y busca la opción "Agregar a pantalla de inicio"'
                />
                <Step
                  number={3}
                  title="Confirma la instalación"
                  description='Toca "Agregar" para confirmar. El icono aparecerá en tu pantalla de inicio'
                />
              </VStack>

              <Button
                colorScheme="accent"
                onClick={onClose}
                mt={4}
              >
                Entendido
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Instalar aplicación</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            <Text fontSize="md" color="gray.700">
              Para instalar la aplicación en tu dispositivo:
            </Text>

            <VStack spacing={4} align="stretch">
              <Step
                number={1}
                title="Abre el menú del navegador"
                description="Busca el icono de menú (tres puntos) en la esquina superior derecha del navegador"
              />
              <Step
                number={2}
                title='Busca "Instalar" o "Agregar a pantalla de inicio"'
                description='En el menú, busca la opción "Instalar aplicación" o "Agregar a pantalla de inicio"'
              />
              <Step
                number={3}
                title="Confirma la instalación"
                description="Sigue las instrucciones en pantalla para completar la instalación"
              />
            </VStack>

            <Button
              colorScheme="accent"
              onClick={onClose}
              mt={4}
            >
              Entendido
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

