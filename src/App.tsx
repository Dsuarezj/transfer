import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDropboxAuth } from './hooks/useDropboxAuth';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import HomePage from './pages/HomePage';
import UploadTransferPage from './pages/UploadTransferPage';
import SaveTransferPage from './pages/SaveTransferPage';
import ReviewInvoicesPage from './pages/ReviewInvoicesPage';

function ProtectedRoute() {
  const { isAuthenticated } = useDropboxAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function LoginRoute() {
  const { isAuthenticated } = useDropboxAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />;
}

function App() {
  return (
    <Routes>
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadTransferPage />} />
        <Route path="/save" element={<SaveTransferPage />} />
        <Route path="/review" element={<ReviewInvoicesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
