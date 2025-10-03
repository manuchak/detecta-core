import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const LAST_ROUTE_KEY = 'app_last_route';
const EXCLUDED_PATHS = ['/auth/login', '/auth/register', '/auth/signup', '/auth/forgot-password', '/landing'];

export function LastRouteRestorer() {
  const location = useLocation();
  const navigate = useNavigate();

  // Save current route on every navigation
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Don't save excluded paths (auth, landing, etc.)
    if (!EXCLUDED_PATHS.some(excluded => location.pathname.startsWith(excluded))) {
      sessionStorage.setItem(LAST_ROUTE_KEY, currentPath);
      console.log('📍 [LastRouteRestorer] Saved route:', currentPath);
    }
  }, [location]);

  // Restore last route on initial mount (only if on root path)
  useEffect(() => {
    const isRootPath = location.pathname === '/' && !location.search;
    
    if (isRootPath) {
      const lastRoute = sessionStorage.getItem(LAST_ROUTE_KEY);
      
      if (lastRoute && lastRoute !== '/' && !EXCLUDED_PATHS.some(excluded => lastRoute.startsWith(excluded))) {
        console.log('🔄 [LastRouteRestorer] Restoring last route:', lastRoute);
        navigate(lastRoute, { replace: true });
      }
    }
  }, []); // Only run once on mount

  return null;
}
