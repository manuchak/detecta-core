
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronDown,
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
  Bot,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  badge?: string;
  badgeVariant?: 'default' | 'destructive' | 'secondary' | 'outline';
  children?: NavigationItem[];
}

interface NavigationSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  criticalAlerts?: number;
  urgentClusters?: number;
  totalDeficit?: number;
  activeCandidates?: number;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Ejecutivo',
    description: 'Vista general y control',
    icon: Target,
    children: [
      {
        id: 'executive',
        title: 'Dashboard Principal',
        description: 'Métricas ejecutivas',
        icon: Target
      },
      {
        id: 'financial',
        title: 'Control Financiero',
        description: 'Tracking gastos y ROI',
        icon: TrendingUp
      }
    ]
  },
  {
    id: 'planning',
    title: 'Planificación',
    description: 'Estrategia y planificación',
    icon: Calendar,
    children: [
      {
        id: 'planificacion',
        title: 'Timeline Multi-Mes',
        description: 'Planificación 3-6 meses',
        icon: Calendar
      },
      {
        id: 'mapa',
        title: 'Mapa Nacional',
        description: 'Vista geográfica',
        icon: Map
      }
    ]
  },
  {
    id: 'operations',
    title: 'Operaciones',
    description: 'Tiempo real y pipeline',
    icon: Zap,
    children: [
      {
        id: 'alertas',
        title: 'Sistema de Alertas',
        description: 'Alertas operacionales',
        icon: AlertTriangle
      },
      {
        id: 'pipeline',
        title: 'Pipeline Candidatos',
        description: 'Gestión candidatos',
        icon: Users
      },
      {
        id: 'metricas',
        title: 'Métricas por Zona',
        description: 'KPIs operacionales',
        icon: BarChart3
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Análisis & IA',
    description: 'Inteligencia artificial y análisis',
    icon: Bot,
    children: [
      {
        id: 'ai',
        title: 'Análisis AI Principal',
        description: 'Insights inteligentes',
        icon: Bot
      },
      {
        id: 'alerts',
        title: 'Alertas Inteligentes',
        description: 'Alertas generadas por IA',
        icon: AlertTriangle
      },
      {
        id: 'rotacion',
        title: 'Análisis de Rotación',
        description: 'Patrones de rotación',
        icon: TrendingUp
      },
      {
        id: 'temporal',
        title: 'Patrones Temporales',
        description: 'Análisis temporal avanzado',
        icon: BarChart3
      },
      {
        id: 'ml',
        title: 'Machine Learning',
        description: 'Predicciones avanzadas',
        icon: Database
      },
      {
        id: 'cohort',
        title: 'Análisis de Cohortes',
        description: 'Retención y productividad',
        icon: BarChart3
      }
    ]
  },
  {
    id: 'simulation',
    title: 'Simulación & ROI',
    description: 'Escenarios y análisis financiero',
    icon: TestTube,
    children: [
      {
        id: 'simulator',
        title: 'Simulador Inteligente',
        description: 'Simulaciones con IA',
        icon: TestTube
      },
      {
        id: 'simulation',
        title: 'Escenarios Manuales',
        description: 'Simulación de escenarios',
        icon: Target
      },
      {
        id: 'roi',
        title: 'Análisis ROI',
        description: 'Retorno de inversión',
        icon: TrendingUp
      }
    ]
  }
];

export function NavigationSidebar({ 
  activeSection, 
  onSectionChange,
  criticalAlerts = 0,
  urgentClusters = 0,
  totalDeficit = 0,
  activeCandidates = 0
}: NavigationSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard']);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getActiveSectionId = () => {
    for (const section of navigationItems) {
      if (section.children?.some(child => child.id === activeSection)) {
        return section.id;
      }
    }
    return 'dashboard';
  };

  const activeSectionId = getActiveSectionId();

  // Auto-expand active section
  React.useEffect(() => {
    if (!expandedSections.includes(activeSectionId)) {
      setExpandedSections(prev => [...prev, activeSectionId]);
    }
  }, [activeSectionId]);

  const getDynamicBadge = (sectionId: string) => {
    switch (sectionId) {
      case 'dashboard':
        // Solo mostrar si hay déficit crítico (>10)
        return totalDeficit > 10 ? totalDeficit.toString() : null;
      case 'operations':
        // Solo mostrar alertas críticas reales
        return criticalAlerts > 0 ? criticalAlerts.toString() : null;
      case 'analytics':
        // Solo mostrar si hay clusters urgentes reales
        return urgentClusters > 0 ? urgentClusters.toString() : null;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      'border-r border-border bg-card/30 transition-all duration-300 ease-in-out',
      isCollapsed ? 'w-16' : 'w-72'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="font-semibold text-foreground">Reclutamiento</h2>
              <p className="text-sm text-muted-foreground">Sistema Nacional</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-2 space-y-1">
        {navigationItems.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const isActive = activeSectionId === section.id;
          const dynamicBadge = getDynamicBadge(section.id);

          return (
            <div key={section.id} className="space-y-1">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start p-3 h-auto transition-colors",
                  isActive && "bg-primary/10 text-primary",
                  isCollapsed && "px-2"
                )}
                onClick={() => toggleSection(section.id)}
              >
                <div className={cn(
                  "flex items-center w-full",
                  isCollapsed ? "justify-center" : "justify-between"
                )}>
                  <div className="flex items-center gap-3">
                    <section.icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <div className="text-left min-w-0">
                        <div className="font-medium truncate">{section.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {section.description}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!isCollapsed && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {dynamicBadge && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                          {dynamicBadge}
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </div>
                  )}
                </div>
              </Button>

              {isExpanded && !isCollapsed && section.children && (
                <div className="ml-6 space-y-1">
                  {section.children.map((child) => (
                    <Button
                      key={child.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start p-2 h-auto",
                        activeSection === child.id && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => onSectionChange(child.id)}
                    >
                      <div className="flex items-center gap-2">
                        <child.icon className="h-3 w-3" />
                        <div className="text-left min-w-0">
                          <div className="text-sm font-medium truncate">{child.title}</div>
                          <div className="text-xs opacity-80 truncate">
                            {child.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border bg-muted/20 mt-auto">
          <div className="text-xs text-muted-foreground mb-2">Estado Actual</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-destructive/10 rounded">
              <div className="font-bold text-destructive">{totalDeficit}</div>
              <div className="text-muted-foreground">Déficit</div>
            </div>
            <div className="text-center p-2 bg-warning/10 rounded">
              <div className="font-bold text-warning">{criticalAlerts}</div>
              <div className="text-muted-foreground">Alertas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
