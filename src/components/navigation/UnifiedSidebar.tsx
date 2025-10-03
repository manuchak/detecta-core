import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { navigationModules } from '@/config/navigationConfig';
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
  const { state, toggleSidebar } = useSidebar();
  
  const isCollapsed = state === 'collapsed';

  const getActiveModule = () => {
    const path = location.pathname;
    return navigationModules.find(m => {
      if (path.startsWith(m.path)) return true;
      if (m.matchPaths?.some(p => path.startsWith(p))) return true;
      return false;
    })?.id || 'dashboard';
  };

  const activeModule = getActiveModule();

  const filteredModules = navigationModules.filter(module => {
    if (!module.roles) return true;
    return module.roles.includes(userRole || '');
  });

  const handleNavigate = (path: string) => {
    navigate(path);
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

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredModules.map((module) => {
                const isActive = activeModule === module.id;
                const Icon = module.icon;
                
                return (
                  <SidebarMenuItem key={module.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigate(module.path)}
                      className={cn(
                        "w-full justify-start gap-3 py-3 transition-all duration-200",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      )}
                      tooltip={isCollapsed ? module.label : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && (
                        <span className="text-sm">{module.label}</span>
                      )}
                    </SidebarMenuButton>
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
    </Sidebar>
  );
}
