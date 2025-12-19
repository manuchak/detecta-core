import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Home from '@/pages/Home/Home';

/**
 * Componente que decide qué mostrar en la ruta raíz:
 * - Si no está autenticado → /landing
 * - Si está autenticado → Home (Hub Contextual con Liquid Glass)
 */
const SmartHomeRedirect = () => {
  const { user, loading } = useAuth();

  // Mientras carga, mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No autenticado → Landing
  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  // Autenticado → Home (el Home ya maneja redirección por rol)
  return <Home />;
};

export default SmartHomeRedirect;
