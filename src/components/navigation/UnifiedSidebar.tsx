import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  navigationModules, 
  navigationGroups, 
  NavigationModule, 
  NavigationChild,
  isGroupAllowedForRole
} from '@/config/navigationConfig';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useRoutesStats } from '@/hooks/useRoutesWithPendingPrices';

interface UnifiedSidebarProps {
  stats?: {
    criticalAlerts?: number;
    urgentClusters?: number;
    totalDeficit?: number;
    activeCandidates?: number;
  };
}

export function UnifiedSidebar({ stats }: UnifiedSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  
  const isCollapsed = state === 'collapsed';
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  
  // State for collapsed navigation groups (not module submenus)
  const [collapsedNavGroups, setCollapsedNavGroups] = useState<string[]>(() => {
    return navigationGroups
      .filter(g => g.defaultCollapsed)
      .map(g => g.id);
  });

  // Fetch routes stats for badge
  const { data: routesStats } = useRoutesStats();

  const getActiveModule = () => {
    const path = location.pathname;
    const search = location.search;
    const fullPath = path + search;
    
    // Check for exact match with query params first (for routes like /planeacion?tab=routes)
    const exactMatch = navigationModules.find(m => {
      if (fullPath === m.path || fullPath.startsWith(m.path + '&')) return true;
      return false;
    });
    if (exactMatch) return exactMatch.id;
    
    return navigationModules.find(m => {
      if (path.startsWith(m.path.split('?')[0])) return true;
      if (m.matchPaths?.some(p => path.startsWith(p))) return true;
      return false;
    })?.id || 'dashboard';
  };

  const activeModule = getActiveModule();

  const hasRoleAccess = (roles?: string[]) => {
    if (!roles) return true;
    return roles.includes(userRole || '');
  };

  const filterChildren = (children?: NavigationChild[]) => {
    if (!children) return [];
    return children.filter(child => hasRoleAccess(child.roles));
  };

  const filteredModules = navigationModules.filter(module => {
    // First check if this module's group is allowed for the user's role
    if (!isGroupAllowedForRole(module.group, userRole)) return false;
    
    if (!hasRoleAccess(module.roles)) return false;
    if (module.children) {
      return filterChildren(module.children).length > 0;
    }
    return true;
  });

  // Get modules grouped by their group property
  const getModulesByGroup = (groupId: string) => 
    filteredModules.filter(m => m.group === groupId);

  // Get visible groups (only those with accessible modules AND allowed for role)
  const visibleGroups = navigationGroups.filter(group => 
    isGroupAllowedForRole(group.id, userRole) && getModulesByGroup(group.id).length > 0
  );

  // Toggle navigation group collapse
  const toggleNavGroup = (groupId: string) => {
    setCollapsedNavGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Auto-expand groups based on current route
  useEffect(() => {
    const path = location.pathname;
    const groupsToExpand: string[] = [];

    filteredModules.forEach(module => {
      if (module.children) {
        const visibleChildren = filterChildren(module.children);
        const isChildActive = visibleChildren.some(child => 
          path.startsWith(child.path) || 
          child.matchPaths?.some(p => path.startsWith(p))
        );
        if (isChildActive) {
          groupsToExpand.push(module.id);
        }
      }
    });

    setExpandedGroups(groupsToExpand);
  }, [location.pathname, userRole]);

  const toggleGroup = (moduleId: string) => {
    setExpandedGroups(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const renderModule = (module: NavigationModule) => {
    const isActive = activeModule === module.id;
    const Icon = module.icon;
    const hasChildren = module.children && module.children.length > 0;
    const visibleChildren = hasChildren ? filterChildren(module.children) : [];
    const isExpanded = expandedGroups.includes(module.id);
    
    // Check if this is the routes module and should show badge
    const showRoutesBadge = module.id === 'routes' && (routesStats?.pendingPrices || 0) > 0;
    
    if (!hasChildren) {
      return (
        <SidebarMenuItem key={module.id}>
          <SidebarMenuButton
            onClick={() => handleNavigate(module.path)}
            className={cn(
              "w-full justify-start gap-2.5 py-1.5 transition-all duration-200",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
            )}
            tooltip={isCollapsed ? module.label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="text-sm flex-1">{module.label}</span>
                {showRoutesBadge && (
                  <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-semibold">
                    {routesStats?.pendingPrices}
                  </Badge>
                )}
              </>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={module.id} className="flex flex-col">
        <SidebarMenuButton
          onClick={() => {
            if (isCollapsed) {
              handleNavigate(module.path);
            } else {
              toggleGroup(module.id);
            }
          }}
          className={cn(
            "w-full justify-start gap-2.5 py-1.5 transition-all duration-200",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
          )}
          tooltip={isCollapsed ? module.label : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="text-sm flex-1">{module.label}</span>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                isExpanded && "rotate-180"
              )} />
            </>
          )}
        </SidebarMenuButton>

        {!isCollapsed && isExpanded && visibleChildren.length > 0 && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border/50 pl-3">
            {visibleChildren.map((child) => {
              const isChildActive = location.pathname.startsWith(child.path) ||
                child.matchPaths?.some(p => location.pathname.startsWith(p));
              const ChildIcon = child.icon;

              return (
                <NavLink
                  key={child.id}
                  to={child.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-md transition-all duration-200",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    (isActive || isChildActive) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}
                >
                  {ChildIcon && <ChildIcon className="h-3.5 w-3.5 shrink-0" />}
                  <span>{child.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar 
      collapsible="icon"
      className={cn(
        "border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-14" : "w-60"
      )}
    >
      <SidebarContent className="py-0.5 flex-1">
        {visibleGroups.map((group, groupIndex) => {
          const groupModules = getModulesByGroup(group.id);
          if (groupModules.length === 0) return null;

          const isNavGroupCollapsed = collapsedNavGroups.includes(group.id);

          return (
            <React.Fragment key={group.id}>
              {groupIndex > 0 && !isCollapsed && (
                <Separator className="my-0.5 bg-sidebar-border/50" />
              )}
              
              <SidebarGroup className="py-0">
                {!isCollapsed && (
                  <SidebarGroupLabel 
                    className="px-3 py-0.5 text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider cursor-pointer flex items-center justify-between hover:text-sidebar-foreground/70 transition-colors h-6"
                    onClick={() => toggleNavGroup(group.id)}
                  >
                    <span>{group.label}</span>
                    <div className="flex items-center gap-1">
                      {isNavGroupCollapsed && (
                        <span className="text-[9px] text-sidebar-foreground/40">
                          ({groupModules.length})
                        </span>
                      )}
                      {isNavGroupCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </SidebarGroupLabel>
                )}
                
                {!isNavGroupCollapsed && (
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-px px-2">
                      {groupModules.map(renderModule)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            </React.Fragment>
          );
        })}
      </SidebarContent>

      {/* Compact Footer with Toggle + Stats - sticky to bottom */}
      <SidebarFooter className="border-t border-sidebar-border p-1.5 shrink-0 bg-sidebar">
        <div className="flex items-center justify-between gap-1.5">
          {/* Condensed stats as chips */}
          {!isCollapsed && stats && (
            <div className="flex gap-1 flex-wrap flex-1 min-w-0">
              {stats.criticalAlerts !== undefined && stats.criticalAlerts > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                  {stats.criticalAlerts} alertas
                </span>
              )}
              {stats.totalDeficit !== undefined && stats.totalDeficit > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-info/10 text-info font-medium">
                  {stats.totalDeficit} déficit
                </span>
              )}
              {stats.urgentClusters !== undefined && stats.urgentClusters > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium">
                  {stats.urgentClusters} clusters
                </span>
              )}
            </div>
          )}
          
          {/* Toggle always visible */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "h-6 w-6 shrink-0 hover:bg-sidebar-accent",
              isCollapsed && "mx-auto"
            )}
          >
            <ChevronLeft className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              isCollapsed && "rotate-180"
            )} />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}