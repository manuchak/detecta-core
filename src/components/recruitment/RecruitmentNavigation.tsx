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
  DollarSign,
  Calendar,
  BarChart3,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  badge?: string;
  badgeVariant?: 'default' | 'destructive' | 'secondary' | 'outline';
  subsections: {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
  }[];
}

interface RecruitmentNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  criticalAlerts?: number;
  urgentClusters?: number;
  totalDeficit?: number;
  activeCandidates?: number;
}

const navigationSections: NavigationSection[] = [
  {
    id: 'planning',
    title: 'Planificación Estratégica',
    description: 'Visión multi-mes y estrategia nacional',
    icon: Target,
    badge: 'Crítico',
    badgeVariant: 'destructive',
    subsections: [
      {
        id: 'planificacion',
        title: 'Timeline Multi-Mes',
        description: 'Planificación 3-6 meses',
        icon: Calendar
      },
      {
        id: 'mapa',
        title: 'Mapa Nacional',
        description: 'Vista geográfica completa',
        icon: Map
      }
    ]
  },
  {
    id: 'operations',
    title: 'Operaciones Activas',
    description: 'Alertas, pipeline y métricas en tiempo real',
    icon: Zap,
    badge: 'Tiempo Real',
    badgeVariant: 'default',
    subsections: [
      {
        id: 'alertas',
        title: 'Sistema de Alertas',
        description: 'Alertas críticas y preventivas',
        icon: AlertTriangle
      },
      {
        id: 'pipeline',
        title: 'Pipeline Candidatos',
        description: 'Flujo de reclutamiento',
        icon: Users
      },
      {
        id: 'metricas',
        title: 'Métricas Operativas',
        description: 'KPIs por zona',
        icon: BarChart3
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Análisis Avanzado',
    description: 'Rotación, patrones y machine learning',
    icon: Database,
    badge: 'IA',
    badgeVariant: 'secondary',
    subsections: [
      {
        id: 'rotacion',
        title: 'Análisis Rotación',
        description: 'Impacto en reclutamiento',
        icon: TrendingUp
      },
      {
        id: 'temporal',
        title: 'Patrones Temporales',
        description: 'Estacionalidad y tendencias',
        icon: BarChart3
      },
      {
        id: 'ml',
        title: 'Machine Learning',
        description: 'Predicciones IA',
        icon: Bot
      }
    ]
  },
  {
    id: 'simulation',
    title: 'Simulación y ROI',
    description: 'Escenarios y análisis financiero',
    icon: TestTube,
    badge: 'Estratégico',
    badgeVariant: 'outline',
    subsections: [
      {
        id: 'simulation',
        title: 'Simulación Escenarios',
        description: 'Modelado de estrategias',
        icon: TestTube
      },
      {
        id: 'roi',
        title: 'ROI y Presupuestos',
        description: 'Análisis financiero',
        icon: DollarSign
      }
    ]
  }
];

export function RecruitmentNavigation({ 
  activeSection, 
  onSectionChange,
  criticalAlerts = 0,
  urgentClusters = 0,
  totalDeficit = 0,
  activeCandidates = 0
}: RecruitmentNavigationProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['planning']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getActiveSectionId = () => {
    for (const section of navigationSections) {
      if (section.subsections.some(sub => sub.id === activeSection)) {
        return section.id;
      }
    }
    return 'planning';
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
      case 'planning':
        return totalDeficit > 0 ? `${totalDeficit} déficit` : null;
      case 'operations':
        return criticalAlerts > 0 ? `${criticalAlerts} críticas` : null;
      case 'analytics':
        return urgentClusters > 0 ? `${urgentClusters} urgentes` : null;
      case 'simulation':
        return activeCandidates > 0 ? `${activeCandidates} activos` : null;
      default:
        return null;
    }
  };

  return (
    <div className="w-80 border-r border-border bg-card/50 h-full overflow-y-auto">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Estrategia Nacional
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sistema de reclutamiento inteligente
        </p>
      </div>

      <div className="p-4 space-y-2">
        {navigationSections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const isActive = activeSectionId === section.id;
          const dynamicBadge = getDynamicBadge(section.id);

          return (
            <div key={section.id} className="space-y-1">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start p-3 h-auto",
                  isActive && "bg-primary/10 text-primary"
                )}
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {section.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {dynamicBadge && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                        {dynamicBadge}
                      </Badge>
                    )}
                    {section.badge && (
                      <Badge variant={section.badgeVariant} className="text-xs px-1.5 py-0.5">
                        {section.badge}
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </Button>

              {isExpanded && (
                <div className="ml-8 space-y-1">
                  {section.subsections.map((subsection) => (
                    <Button
                      key={subsection.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start p-2 h-auto",
                        activeSection === subsection.id && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => onSectionChange(subsection.id)}
                    >
                      <div className="flex items-center gap-3">
                        <subsection.icon className="h-4 w-4" />
                        <div className="text-left">
                          <div className="text-sm font-medium">{subsection.title}</div>
                          <div className="text-xs opacity-80">
                            {subsection.description}
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

      {/* Quick Stats Footer */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="text-xs text-muted-foreground mb-2">Resumen Rápido</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-destructive/10 rounded">
            <div className="font-bold text-destructive">{totalDeficit}</div>
            <div className="text-muted-foreground">Déficit Total</div>
          </div>
          <div className="text-center p-2 bg-warning/10 rounded">
            <div className="font-bold text-warning">{criticalAlerts}</div>
            <div className="text-muted-foreground">Alertas</div>
          </div>
        </div>
      </div>
    </div>
  );
}