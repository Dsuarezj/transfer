import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/dropbox/authService';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const success = await authService.handleRedirect();
      
      if (success) {
        navigate('/', { replace: true });
      } else {
        setError('Error al conectar con Dropbox');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    };

    processCallback();
  }, [navigate]);

  if (error) {
    return <LoadingSpinner message={error} fullScreen />;
  }

  return <LoadingSpinner message="Conectando con Dropbox..." fullScreen />;
}

