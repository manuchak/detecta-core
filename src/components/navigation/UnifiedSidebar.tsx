import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSandbox } from '@/contexts/SandboxContext';
import { navigationModules, NavigationModule, NavigationChild } from '@/config/navigationConfig';
import { SandboxEnvironmentIndicator } from '@/components/sandbox/SandboxEnvironmentIndicator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  const { isSandboxMode } = useSandbox();
  const { state, toggleSidebar } = useSidebar();
  
  const isCollapsed = state === 'collapsed';
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [showProductionWarning, setShowProductionWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

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
    // If module has children, show it if at least one child is accessible
    if (module.children) {
      return filterChildren(module.children).length > 0;
    }
    return true;
  });

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

  const handleNavigate = (path: string, module?: NavigationModule) => {
    // Si estamos en sandbox y el módulo NO está migrado, mostrar advertencia
    if (isSandboxMode && module && module.sandboxReady === false) {
      setPendingNavigation(path);
      setShowProductionWarning(true);
      return;
    }
    navigate(path);
  };

  const handleConfirmProductionNavigation = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
    setShowProductionWarning(false);
  };

  return (
    <Sidebar 
      collapsible="icon"
      className={cn(
        "border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      {/* Collapse Toggle */}
      <div className="flex items-center justify-end p-2 border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 hover:bg-sidebar-accent"
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform duration-200",
            isCollapsed && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Environment Indicator */}
      <SandboxEnvironmentIndicator collapsed={isCollapsed} />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredModules.map((module) => {
                const isActive = activeModule === module.id;
                const Icon = module.icon;
                const hasChildren = module.children && module.children.length > 0;
                const visibleChildren = hasChildren ? filterChildren(module.children) : [];
                const isExpanded = expandedGroups.includes(module.id);
                
                if (!hasChildren) {
                  // Regular menu item without children
                  return (
                    <SidebarMenuItem key={module.id}>
                      <SidebarMenuButton
                        onClick={() => handleNavigate(module.path, module)}
                        className={cn(
                          "w-full justify-start gap-3 py-3 transition-all duration-200 relative",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                        )}
                        tooltip={isCollapsed ? module.label : undefined}
                      >
                        <div className="relative">
                          <Icon className="h-5 w-5 shrink-0" />
                          {/* Dot indicator in collapsed mode */}
                          {isCollapsed && isSandboxMode && (
                            <span className={cn(
                              "absolute -top-1 -right-1 h-2 w-2 rounded-full border border-sidebar",
                              module.sandboxReady ? "bg-success" : "bg-warning"
                            )} />
                          )}
                        </div>
                        {!isCollapsed && (
                          <>
                            <span className="text-sm flex-1">{module.label}</span>
                            {/* Badge in expanded mode */}
                            {isSandboxMode && (
                              module.sandboxReady ? (
                                <Badge variant="success" className="text-[10px] px-1.5 py-0">
                                  <Check className="h-3 w-3 mr-0.5" />
                                  Sandbox
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                                  Prod
                                </Badge>
                              )
                            )}
                          </>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // Parent menu item with children
                return (
                  <SidebarMenuItem key={module.id} className="flex flex-col">
                    <SidebarMenuButton
                      onClick={() => {
                        if (isCollapsed) {
                          handleNavigate(module.path, module);
                        } else {
                          toggleGroup(module.id);
                        }
                      }}
                      className={cn(
                        "w-full justify-start gap-3 py-3 transition-all duration-200 relative",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      )}
                      tooltip={isCollapsed ? module.label : undefined}
                    >
                      <div className="relative">
                        <Icon className="h-5 w-5 shrink-0" />
                        {/* Dot indicator in collapsed mode */}
                        {isCollapsed && isSandboxMode && (
                          <span className={cn(
                            "absolute -top-1 -right-1 h-2 w-2 rounded-full border border-sidebar",
                            module.sandboxReady ? "bg-success" : "bg-warning"
                          )} />
                        )}
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className="text-sm flex-1">{module.label}</span>
                          {/* Badge in expanded mode */}
                          {isSandboxMode && (
                            module.sandboxReady ? (
                              <Badge variant="success" className="text-[10px] px-1.5 py-0 mr-1">
                                <Check className="h-3 w-3 mr-0.5" />
                                Sandbox
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 mr-1">
                                <AlertTriangle className="h-3 w-3 mr-0.5" />
                                Prod
                              </Badge>
                            )
                          )}
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )} />
                        </>
                      )}
                    </SidebarMenuButton>

                    {/* Children submenu */}
                    {!isCollapsed && isExpanded && visibleChildren.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                        {visibleChildren.map((child) => {
                          const isChildActive = location.pathname.startsWith(child.path) ||
                            child.matchPaths?.some(p => location.pathname.startsWith(p));
                          const ChildIcon = child.icon;

                          return (
                            <NavLink
                              key={child.id}
                              to={child.path}
                              className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                (isActive || isChildActive) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              )}
                            >
                              {ChildIcon && <ChildIcon className="h-4 w-4 shrink-0" />}
                              <span>{child.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Quick Stats Footer */}
      {stats && !isCollapsed && (
        <SidebarFooter className="border-t border-sidebar-border p-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wide">
              Vista Rápida
            </p>
            <div className="space-y-1.5">
              {stats.criticalAlerts !== undefined && stats.criticalAlerts > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sidebar-foreground/70">Alertas críticas</span>
                  <span className="font-semibold text-destructive">{stats.criticalAlerts}</span>
                </div>
              )}
              {stats.urgentClusters !== undefined && stats.urgentClusters > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sidebar-foreground/70">Clusters urgentes</span>
                  <span className="font-semibold text-warning">{stats.urgentClusters}</span>
                </div>
              )}
              {stats.totalDeficit !== undefined && stats.totalDeficit > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sidebar-foreground/70">Déficit total</span>
                  <span className="font-semibold text-info">{stats.totalDeficit}</span>
                </div>
              )}
              {stats.activeCandidates !== undefined && stats.activeCandidates > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sidebar-foreground/70">Candidatos activos</span>
                  <span className="font-semibold text-success">{stats.activeCandidates}</span>
                </div>
              )}
            </div>
          </div>
        </SidebarFooter>
      )}

      {/* Sandbox Legend Footer */}
      {isSandboxMode && !isCollapsed && (
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wide mb-2">
              Leyenda
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sidebar-foreground/70">Migrado a Sandbox</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-sidebar-foreground/70">Afecta Producción</span>
            </div>
          </div>
        </SidebarFooter>
      )}

      {/* Production Warning Dialog */}
      <AlertDialog open={showProductionWarning} onOpenChange={setShowProductionWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Advertencia: Módulo de Producción
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                Este módulo <strong>NO está migrado a Sandbox</strong> y afectará directamente los{' '}
                <strong className="text-warning">datos de PRODUCCIÓN</strong>.
              </p>
              <p>
                Cualquier cambio que realices será permanente y visible para todos los usuarios del sistema.
              </p>
              <p className="text-sm text-muted-foreground">
                ¿Estás seguro de que deseas continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNavigation(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmProductionNavigation}
              className="bg-warning hover:bg-warning/90"
            >
              Continuar a Producción
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
