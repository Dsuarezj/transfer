import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  List,
  ListItem,
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
    title: 'Política de Privacidad',
    lastUpdated: 'Última actualización: 09 de enero de 2026',
    intro: 'Esta Política de Privacidad describe cómo Transferido Ya ("Nosotros", "Nos" o "Nuestro") maneja la información cuando utilizas nuestro Servicio. Estamos comprometidos a proteger tu privacidad y ser transparentes sobre nuestras prácticas.',
    commitment: {
      title: 'Nuestro Compromiso de Privacidad',
      text1: 'Transferido Ya no recopila, almacena ni procesa datos personales en nuestros servidores. No tenemos bases de datos ni servidores backend que almacenen información del usuario.',
      text2: 'Todos tus datos (imágenes de transferencias, reportes y documentos) se almacenan exclusivamente en tu propia cuenta de almacenamiento en la nube, que controlas completamente. Nunca tenemos acceso a tus archivos ni información personal.',
    },
    howItWorks: {
      title: 'Cómo Funciona la Aplicación',
      auth: {
        title: 'Autenticación',
        text: 'La autenticación es manejada completamente por tu proveedor de almacenamiento en la nube a través de su sistema seguro OAuth 2.0. Cuando conectas tu cuenta:',
        items: [
          'Eres redirigido a la página oficial de inicio de sesión de tu proveedor',
          'Ingresas tus credenciales directamente con el proveedor (nunca vemos tu contraseña)',
          'El proveedor otorga un token de acceso que se almacena localmente en tu navegador (localStorage)',
          'Este token permite que la app guarde archivos en tu cuenta en la nube en tu nombre',
        ],
      },
      storage: {
        title: 'Almacenamiento Local',
        text: 'Usamos el localStorage de tu navegador (no cookies) para almacenar:',
        items: [
          'Token de acceso (para mantener tu sesión)',
          'Token de actualización (para renovar tu sesión automáticamente)',
          'Tiempo de expiración del token',
        ],
        text2: 'Estos datos permanecen exclusivamente en tu dispositivo y se eliminan cuando cierras sesión o limpias los datos de tu navegador.',
      },
      data: {
        title: 'Tus Datos',
        text: 'Todos los archivos que creas a través de la aplicación (capturas de transferencias, reportes, etc.) se guardan directamente en tu cuenta de almacenamiento en la nube. No tenemos acceso a estos archivos y no podemos verlos, modificarlos ni eliminarlos. Tienes control total sobre tus datos a través de la configuración de tu proveedor de almacenamiento.',
      },
    },
    thirdParty: {
      title: 'Servicios de Terceros',
      text: 'Nuestro Servicio se conecta con los siguientes servicios de terceros:',
      cloud: {
        title: 'Proveedor de Almacenamiento en la Nube',
        text: 'Transferido Ya funciona con Dropbox para autenticación y almacenamiento de archivos. Tus datos se almacenan en tu cuenta y están sujetos a su Política de Privacidad:',
      },
      analytics: {
        title: 'Analíticas',
        text: 'Usamos Vercel Analytics para recopilar estadísticas de uso anónimas y agregadas (como vistas de página y patrones generales de uso). Esto nos ayuda a entender cómo se usa el Servicio y mejorarlo. No se recopila información de identificación personal. Más información:',
      },
    },
    advertising: {
      title: 'Publicidad',
      text: 'Para mantener y mejorar nuestro Servicio, podemos mostrar anuncios en la aplicación en el futuro. Estos anuncios pueden ser proporcionados por redes publicitarias de terceros. Cuando se implementen, estos socios publicitarios pueden recopilar información anónima sobre tus visitas a nuestro Servicio y otros sitios web para proporcionar anuncios relevantes. Actualizaremos esta Política de Privacidad cuando se implemente la publicidad para proporcionar información detallada sobre nuestros socios publicitarios y cómo optar por no recibir publicidad personalizada si corresponde.',
    },
    cookies: {
      title: 'Cookies',
      text: 'Transferido Ya no usa cookies. Usamos localStorage para la gestión de sesiones, que es diferente de las cookies y no te rastrea a través de sitios web.',
    },
    security: {
      title: 'Seguridad de Datos',
      text: 'Como no almacenamos tus datos en nuestros servidores, la seguridad de tu información depende de:',
      items: [
        'Las medidas de seguridad de tu proveedor de almacenamiento en la nube para tus archivos',
        'La seguridad de tu navegador para los tokens almacenados localmente',
        'La seguridad de tu dispositivo',
      ],
      text2: 'Recomendamos mantener tu navegador y dispositivo actualizados y usar una conexión a internet segura.',
    },
    rights: {
      title: 'Tus Derechos',
      text: 'Como no recopilamos ni almacenamos datos personales, las solicitudes tradicionales de derechos de datos (acceso, eliminación, portabilidad) no se aplican directamente a nosotros. Sin embargo:',
      items: [
        'Puedes desconectar la app de tu cuenta en la nube en cualquier momento a través de la configuración de tu proveedor',
        'Puedes eliminar todos tus datos eliminando la carpeta de la app de tu almacenamiento en la nube',
        'Puedes limpiar el localStorage de tu navegador para eliminar los tokens almacenados',
        'Cerrar sesión en la app elimina todos los datos almacenados localmente',
      ],
    },
    children: {
      title: 'Privacidad de Menores',
      text: 'Nuestro Servicio no está destinado a menores de 13 años. No recopilamos conscientemente ninguna información de menores de 13 años.',
    },
    changes: {
      title: 'Cambios a Esta Política de Privacidad',
      text: 'Podemos actualizar esta Política de Privacidad de vez en cuando. Te notificaremos de cualquier cambio publicando la nueva Política de Privacidad en esta página y actualizando la fecha de "Última actualización".',
    },
    contact: {
      title: 'Contáctanos',
      text: 'Si tienes alguna pregunta sobre esta Política de Privacidad, puedes contactarnos:',
      email: 'Por correo electrónico:',
      website: 'Visitando esta página en nuestro sitio web:',
    },
  },
  en: {
    back: 'Back',
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: January 09, 2026',
    intro: 'This Privacy Policy describes how Transferido Ya ("We", "Us", or "Our") handles information when You use our Service. We are committed to protecting Your privacy and being transparent about our practices.',
    commitment: {
      title: 'Our Privacy Commitment',
      text1: 'Transferido Ya does not collect, store, or process any personal data on our servers. We do not have databases or backend servers that store user information.',
      text2: 'All Your data (transfer images, reports, and documents) is stored exclusively in Your own cloud storage account, which You control entirely. We never have access to Your files or personal information.',
    },
    howItWorks: {
      title: 'How the Application Works',
      auth: {
        title: 'Authentication',
        text: 'Authentication is handled entirely by Your cloud storage provider through their secure OAuth 2.0 system. When You connect Your account:',
        items: [
          'You are redirected to Your cloud provider\'s official login page',
          'You enter Your credentials directly with the provider (we never see Your password)',
          'The provider grants an access token that is stored locally in Your browser (localStorage)',
          'This token allows the app to save files to Your cloud account on Your behalf',
        ],
      },
      storage: {
        title: 'Local Storage',
        text: 'We use Your browser\'s localStorage (not cookies) to store:',
        items: [
          'Access token (to maintain Your session)',
          'Refresh token (to renew Your session automatically)',
          'Token expiration time',
        ],
        text2: 'This data remains exclusively on Your device and is deleted when You log out or clear Your browser data.',
      },
      data: {
        title: 'Your Data',
        text: 'All files You create through the application (transfer captures, reports, etc.) are saved directly to Your cloud storage account. We do not have access to these files and cannot view, modify, or delete them. You have full control over Your data through Your storage provider\'s settings.',
      },
    },
    thirdParty: {
      title: 'Third-Party Services',
      text: 'Our Service connects with the following third-party services:',
      cloud: {
        title: 'Cloud Storage Provider',
        text: 'Transferido Ya works with Dropbox for authentication and file storage. Your data is stored in Your account and is subject to their Privacy Policy:',
      },
      analytics: {
        title: 'Analytics',
        text: 'We use Vercel Analytics to collect anonymous, aggregated usage statistics (such as page views and general usage patterns). This helps us understand how the Service is used and improve it. No personally identifiable information is collected. Learn more:',
      },
    },
    advertising: {
      title: 'Advertising',
      text: 'To maintain and improve our Service, we may display advertisements in the application in the future. These ads may be provided by third-party advertising networks. When implemented, these advertising partners may collect anonymous information about Your visits to our Service and other websites to provide relevant advertisements. We will update this Privacy Policy when advertising is implemented to provide detailed information about our advertising partners and how to opt out of personalized advertising if applicable.',
    },
    cookies: {
      title: 'Cookies',
      text: 'Transferido Ya does not use cookies. We use localStorage for session management, which is different from cookies and does not track You across websites.',
    },
    security: {
      title: 'Data Security',
      text: 'Since we don\'t store Your data on our servers, the security of Your information depends on:',
      items: [
        'Your cloud storage provider\'s security measures for Your stored files',
        'Your browser\'s security for locally stored tokens',
        'Your device\'s security',
      ],
      text2: 'We recommend keeping Your browser and device updated and using a secure internet connection.',
    },
    rights: {
      title: 'Your Rights',
      text: 'Since we don\'t collect or store personal data, traditional data rights requests (access, deletion, portability) don\'t apply to us directly. However:',
      items: [
        'You can disconnect the app from Your cloud account at any time through Your provider\'s settings',
        'You can delete all Your data by removing the app folder from Your cloud storage',
        'You can clear Your browser\'s localStorage to remove the stored tokens',
        'Logging out of the app removes all locally stored data',
      ],
    },
    children: {
      title: 'Children\'s Privacy',
      text: 'Our Service is not intended for anyone under the age of 13. We do not knowingly collect any information from children under 13.',
    },
    changes: {
      title: 'Changes to This Privacy Policy',
      text: 'We may update this Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.',
    },
    contact: {
      title: 'Contact Us',
      text: 'If You have any questions about this Privacy Policy, You can contact us:',
      email: 'By email:',
      website: 'By visiting this page on our website:',
    },
  },
};

type Language = 'es' | 'en';

export default function PrivacyPage() {
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

          <Text color="gray.600">
            {t.lastUpdated}
          </Text>

          <Text color="gray.700" lineHeight="tall">
            {t.intro}
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            {t.commitment.title}
          </Heading>

          <Text color="gray.700" lineHeight="tall" fontWeight="semibold">
            {t.commitment.text1}
          </Text>

          <Text color="gray.700" lineHeight="tall">
            {t.commitment.text2}
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            {t.howItWorks.title}
          </Heading>

          <Heading as="h3" size="md" color="gray.700" mt={4}>
            {t.howItWorks.auth.title}
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            {t.howItWorks.auth.text}
          </Text>

          <List spacing={2} color="gray.700" ml={6}>
            {t.howItWorks.auth.items.map((item, i) => (
              <ListItem key={i}>{item}</ListItem>
            ))}
          </List>

          <Heading as="h3" size="md" color="gray.700" mt={4}>
            {t.howItWorks.storage.title}
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            {t.howItWorks.storage.text}
          </Text>

          <List spacing={2} color="gray.700" ml={6}>
            {t.howItWorks.storage.items.map((item, i) => (
              <ListItem key={i}>{item}</ListItem>
            ))}
          </List>

          <Text color="gray.700" lineHeight="tall">
            {t.howItWorks.storage.text2}
          </Text>

          <Heading as="h3" size="md" color="gray.700" mt={4}>
            {t.howItWorks.data.title}
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            {t.howItWorks.data.text}
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            {t.thirdParty.title}
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            {t.thirdParty.text}
          </Text>

          <List spacing={4} color="gray.700" ml={6}>
            <ListItem>
              <Text>
                <strong>{t.thirdParty.cloud.title}</strong>
              </Text>
              <Text>
                {t.thirdParty.cloud.text}{' '}
                <Link href="https://www.dropbox.com/privacy" rel="external nofollow noopener" target="_blank" color="blue.500" isExternal>
                  https://www.dropbox.com/privacy
                </Link>
              </Text>
            </ListItem>
            <ListItem>
              <Text>
                <strong>{t.thirdParty.analytics.title}</strong>
              </Text>
              <Text>
                {t.thirdParty.analytics.text}{' '}
                <Link href="https://vercel.com/docs/analytics/privacy-policy" rel="external nofollow noopener" target="_blank" color="blue.500" isExternal>
                  https://vercel.com/docs/analytics/privacy-policy
                </Link>
              </Text>
            </ListItem>
          </List>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            {t.advertising.title}
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            {t.advertising.text}
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            {t.cookies.title}
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            {t.cookies.text}
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            {t.security.title}
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            {t.security.text}
          </Text>

          <List spacing={2} color="gray.700" ml={6}>
            {t.security.items.map((item, i) => (
              <ListItem key={i}>{item}</ListItem>
            ))}
          </List>

          <Text color="gray.700" lineHeight="tall">
            {t.security.text2}
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            {t.rights.title}
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            {t.rights.text}
          </Text>

          <List spacing={2} color="gray.700" ml={6}>
            {t.rights.items.map((item, i) => (
              <ListItem key={i}>{item}</ListItem>
            ))}
          </List>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            {t.children.title}
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            {t.children.text}
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            {t.changes.title}
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            {t.changes.text}
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            {t.contact.title}
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            {t.contact.text}
          </Text>

          <List spacing={2} color="gray.700" ml={6}>
            <ListItem>
              <Text>
                {t.contact.email} <Link href="mailto:help@transferidoya.com" color="blue.500">help@transferidoya.com</Link>
              </Text>
            </ListItem>
            <ListItem>
              <Text>
                {t.contact.website}{' '}
                <Link href="/contact" color="blue.500">
                  /contact
                </Link>
              </Text>
            </ListItem>
          </List>
        </VStack>
      </Container>
    </Box>
  );
}
