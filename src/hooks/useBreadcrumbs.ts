import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { navigationModules, type NavigationModule, type NavigationChild } from '@/config/navigationConfig';
import { LucideIcon, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: LucideIcon;
  isLast: boolean;
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();

  return useMemo(() => {
    const path = location.pathname;
    
    // Home route
    if (path === '/' || path === '') {
      return [{ label: 'Inicio', path: '/', icon: Home, isLast: true }];
    }

    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Inicio', path: '/', icon: Home, isLast: false }
    ];

    // Find matching module
    let matchedModule: NavigationModule | undefined;
    let matchedChild: NavigationChild | undefined;

    for (const module of navigationModules) {
      // Check exact path match
      if (path === module.path) {
        matchedModule = module;
        break;
      }

      // Check matchPaths
      if (module.matchPaths?.some(mp => path.startsWith(mp))) {
        matchedModule = module;
      }

      // Check children
      if (module.children) {
        for (const child of module.children) {
          if (path === child.path) {
            matchedModule = module;
            matchedChild = child;
            break;
          }
          if (child.matchPaths?.some(mp => path.startsWith(mp))) {
            matchedModule = module;
            matchedChild = child;
            break;
          }
        }
      }

      // Check if path starts with module path
      if (!matchedModule && path.startsWith(module.path + '/')) {
        matchedModule = module;
        // Try to find child
        if (module.children) {
          for (const child of module.children) {
            if (path.startsWith(child.path)) {
              matchedChild = child;
              break;
            }
          }
        }
      }
    }

    if (matchedModule) {
      breadcrumbs.push({
        label: matchedModule.label,
        path: matchedModule.path,
        icon: matchedModule.icon,
        isLast: !matchedChild
      });

      if (matchedChild) {
        breadcrumbs.push({
          label: matchedChild.label,
          path: matchedChild.path,
          icon: matchedChild.icon,
          isLast: true
        });
      }
    } else {
      // Fallback: parse path segments
      const segments = path.split('/').filter(Boolean);
      segments.forEach((segment, index) => {
        const isLast = index === segments.length - 1;
        const segmentPath = '/' + segments.slice(0, index + 1).join('/');
        breadcrumbs.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          path: segmentPath,
          isLast
        });
      });
    }

    return breadcrumbs;
  }, [location.pathname]);
}
