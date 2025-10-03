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
      // Small delay to avoid race conditions with auth redirects and deep-links
      const timeoutId = setTimeout(() => {
        // Check if we're still on root (no other navigation happened)
        if (window.location.pathname === '/') {
          const lastRoute = sessionStorage.getItem(LAST_ROUTE_KEY);
          
          // Don't restore if there's a resume operation in progress
          const hasResumeFlag = sessionStorage.getItem('resume_in_progress');
          
          if (lastRoute && 
              lastRoute !== '/' && 
              !hasResumeFlag &&
              !EXCLUDED_PATHS.some(excluded => lastRoute.startsWith(excluded))) {
            console.log('🔄 [LastRouteRestorer] Restoring last route:', lastRoute);
            navigate(lastRoute, { replace: true });
          }
        }
      }, 300); // 300ms delay
      
      return () => clearTimeout(timeoutId);
    }
  }, []); // Only run once on mount

  return null;
}
