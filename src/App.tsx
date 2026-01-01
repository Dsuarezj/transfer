import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useDropboxAuth } from './hooks/useDropboxAuth';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import HomePage from './pages/HomePage';
import UploadTransferPage from './pages/UploadTransferPage';
import ReviewInvoicesPage from './pages/ReviewInvoicesPage';
import TestOCRPage from './pages/TestOCRPage';
import { regionDetectorSingleton } from './ml/regionDetector';

function App() {
  const { isAuthenticated } = useDropboxAuth();
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Pre-cargar modelo OCR (custom si existe, fallback si no) tras login
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const preload = async () => {
      setIsModelLoading(true);
      try {
        await regionDetectorSingleton.preload();
      } catch (e) {
        console.warn('No se pudo precargar modelo, se usará fallback si aplica', e);
      } finally {
        if (!cancelled) setIsModelLoading(false);
      }
    };
    preload();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <>
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/upload" element={isAuthenticated ? <UploadTransferPage /> : <Navigate to="/login" />} />
        <Route path="/review" element={isAuthenticated ? <ReviewInvoicesPage /> : <Navigate to="/login" />} />
        <Route path="/test-ocr" element={isAuthenticated ? <TestOCRPage /> : <Navigate to="/login" />} />
      </Routes>

      {isAuthenticated && isModelLoading && (
        <Box
          position="fixed"
          bottom={4}
          right={4}
          bg="blackAlpha.700"
          color="white"
          px={3}
          py={2}
          borderRadius="md"
          display="flex"
          alignItems="center"
          gap={2}
          zIndex={1500}
          boxShadow="md"
        >
          <Spinner size="sm" />
          <Text fontSize="sm">Cargando mejora de detección...</Text>
        </Box>
      )}
    </>
  );
}

export default App;
