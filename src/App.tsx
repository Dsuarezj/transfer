import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDropboxAuth } from './hooks/useDropboxAuth';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import HomePage from './pages/HomePage';
import UploadTransferPage from './pages/UploadTransferPage';
import UploadFilePage from './pages/UploadFilePage';
import SaveTransferPage from './pages/SaveTransferPage';
import ReviewTransfersPage from './pages/ReviewTransfersPage';
import PrivacyPage from './pages/PrivacyPage';
import CompanyCreatePage from './pages/CompanyCreatePage';
import CompanyMembersPage from './pages/CompanyMembersPage';
import CompanySelectPage from './pages/CompanySelectPage';

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
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-company" element={<CompanyCreatePage />} />
        <Route path="/select-company" element={<CompanySelectPage />} />
        <Route path="/company/members" element={<CompanyMembersPage />} />
        <Route path="/upload" element={<UploadTransferPage />} />
        <Route path="/upload-file" element={<UploadFilePage />} />
        <Route path="/save" element={<SaveTransferPage />} />
        <Route path="/review" element={<ReviewTransfersPage />} />
      </Route>
    </Routes>
  );
}

export default App;
