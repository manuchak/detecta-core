import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { 
  Target, 
  Map, 
  AlertTriangle, 
  Users,
  TrendingUp,
  Zap,
  Database,
  TestTube,
  Calendar,
  BarChart3,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  children?: {
    id: string;
    title: string;
    icon: React.ComponentType<any>;
  }[];
}

interface ContextualSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  stats?: {
    criticalAlerts?: number;
    urgentClusters?: number;
    totalDeficit?: number;
    activeCandidates?: number;
  };
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Vista ejecutiva',
    icon: Target,
    children: [
      { id: 'executive', title: 'Principal', icon: Target },
      { id: 'monthly-metrics', title: 'Métricas', icon: TrendingUp },
      { id: 'financial', title: 'Financiero', icon: TrendingUp }
    ]
  },
  {
    id: 'planning',
    title: 'Planificación',
    description: 'Estrategia temporal',
    icon: Calendar,
    children: [
      { id: 'planificacion', title: 'Multi-Mes', icon: Calendar },
      { id: 'mapa', title: 'Mapa Nacional', icon: Map }
    ]
  },
  {
    id: 'operations',
    title: 'Operaciones',
    description: 'Tiempo real',
    icon: Zap,
    children: [
      { id: 'alertas', title: 'Alertas', icon: AlertTriangle },
      { id: 'pipeline', title: 'Pipeline', icon: Users },
      { id: 'metricas', title: 'Métricas', icon: BarChart3 }
    ]
  },
  {
    id: 'analytics',
    title: 'Análisis & IA',
    description: 'Inteligencia artificial',
    icon: Bot,
    children: [
      { id: 'ai', title: 'Análisis AI', icon: Bot },
      { id: 'alerts', title: 'Alertas IA', icon: AlertTriangle },
      { id: 'rotacion', title: 'Rotación', icon: TrendingUp },
      { id: 'temporal', title: 'Temporal', icon: BarChart3 },
      { id: 'ml', title: 'Machine Learning', icon: Database },
      { id: 'cohort', title: 'Cohortes', icon: BarChart3 }
    ]
  },
  {
    id: 'simulation',
    title: 'Simulación',
    description: 'Escenarios y ROI',
    icon: TestTube,
    children: [
      { id: 'simulator', title: 'Simulador IA', icon: TestTube },
      { id: 'simulation', title: 'Escenarios', icon: Target },
      { id: 'roi', title: 'ROI', icon: TrendingUp }
    ]
  }
];

export function ContextualSidebar({ activeSection, onSectionChange, stats }: ContextualSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  // Find active parent section
  const getActiveParentSection = () => {
    for (const section of navigationItems) {
      if (section.children?.some(child => child.id === activeSection)) {
        return section.id;
      }
    }
    return 'dashboard';
  };

  const activeParentSection = getActiveParentSection();

  // Get contextual children for current section
  const getContextualItems = () => {
    const parentSection = navigationItems.find(s => s.id === activeParentSection);
    return parentSection?.children || [];
  };

  const getDynamicBadge = (sectionId: string) => {
    if (!stats) return null;
    
    switch (sectionId) {
      case 'dashboard':
        return stats.totalDeficit > 10 ? stats.totalDeficit.toString() : null;
      case 'operations':
        return stats.criticalAlerts > 0 ? stats.criticalAlerts.toString() : null;
      case 'analytics':
        return stats.urgentClusters > 0 ? stats.urgentClusters.toString() : null;
      default:
        return null;
    }
  };

  return (
    <Sidebar className={cn(collapsed ? "w-14" : "w-64")} collapsible="icon">
      <SidebarContent>
        {/* Main sections */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((section) => {
                const isActive = activeParentSection === section.id;
                const dynamicBadge = getDynamicBadge(section.id);
                
                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton 
                      className={cn(
                        "relative",
                        isActive && "bg-primary/10 text-primary"
                      )}
                      onClick={() => {
                        // Navigate to first child of section
                        const firstChild = section.children?.[0];
                        if (firstChild) {
                          onSectionChange(firstChild.id);
                        }
                      }}
                    >
                      <section.icon className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{section.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {section.description}
                            </div>
                          </div>
                          {dynamicBadge && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0.5 ml-2">
                              {dynamicBadge}
                            </Badge>
                          )}
                        </>
                      )}
                      {collapsed && dynamicBadge && (
                        <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center">
                          {dynamicBadge}
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Contextual navigation - only show when expanded */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {navigationItems.find(s => s.id === activeParentSection)?.title || 'Secciones'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {getContextualItems().map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      className={cn(
                        "pl-6",
                        activeSection === item.id && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => onSectionChange(item.id)}
                    >
                      <item.icon className="h-3 w-3" />
                      <span className="text-sm">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Quick stats in footer */}
        {!collapsed && stats && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>Estado Actual</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="grid grid-cols-2 gap-2 p-2">
                <div className="text-center p-2 bg-destructive/10 rounded text-xs">
                  <div className="font-bold text-destructive">{stats.totalDeficit || 0}</div>
                  <div className="text-muted-foreground">Déficit</div>
                </div>
                <div className="text-center p-2 bg-warning/10 rounded text-xs">
                  <div className="font-bold text-warning">{stats.criticalAlerts || 0}</div>
                  <div className="text-muted-foreground">Alertas</div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}