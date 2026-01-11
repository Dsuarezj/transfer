import { Box, Container, Heading, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  backPath?: string;
  onBack?: () => void;
}

export default function PageHeader({ title, backPath, onBack }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <Box bg="primary.700" boxShadow="md" py={4} flexShrink={0} position="relative" zIndex={1}>
      <Container maxW="md" display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="md" color="neutral.50">
          {title}
        </Heading>
        <Button
          size="sm"
          variant="outline"
          color="neutral.50"
          borderColor="neutral.50"
          _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
          onClick={handleBack}
        >
          Volver
        </Button>
      </Container>
    </Box>
  );
}

