import { Routes, Route, Navigate } from 'react-router-dom';
import { useDropboxAuth } from './hooks/useDropboxAuth';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import HomePage from './pages/HomePage';
import UploadTransferPage from './pages/UploadTransferPage';
import ReviewInvoicesPage from './pages/ReviewInvoicesPage';

function App() {
  const { isAuthenticated } = useDropboxAuth();

  return (
    <Routes>
      <Route path="/callback" element={<CallbackPage />} />
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
