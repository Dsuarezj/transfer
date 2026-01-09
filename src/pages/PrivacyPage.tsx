import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  List,
  ListItem,
  Link,
} from '@chakra-ui/react';

export default function PrivacyPage() {
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
      <Container maxW="4xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Heading as="h1" size="xl" color="gray.800">
            Privacy Policy
          </Heading>

          <Text color="gray.600">
            Last updated: January 09, 2026
          </Text>

          <Text color="gray.700" lineHeight="tall">
            This Privacy Policy describes how Transferido Ya (&quot;We&quot;, &quot;Us&quot;, or &quot;Our&quot;) handles information when You use our Service. We are committed to protecting Your privacy and being transparent about our practices.
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            Our Privacy Commitment
          </Heading>

          <Text color="gray.700" lineHeight="tall" fontWeight="semibold">
            Transferido Ya does not collect, store, or process any personal data on our servers. We do not have databases or backend servers that store user information.
          </Text>

          <Text color="gray.700" lineHeight="tall">
            All Your data (transfer images, reports, and documents) is stored exclusively in Your own Dropbox account, which You control entirely. We never have access to Your files or personal information.
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            How the Application Works
          </Heading>

          <Heading as="h3" size="md" color="gray.700" mt={4}>
            Authentication
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            Authentication is handled entirely by Dropbox through their secure OAuth 2.0 system. When You log in:
          </Text>

          <List spacing={2} color="gray.700" ml={6}>
            <ListItem>You are redirected to Dropbox&apos;s official login page</ListItem>
            <ListItem>You enter Your credentials directly on Dropbox (we never see Your password)</ListItem>
            <ListItem>Dropbox provides an access token that is stored locally in Your browser (localStorage)</ListItem>
            <ListItem>This token allows the app to save files to Your Dropbox account on Your behalf</ListItem>
          </List>

          <Heading as="h3" size="md" color="gray.700" mt={4}>
            Local Storage
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            We use Your browser&apos;s localStorage (not cookies) to store:
          </Text>

          <List spacing={2} color="gray.700" ml={6}>
            <ListItem>Dropbox access token (to maintain Your session)</ListItem>
            <ListItem>Dropbox refresh token (to renew Your session automatically)</ListItem>
            <ListItem>Token expiration time</ListItem>
          </List>

          <Text color="gray.700" lineHeight="tall">
            This data remains exclusively on Your device and is deleted when You log out or clear Your browser data.
          </Text>

          <Heading as="h3" size="md" color="gray.700" mt={4}>
            Your Data
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            All files You create through the application (transfer captures, reports, etc.) are saved directly to Your Dropbox account in the &quot;Aplicaciones/TransferidoYa&quot; folder. We do not have access to these files and cannot view, modify, or delete them. You have full control over Your data through Your Dropbox account.
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            Third-Party Services
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            Our Service uses the following third-party services:
          </Text>

          <List spacing={4} color="gray.700" ml={6}>
            <ListItem>
              <Text>
                <strong>Dropbox</strong>
              </Text>
              <Text>
                Used for authentication and file storage. Your data is stored in Your Dropbox account and is subject to Dropbox&apos;s Privacy Policy:{' '}
                <Link href="https://www.dropbox.com/privacy" rel="external nofollow noopener" target="_blank" color="blue.500" isExternal>
                  https://www.dropbox.com/privacy
                </Link>
              </Text>
            </ListItem>
            <ListItem>
              <Text>
                <strong>Vercel Analytics</strong>
              </Text>
              <Text>
                We use Vercel Analytics to collect anonymous, aggregated usage statistics (such as page views and general usage patterns). This helps us understand how the Service is used and improve it. No personally identifiable information is collected. Learn more:{' '}
                <Link href="https://vercel.com/docs/analytics/privacy-policy" rel="external nofollow noopener" target="_blank" color="blue.500" isExternal>
                  https://vercel.com/docs/analytics/privacy-policy
                </Link>
              </Text>
            </ListItem>
          </List>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            Advertising
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            To maintain and improve our Service, we may display advertisements in the application in the future. These ads may be provided by third-party advertising networks. When implemented, these advertising partners may collect anonymous information about Your visits to our Service and other websites to provide relevant advertisements. We will update this Privacy Policy when advertising is implemented to provide detailed information about our advertising partners and how to opt out of personalized advertising if applicable.
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            Cookies
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            Transferido Ya does not use cookies. We use localStorage for session management, which is different from cookies and does not track You across websites.
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            Data Security
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            Since we don&apos;t store Your data on our servers, the security of Your information depends on:
          </Text>

          <List spacing={2} color="gray.700" ml={6}>
            <ListItem>Dropbox&apos;s security measures for Your stored files</ListItem>
            <ListItem>Your browser&apos;s security for locally stored tokens</ListItem>
            <ListItem>Your device&apos;s security</ListItem>
          </List>

          <Text color="gray.700" lineHeight="tall">
            We recommend keeping Your browser and device updated and using a secure internet connection.
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            Your Rights
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            Since we don&apos;t collect or store personal data, traditional data rights requests (access, deletion, portability) don&apos;t apply to us directly. However:
          </Text>

          <List spacing={2} color="gray.700" ml={6}>
            <ListItem>You can disconnect the app from Your Dropbox account at any time through Dropbox settings</ListItem>
            <ListItem>You can delete all Your data by removing the &quot;Aplicaciones/TransferidoYa&quot; folder from Your Dropbox</ListItem>
            <ListItem>You can clear Your browser&apos;s localStorage to remove the stored tokens</ListItem>
            <ListItem>Logging out of the app removes all locally stored data</ListItem>
          </List>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            Children&apos;s Privacy
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            Our Service is not intended for anyone under the age of 13. We do not knowingly collect any information from children under 13.
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            Changes to This Privacy Policy
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            We may update this Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
          </Text>

          <Heading as="h2" size="lg" color="gray.800" mt={8}>
            Contact Us
          </Heading>

          <Text color="gray.700" lineHeight="tall">
            If You have any questions about this Privacy Policy, You can contact us:
          </Text>

          <List spacing={2} color="gray.700" ml={6}>
            <ListItem>
              <Text>
                By email: <Link href="mailto:contact@transferidoya.com" color="blue.500">contact@transferidoya.com</Link>
              </Text>
            </ListItem>
            <ListItem>
              <Text>
                By visiting this page on our website:{' '}
                <Link href="https://www.transferidoya.com/contact" rel="external nofollow noopener" target="_blank" color="blue.500" isExternal>
                  https://www.transferidoya.com/contact
                </Link>
              </Text>
            </ListItem>
          </List>
        </VStack>
      </Container>
    </Box>
  );
}
