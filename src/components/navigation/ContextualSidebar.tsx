import React from 'react';
import { useNavigate } from 'react-router-dom';
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
    id: 'analytics',
    title: 'Análisis',
    description: 'Vistas ejecutivas',
    icon: Target,
    children: [
      { id: 'executive', title: 'Dashboard Principal', icon: Target },
      { id: 'monthly-metrics', title: 'Métricas Mensuales', icon: TrendingUp },
      { id: 'financial', title: 'Financiero', icon: TrendingUp }
    ]
  },
  {
    id: 'operations',
    title: 'Operaciones',
    description: 'Tiempo real',
    icon: Zap,
    children: [
      { id: 'alertas', title: 'Alertas Críticas', icon: AlertTriangle },
      { id: 'pipeline', title: 'Pipeline', icon: Users },
      { id: 'metricas', title: 'Métricas Operativas', icon: BarChart3 }
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
    id: 'intelligence',
    title: 'Inteligencia IA',
    description: 'Machine Learning',
    icon: Bot,
    children: [
      { id: 'ai', title: 'Análisis IA', icon: Bot },
      { id: 'alerts', title: 'Alertas Predictivas', icon: AlertTriangle },
      { id: 'rotacion', title: 'Rotación', icon: TrendingUp },
      { id: 'temporal', title: 'Tendencias', icon: BarChart3 },
      { id: 'ml', title: 'ML Models', icon: Database },
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
      { id: 'roi', title: 'Análisis ROI', icon: TrendingUp }
    ]
  }
];

export function ContextualSidebar({ activeSection, onSectionChange, stats }: ContextualSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === 'collapsed';

  // Find active parent section
  const getActiveParentSection = () => {
    for (const section of navigationItems) {
      if (section.children?.some(child => child.id === activeSection)) {
        return section.id;
      }
    }
    return 'analytics';
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
      case 'analytics':
        return stats.totalDeficit && stats.totalDeficit > 10 ? stats.totalDeficit.toString() : null;
      case 'operations':
        return stats.criticalAlerts && stats.criticalAlerts > 0 ? stats.criticalAlerts.toString() : null;
      case 'intelligence':
        return stats.urgentClusters && stats.urgentClusters > 0 ? stats.urgentClusters.toString() : null;
      default:
        return null;
    }
  };

  return (
    <Sidebar className={cn(collapsed ? "w-14" : "w-64")} collapsible="icon">
      <SidebarContent className="p-2">
        {/* Main sections - Grouped */}
        <SidebarGroup className="space-y-1">
          <SidebarGroupLabel className={cn(
            "px-3 py-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground/70",
            collapsed ? "sr-only" : ""
          )}>
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((section) => {
                const isActive = activeParentSection === section.id;
                const dynamicBadge = getDynamicBadge(section.id);
                
                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton 
                      className={cn(
                        "relative rounded-lg h-auto p-3 transition-all duration-200",
                        "hover:bg-accent/50 hover:scale-[1.02]",
                        isActive ? "bg-primary/10 text-primary shadow-sm border border-primary/20" : "hover:bg-muted/50"
                      )}
                      onClick={() => {
                        // Navigate to first child of section
                        const firstChild = section.children?.[0];
                        if (firstChild) {
                          onSectionChange(firstChild.id);
                        }
                      }}
                    >
                      <section.icon className={cn(
                        "shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground",
                        collapsed ? "h-5 w-5" : "h-4 w-4"
                      )} />
                      {!collapsed && (
                        <>
                          <div className="flex-1 min-w-0 text-left">
                            <div className={cn(
                              "font-medium truncate text-sm leading-5",
                              isActive ? "text-primary" : "text-foreground"
                            )}>
                              {section.title}
                            </div>
                            <div className="text-xs text-muted-foreground/80 truncate leading-4">
                              {section.description}
                            </div>
                          </div>
                          {dynamicBadge && (
                            <Badge 
                              variant="destructive" 
                              className="text-xs px-2 py-0.5 ml-3 min-w-[1.5rem] justify-center"
                            >
                              {dynamicBadge}
                            </Badge>
                          )}
                        </>
                      )}
                      {collapsed && dynamicBadge && (
                        <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center shadow-sm animate-pulse">
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
          <SidebarGroup className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2">
              <SidebarGroupLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/70">
                {navigationItems.find(s => s.id === activeParentSection)?.title || 'Secciones'}
              </SidebarGroupLabel>
              <div className="w-8 h-px bg-border"></div>
            </div>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {getContextualItems().map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      className={cn(
                        "pl-8 pr-3 py-2 rounded-lg transition-all duration-200",
                        "hover:bg-accent/50 hover:translate-x-1",
                        activeSection === item.id 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => onSectionChange(item.id)}
                    >
                      <item.icon className={cn(
                        "shrink-0 transition-colors",
                        activeSection === item.id ? "text-primary-foreground" : "text-muted-foreground",
                        "h-3.5 w-3.5"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        activeSection === item.id ? "text-primary-foreground" : ""
                      )}>
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Quick stats in footer */}
        {!collapsed && stats && (
          <SidebarGroup className="mt-auto space-y-2">
            <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground/70">
              Estado Actual
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="grid grid-cols-2 gap-2 p-3">
                <div className="text-center p-3 bg-gradient-to-br from-destructive/10 to-destructive/20 rounded-xl border border-destructive/20">
                  <div className="font-bold text-lg text-destructive leading-none">{stats.totalDeficit || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-medium">Déficit</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-orange-500/10 to-orange-600/20 rounded-xl border border-orange-500/20">
                  <div className="font-bold text-lg text-orange-600 leading-none">{stats.criticalAlerts || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-medium">Alertas</div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}