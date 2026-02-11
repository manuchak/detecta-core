import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureAnnouncements } from '@/hooks/useFeatureAnnouncements';
import { getTargetRouteForRole } from '@/constants/accessControl';

/**
 * Hook que maneja la redirección inteligente basada en el rol del usuario
 * después de iniciar sesión exitosamente.
 */
export const useSmartAuthRedirect = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Show feature announcements for new functionality based on role
  useFeatureAnnouncements(userRole, !!user);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const isLoginPage = location.pathname === '/auth/login';
    
    if (userRole === null) return;

    if (userRole === 'unverified' && !location.pathname.includes('pending-activation')) {
      navigate('/auth/pending-activation', { replace: true });
      return;
    }

    if (userRole !== 'unverified' && isLoginPage) {
      const targetRoute = getTargetRouteForRole(userRole);
      navigate(targetRoute, { replace: true });
    }
  }, [user, userRole, loading, navigate, location.pathname]);
};

export default useSmartAuthRedirect;
