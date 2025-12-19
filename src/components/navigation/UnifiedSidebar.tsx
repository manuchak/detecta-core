import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  navigationModules, 
  navigationGroups, 
  NavigationModule, 
  NavigationChild 
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

  const getActiveModule = () => {
    const path = location.pathname;
    return navigationModules.find(m => {
      if (path.startsWith(m.path)) return true;
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
    if (!hasRoleAccess(module.roles)) return false;
    if (module.children) {
      return filterChildren(module.children).length > 0;
    }
    return true;
  });

  // Get modules grouped by their group property
  const getModulesByGroup = (groupId: string) => 
    filteredModules.filter(m => m.group === groupId);

  // Get visible groups (only those with accessible modules)
  const visibleGroups = navigationGroups.filter(group => 
    getModulesByGroup(group.id).length > 0
  );

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
    
    if (!hasChildren) {
      return (
        <SidebarMenuItem key={module.id}>
          <SidebarMenuButton
            onClick={() => handleNavigate(module.path)}
            className={cn(
              "w-full justify-start gap-3 py-2.5 transition-all duration-200",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
            )}
            tooltip={isCollapsed ? module.label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
              <span className="text-sm flex-1">{module.label}</span>
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
            "w-full justify-start gap-3 py-2.5 transition-all duration-200",
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
      {/* Collapse Toggle */}
      <div className="flex items-center justify-end p-2 border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-7 w-7 hover:bg-sidebar-accent"
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform duration-200",
            isCollapsed && "rotate-180"
          )} />
        </Button>
      </div>

      <SidebarContent className="py-2">
        {visibleGroups.map((group, groupIndex) => {
          const groupModules = getModulesByGroup(group.id);
          if (groupModules.length === 0) return null;

          return (
            <React.Fragment key={group.id}>
              {groupIndex > 0 && !isCollapsed && (
                <Separator className="my-2 bg-sidebar-border/50" />
              )}
              
              <SidebarGroup className="py-1">
                {!isCollapsed && (
                  <SidebarGroupLabel className="px-3 py-1.5 text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 px-2">
                    {groupModules.map(renderModule)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </React.Fragment>
          );
        })}
      </SidebarContent>

      {/* Quick Stats Footer */}
      {stats && !isCollapsed && (
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              Vista Rápida
            </p>
            <div className="space-y-1">
              {stats.criticalAlerts !== undefined && stats.criticalAlerts > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sidebar-foreground/70">Alertas</span>
                  <span className="font-semibold text-destructive">{stats.criticalAlerts}</span>
                </div>
              )}
              {stats.urgentClusters !== undefined && stats.urgentClusters > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sidebar-foreground/70">Clusters</span>
                  <span className="font-semibold text-warning">{stats.urgentClusters}</span>
                </div>
              )}
              {stats.totalDeficit !== undefined && stats.totalDeficit > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sidebar-foreground/70">Déficit</span>
                  <span className="font-semibold text-info">{stats.totalDeficit}</span>
                </div>
              )}
              {stats.activeCandidates !== undefined && stats.activeCandidates > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sidebar-foreground/70">Candidatos</span>
                  <span className="font-semibold text-success">{stats.activeCandidates}</span>
                </div>
              )}
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}