import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Clock, TrendingUp, TrendingDown, Minus, 
  AlertTriangle, CheckCircle2, XCircle, Target,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SLAMetric {
  phaseId: string;
  phaseName: string;
  module: string;
  moduleColor: string;
  targetSLA: string;
  targetMinutes: number;
  avgActual: number;
  complianceRate: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  sampleSize: number;
  isCritical?: boolean;
}

// Mock SLA metrics data - In production, this would come from the database
const slaMetrics: SLAMetric[] = [
  // Critical Path SLAs
  { 
    phaseId: 'lead_contact', phaseName: 'Lead → Contacto Inicial', 
    module: 'Supply', moduleColor: '#10B981',
    targetSLA: '24 horas', targetMinutes: 1440,
    avgActual: 1320, complianceRate: 94, trend: 'up', sampleSize: 156,
    isCritical: true
  },
  { 
    phaseId: 'vapi_call', phaseName: 'Entrevista VAPI', 
    module: 'Supply', moduleColor: '#10B981',
    targetSLA: '15 minutos', targetMinutes: 15,
    avgActual: 12, complianceRate: 98, trend: 'stable', sampleSize: 89
  },
  { 
    phaseId: 'psico_eval', phaseName: 'Evaluación Psicométrica', 
    module: 'Supply', moduleColor: '#10B981',
    targetSLA: '3 días', targetMinutes: 4320,
    avgActual: 3800, complianceRate: 87, trend: 'up', sampleSize: 72
  },
  { 
    phaseId: 'liberation', phaseName: 'Liberación a Planeación', 
    module: 'Supply', moduleColor: '#10B981',
    targetSLA: '1 día', targetMinutes: 1440,
    avgActual: 980, complianceRate: 96, trend: 'up', sampleSize: 45,
    isCritical: true
  },
  { 
    phaseId: 'service_reception', phaseName: 'Recepción de Solicitud', 
    module: 'Planeación', moduleColor: '#8B5CF6',
    targetSLA: '1 hora', targetMinutes: 60,
    avgActual: 42, complianceRate: 91, trend: 'down', sampleSize: 523,
    isCritical: true
  },
  { 
    phaseId: 'custodio_assign', phaseName: 'Asignación de Custodio', 
    module: 'Planeación', moduleColor: '#8B5CF6',
    targetSLA: '15 minutos', targetMinutes: 15,
    avgActual: 18, complianceRate: 76, trend: 'down', sampleSize: 498,
    isCritical: true
  },
  { 
    phaseId: 'installation', phaseName: 'Instalación GPS', 
    module: 'Instaladores', moduleColor: '#F59E0B',
    targetSLA: '5 días', targetMinutes: 7200,
    avgActual: 5400, complianceRate: 89, trend: 'up', sampleSize: 38
  },
  { 
    phaseId: 'alert_response', phaseName: 'Respuesta a Alertas', 
    module: 'Monitoreo', moduleColor: '#EF4444',
    targetSLA: '5 minutos', targetMinutes: 5,
    avgActual: 3, complianceRate: 99, trend: 'stable', sampleSize: 234,
    isCritical: true
  },
];

// Helpers
const getComplianceColor = (rate: number) => {
  if (rate >= 95) return 'text-emerald-600 dark:text-emerald-400';
  if (rate >= 80) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

const getComplianceBg = (rate: number) => {
  if (rate >= 95) return 'bg-emerald-100 dark:bg-emerald-500/20';
  if (rate >= 80) return 'bg-amber-100 dark:bg-amber-500/20';
  return 'bg-red-100 dark:bg-red-500/20';
};

const getComplianceIcon = (rate: number) => {
  if (rate >= 95) return <CheckCircle2 size={16} className="text-emerald-500" />;
  if (rate >= 80) return <AlertTriangle size={16} className="text-amber-500" />;
  return <XCircle size={16} className="text-red-500" />;
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return <TrendingUp size={14} className="text-emerald-500" />;
    case 'down': return <TrendingDown size={14} className="text-red-500" />;
    case 'stable': return <Minus size={14} className="text-muted-foreground" />;
  }
};

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
};

interface SLACompliancePanelProps {
  className?: string;
}

export const SLACompliancePanel: React.FC<SLACompliancePanelProps> = ({ className }) => {
  // Calculate summary stats
  const stats = useMemo(() => {
    const total = slaMetrics.length;
    const criticalMetrics = slaMetrics.filter(m => m.isCritical);
    const avgCompliance = Math.round(slaMetrics.reduce((sum, m) => sum + m.complianceRate, 0) / total);
    const criticalCompliance = Math.round(criticalMetrics.reduce((sum, m) => sum + m.complianceRate, 0) / criticalMetrics.length);
    const belowTarget = slaMetrics.filter(m => m.complianceRate < 80).length;
    const improving = slaMetrics.filter(m => m.trend === 'up').length;
    const declining = slaMetrics.filter(m => m.trend === 'down').length;
    
    return { total, avgCompliance, criticalCompliance, belowTarget, improving, declining };
  }, []);

  // Sort by compliance rate (worst first for attention)
  const sortedMetrics = useMemo(() => {
    return [...slaMetrics].sort((a, b) => a.complianceRate - b.complianceRate);
  }, []);

  // Separate critical and non-critical
  const criticalMetrics = sortedMetrics.filter(m => m.isCritical);
  const otherMetrics = sortedMetrics.filter(m => !m.isCritical);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                stats.avgCompliance >= 90 ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-amber-100 dark:bg-amber-500/20"
              )}>
                <Target size={20} className={stats.avgCompliance >= 90 ? "text-emerald-600" : "text-amber-600"} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgCompliance}%</p>
                <p className="text-sm text-muted-foreground">Cumplimiento Global</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                stats.criticalCompliance >= 90 ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-red-100 dark:bg-red-500/20"
              )}>
                <AlertTriangle size={20} className={stats.criticalCompliance >= 90 ? "text-emerald-600" : "text-red-600"} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.criticalCompliance}%</p>
                <p className="text-sm text-muted-foreground">SLAs Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                <ArrowUpRight size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.improving}</p>
                <p className="text-sm text-muted-foreground">Mejorando</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                stats.belowTarget > 0 ? "bg-red-100 dark:bg-red-500/20" : "bg-muted"
              )}>
                <ArrowDownRight size={20} className={stats.belowTarget > 0 ? "text-red-600" : "text-muted-foreground"} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.belowTarget}</p>
                <p className="text-sm text-muted-foreground">Bajo Meta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical SLAs */}
      <Card>
        <CardHeader className="border-b bg-red-50/50 dark:bg-red-500/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            SLAs Críticos
            <Badge variant="secondary" className="ml-2">{criticalMetrics.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {criticalMetrics.map(metric => (
              <SLAMetricRow key={metric.phaseId} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Other SLAs */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Otros SLAs
            <Badge variant="secondary" className="ml-2">{otherMetrics.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {otherMetrics.map(metric => (
              <SLAMetricRow key={metric.phaseId} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Individual SLA metric row component
const SLAMetricRow: React.FC<{ metric: SLAMetric }> = ({ metric }) => {
  const isOverTarget = metric.avgActual > metric.targetMinutes;
  
  return (
    <div className="p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4">
        {/* Module indicator */}
        <div 
          className="w-1 h-12 rounded-full shrink-0"
          style={{ backgroundColor: metric.moduleColor }}
        />
        
        {/* Phase info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{metric.phaseName}</span>
            {metric.isCritical && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Crítico
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{metric.module}</span>
            <span>•</span>
            <span>n={metric.sampleSize}</span>
          </div>
        </div>

        {/* SLA Target */}
        <div className="text-center shrink-0">
          <div className="flex items-center gap-1 text-sm">
            <Clock size={14} className="text-muted-foreground" />
            <span className="font-medium">{metric.targetSLA}</span>
          </div>
          <div className="text-xs text-muted-foreground">Meta</div>
        </div>

        {/* Actual */}
        <div className="text-center shrink-0">
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isOverTarget ? "text-red-600" : "text-emerald-600"
          )}>
            {formatTime(metric.avgActual)}
            {isOverTarget && <AlertTriangle size={12} />}
          </div>
          <div className="text-xs text-muted-foreground">Promedio</div>
        </div>

        {/* Compliance Gauge */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-24 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  {getComplianceIcon(metric.complianceRate)}
                  <span className={cn("text-sm font-bold", getComplianceColor(metric.complianceRate))}>
                    {metric.complianceRate}%
                  </span>
                </div>
                <Progress 
                  value={metric.complianceRate} 
                  className="h-2"
                  // Custom color based on compliance
                  style={{
                    '--progress-background': metric.complianceRate >= 95 
                      ? 'rgb(16, 185, 129)' 
                      : metric.complianceRate >= 80 
                        ? 'rgb(245, 158, 11)' 
                        : 'rgb(239, 68, 68)'
                  } as React.CSSProperties}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div className="font-semibold">
                  {metric.complianceRate >= 95 ? 'Excelente' : 
                   metric.complianceRate >= 80 ? 'Aceptable' : 'Requiere Atención'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {metric.complianceRate}% dentro del SLA
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Trend */}
        <div className="flex items-center gap-1 shrink-0 w-16 justify-center">
          {getTrendIcon(metric.trend)}
          <span className="text-xs text-muted-foreground capitalize">
            {metric.trend === 'up' ? 'Mejora' : metric.trend === 'down' ? 'Baja' : 'Estable'}
          </span>
        </div>
      </div>
    </div>
  );
};
