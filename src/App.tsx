import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDropboxAuth } from './hooks/useDropboxAuth';
import LoadingSpinner from './components/LoadingSpinner';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const CallbackPage = lazy(() => import('./pages/CallbackPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const UploadTransferPage = lazy(() => import('./pages/UploadTransferPage'));
const UploadFilePage = lazy(() => import('./pages/UploadFilePage'));
const SaveTransferPage = lazy(() => import('./pages/SaveTransferPage'));
const ReviewTransfersPage = lazy(() => import('./pages/ReviewTransfersPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const CompanyCreatePage = lazy(() => import('./pages/CompanyCreatePage'));
const CompanyMembersPage = lazy(() => import('./pages/CompanyMembersPage'));
const CompanySelectPage = lazy(() => import('./pages/CompanySelectPage'));

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
    <Suspense fallback={<LoadingSpinner fullScreen />}>
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
    </Suspense>
  );
}

export default App;
