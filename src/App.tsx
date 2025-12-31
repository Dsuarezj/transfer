import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { useDropboxAuth } from './hooks/useDropboxAuth';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import UploadTransferPage from './pages/UploadTransferPage';
import ReviewInvoicesPage from './pages/ReviewInvoicesPage';

function App() {
  const { isAuthenticated, isLoading } = useDropboxAuth();

  if (isLoading) {
    return (
      <Box
        h="100%"
        w="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="neutral.50"
        overflow="hidden"
      >
        Cargando...
      </Box>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />}
      />
      <Route
        path="/upload"
        element={isAuthenticated ? <UploadTransferPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/review"
        element={isAuthenticated ? <ReviewInvoicesPage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default App;
