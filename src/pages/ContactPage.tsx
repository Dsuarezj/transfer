import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Link,
  HStack,
  Button,
  ButtonGroup,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

function ArrowBackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

const content = {
  es: {
    back: 'Volver',
    title: 'Contacto',
    subtitle: '¿Necesitas ayuda? Estamos aquí para ti',
    description: 'Si tienes alguna pregunta, sugerencia o necesitas soporte, no dudes en contactarnos.',
    email: {
      title: 'Correo electrónico',
      address: 'help@transferidoya.com',
      text: 'Escríbenos a:',
    },
  },
  en: {
    back: 'Back',
    title: 'Contact',
    subtitle: 'Need help? We are here for you',
    description: 'If you have any questions, suggestions, or need support, please do not hesitate to contact us.',
    email: {
      title: 'Email',
      address: 'help@transferidoya.com',
      text: 'Write to us at:',
    },
  },
};

type Language = 'es' | 'en';

export default function ContactPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language>('es');
  const t = content[lang];

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="gray.50"
      overflowY="auto"
      overflowX="hidden"
    >
      <Box
        position="sticky"
        top={0}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        py={3}
        px={4}
        zIndex={10}
      >
        <Container maxW="4xl">
          <HStack justify="space-between">
            <Button
              aria-label={t.back}
              leftIcon={<ArrowBackIcon />}
              variant="ghost"
              onClick={handleBack}
              size="sm"
            >
              {t.back}
            </Button>
            <ButtonGroup size="sm" isAttached variant="outline">
              <Button
                onClick={() => setLang('es')}
                bg={lang === 'es' ? 'blue.500' : 'transparent'}
                color={lang === 'es' ? 'white' : 'gray.600'}
                _hover={{ bg: lang === 'es' ? 'blue.600' : 'gray.100' }}
              >
                ES
              </Button>
              <Button
                onClick={() => setLang('en')}
                bg={lang === 'en' ? 'blue.500' : 'transparent'}
                color={lang === 'en' ? 'white' : 'gray.600'}
                _hover={{ bg: lang === 'en' ? 'blue.600' : 'gray.100' }}
              >
                EN
              </Button>
            </ButtonGroup>
          </HStack>
        </Container>
      </Box>

      <Container maxW="4xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Heading as="h1" size="xl" color="gray.800">
            {t.title}
          </Heading>

          <Text color="gray.600" fontSize="lg">
            {t.subtitle}
          </Text>

          <Text color="gray.700" lineHeight="tall">
            {t.description}
          </Text>

          <Box
            bg="white"
            p={6}
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
            boxShadow="sm"
          >
            <VStack spacing={4} align="stretch">
              <Heading as="h2" size="md" color="gray.800">
                {t.email.title}
              </Heading>
              <Text color="gray.700" lineHeight="tall">
                {t.email.text}{' '}
                <Link href={`mailto:${t.email.address}`} color="blue.500" fontWeight="medium">
                  {t.email.address}
                </Link>
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

