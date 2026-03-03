import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ClipboardCheck, FileWarning, Calendar, Shield, AlertTriangle, Activity, Clock, Target, CheckCircle2 } from 'lucide-react';
import { useComplianceFromIncidents, getTrafficLight } from '@/hooks/security/useComplianceFromIncidents';

// =============================================================================
// EXISTING COMPLIANCE DATA HOOK (protocols + trainings)
// =============================================================================

function useComplianceData() {
  const protocolsQuery = useQuery({
    queryKey: ['compliance-protocols'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('protocolos_seguridad')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data as { id: string; nombre: string; tipo_servicio: string; checklist_items: any[] }[];
    },
  });

  const trainingsQuery = useQuery({
    queryKey: ['compliance-trainings'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('capacitaciones_seguridad')
        .select('*')
        .order('fecha_vencimiento', { ascending: true });
      if (error) throw error;
      return data as {
        id: string; custodio_id: string; nombre_capacitacion: string;
        fecha_completado: string | null; fecha_vencimiento: string | null;
        status: string;
      }[];
    },
  });

  const protocols = protocolsQuery.data || [];
  const trainings = trainingsQuery.data || [];

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  const completedTrainings = trainings.filter(t => t.status === 'completado' || t.fecha_completado);
  const pendingTrainings = trainings.filter(t => t.status === 'pendiente' && !t.fecha_completado);
  const expiringTrainings = trainings.filter(t => {
    if (!t.fecha_vencimiento) return false;
    const expDate = new Date(t.fecha_vencimiento);
    return expDate >= now && expDate <= in30Days;
  });
  const expiredTrainings = trainings.filter(t => {
    if (!t.fecha_vencimiento) return false;
    return new Date(t.fecha_vencimiento) < now;
  });

  const completionRate = trainings.length > 0
    ? Math.round((completedTrainings.length / trainings.length) * 100)
    : 0;

  return {
    protocols, trainings, completedTrainings, pendingTrainings,
    expiringTrainings, expiredTrainings, completionRate,
    isLoading: protocolsQuery.isLoading || trainingsQuery.isLoading,
  };
}

// =============================================================================
// TRAFFIC LIGHT INDICATOR
// =============================================================================

function TrafficLightDot({ value, greenThreshold = 80, amberThreshold = 60 }: { value: number; greenThreshold?: number; amberThreshold?: number }) {
  const light = getTrafficLight(value, greenThreshold, amberThreshold);
  const colors = {
    green: 'bg-green-500',
    amber: 'bg-yellow-500',
    red: 'bg-red-500',
  };
  return <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', colors[light])} />;
}

// =============================================================================
// INCIDENT COMPLIANCE SECTION
// =============================================================================

function IncidentComplianceSection() {
  const { data: metrics, isLoading } = useComplianceFromIncidents();

  if (isLoading) {
    return <Skeleton className="h-64 rounded-lg" />;
  }

  if (!metrics || metrics.totalIncidents === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Cumplimiento — Gestión de Incidentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Sin incidentes operativos registrados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rows = [
    { label: 'Documentación (≥3 entradas)', value: metrics.documentationRate, sub: `${metrics.totalWithTimeline}/${metrics.totalIncidents}`, icon: ClipboardCheck },
    { label: 'Cobertura de Controles', value: metrics.controlCoverageRate, sub: `${metrics.totalWithControls}/${metrics.totalIncidents}`, icon: Shield },
    { label: 'Efectividad de Controles', value: metrics.controlEffectivenessRate, sub: `${metrics.controlEffective} efectivos / ${metrics.controlFailed} fallidos`, icon: CheckCircle2 },
    { label: 'Resolución en SLA', value: metrics.resolvedOnTime, sub: `${metrics.totalResolved} resueltos (prom: ${metrics.avgResolutionHours}h)`, icon: Clock, greenThreshold: 80, amberThreshold: 60 },
    { label: 'Tasa Atribuibilidad', value: metrics.atribuibilityRate, sub: `${metrics.totalAtribuibles} atribuibles a operación`, icon: Target, greenThreshold: 20, amberThreshold: 40, inverted: true },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Cumplimiento — Gestión de Incidentes (ISO 28000 §8)
          </CardTitle>
          <Badge variant="outline" className={cn(
            'text-xs font-bold',
            metrics.isoScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            metrics.isoScore >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}>
            ISO Score: {metrics.isoScore}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* MTTR highlight */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-xs text-muted-foreground">MTTR (Detección → Acción):</span>
            <span className="text-sm font-bold text-foreground ml-2">{metrics.avgMTTR}h</span>
          </div>
        </div>

        {/* Metric rows */}
        {rows.map(row => {
          const green = row.greenThreshold ?? 80;
          const amber = row.amberThreshold ?? 60;
          const displayValue = row.inverted ? (100 - row.value) : row.value;
          return (
            <div key={row.label} className="space-y-1">
              <div className="flex items-center gap-2">
                <TrafficLightDot
                  value={row.inverted ? (100 - row.value) : row.value}
                  greenThreshold={row.inverted ? (100 - green) : green}
                  amberThreshold={row.inverted ? (100 - amber) : amber}
                />
                <row.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground flex-1">{row.label}</span>
                <span className="text-xs font-bold text-foreground">{row.value}%</span>
              </div>
              <div className="flex items-center gap-2 ml-7">
                <Progress value={row.value} className="h-1 flex-1" />
                <span className="text-[10px] text-muted-foreground w-32 text-right">{row.sub}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ComplianceTracker() {
  const {
    protocols, trainings, completedTrainings, pendingTrainings,
    expiringTrainings, expiredTrainings, completionRate, isLoading,
  } = useComplianceData();

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Incident-based compliance (NEW - Block 4) */}
      <IncidentComplianceSection />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tasa de Cumplimiento</p>
            <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
            <Progress value={completionRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-muted-foreground/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Protocolos Activos</p>
            <p className="text-2xl font-bold text-foreground">{protocols.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">definidos en sistema</p>
          </CardContent>
        </Card>
        <Card className={cn("border-l-4", expiringTrainings.length > 0 ? "border-l-yellow-500" : "border-l-green-500")}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Por Vencer (30d)</p>
            <p className="text-2xl font-bold text-foreground">{expiringTrainings.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">capacitaciones</p>
          </CardContent>
        </Card>
        <Card className={cn("border-l-4", expiredTrainings.length > 0 ? "border-l-red-500" : "border-l-green-500")}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Vencidos</p>
            <p className="text-2xl font-bold text-foreground">{expiredTrainings.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">requieren atención</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Protocols */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Protocolos de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            {protocols.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Sin protocolos definidos aún</p>
                <p className="text-[10px] mt-1">Registra protocolos por tipo de servicio desde la administración</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {protocols.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded border border-border/50">
                    <div>
                      <p className="text-xs font-medium text-foreground">{p.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">{p.tipo_servicio}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {Array.isArray(p.checklist_items) ? p.checklist_items.length : 0} items
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Training / Document Expiry */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Capacitaciones y Vencimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trainings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileWarning className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Sin capacitaciones registradas</p>
                <p className="text-[10px] mt-1">Las capacitaciones de seguridad se registran por custodio</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {[...expiredTrainings, ...expiringTrainings, ...pendingTrainings].slice(0, 15).map(t => {
                  const isExpired = t.fecha_vencimiento && new Date(t.fecha_vencimiento) < new Date();
                  const isExpiring = t.fecha_vencimiento && !isExpired && new Date(t.fecha_vencimiento) <= new Date(Date.now() + 30 * 86400000);
                  return (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded border border-border/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{t.nombre_capacitacion}</p>
                        {t.fecha_vencimiento && (
                          <p className={cn("text-[10px]", isExpired ? 'text-red-600' : isExpiring ? 'text-yellow-600' : 'text-muted-foreground')}>
                            Vence: {new Date(t.fecha_vencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={cn('text-[10px]',
                        isExpired ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        isExpiring ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        t.status === 'completado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {isExpired ? 'Vencido' : isExpiring ? 'Por vencer' : t.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
