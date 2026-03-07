import React, { useState, useEffect } from 'react';
import { useOperationalPulse, PulseAlertService, PulseMonitorista } from '@/hooks/useOperationalPulse';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, Clock, Radio, Users, CheckCircle2, Loader2, MapPin, Navigation, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

/* ─── Live Clock ─── */
const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const date = now.toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const time = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  return (
    <div className="text-xs text-muted-foreground tabular-nums">
      {date} · {time} CST
    </div>
  );
};

/* ─── Phase Card ─── */
interface PhaseCardProps {
  value: number;
  label: string;
  icon: React.ElementType;
  accent: string;
  pulse?: boolean;
}

const PhaseCard = ({ value, label, icon: Icon, accent, pulse }: PhaseCardProps) => (
  <div className={cn(
    'rounded-xl border p-3 flex flex-col items-center justify-center gap-1 transition-all',
    'bg-card border-border/60',
    pulse && value > 0 && 'border-destructive/50 animate-pulse'
  )}>
    <Icon className={cn('h-4 w-4', accent)} />
    <span className={cn('text-2xl font-bold tabular-nums', accent)}>{value}</span>
    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-tight text-center">{label}</span>
  </div>
);

/* ─── Alert Row ─── */
const AlertRow = ({ alert }: { alert: PulseAlertService }) => (
  <div className={cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg border',
    alert.nivel === 'critical'
      ? 'bg-destructive/10 border-destructive/30'
      : 'bg-amber-500/10 border-amber-500/30'
  )}>
    <AlertTriangle className={cn(
      'h-4 w-4 flex-shrink-0',
      alert.nivel === 'critical' ? 'text-destructive' : 'text-amber-500'
    )} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{alert.cliente}</p>
      <p className="text-xs text-muted-foreground truncate">
        {alert.custodio || 'Sin custodio'} · {alert.origen} → {alert.destino}
      </p>
    </div>
    <div className={cn(
      'flex-shrink-0 text-sm font-bold tabular-nums',
      alert.nivel === 'critical' ? 'text-destructive' : 'text-amber-500'
    )}>
      {alert.minutosInactivo}m
    </div>
  </div>
);

/* ─── Monitorista Row ─── */
const MonitoristaRow = ({ m, maxServices }: { m: PulseMonitorista; maxServices: number }) => (
  <div className="flex items-center gap-3 py-2">
    <div className={cn(
      'w-2 h-2 rounded-full flex-shrink-0',
      m.enTurno ? 'bg-emerald-500' : 'bg-muted-foreground/30'
    )} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{m.nombre}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <Progress
          value={maxServices > 0 ? (m.serviciosAsignados / maxServices) * 100 : 0}
          className="h-1.5 flex-1"
        />
        <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
          {m.serviciosAsignados} svcs
        </span>
      </div>
    </div>
    <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
      {m.eventosRegistrados} evt
    </span>
  </div>
);

/* ─── Touchpoint Bar ─── */
const TouchpointBar = ({ nombre, promedioMin, maxMin }: { nombre: string; promedioMin: number; maxMin: number }) => {
  const pct = maxMin > 0 ? (promedioMin / maxMin) * 100 : 0;
  const color = promedioMin <= 15 ? 'bg-emerald-500' : promedioMin <= 25 ? 'bg-amber-500' : 'bg-destructive';
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-sm text-foreground w-24 truncate">{nombre}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground tabular-nums w-8 text-right">{promedioMin}m</span>
    </div>
  );
};

/* ─── Section Header ─── */
const SectionHeader = ({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
    </div>
    {badge}
  </div>
);

/* ═══════ MAIN ═══════ */
export const MobileOperationalDashboard: React.FC = () => {
  const pulse = useOperationalPulse();

  if (pulse.isLoading) {
    return (
      <div className="space-y-4 p-4 max-w-lg mx-auto">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const maxServices = Math.max(...pulse.monitoristas.listado.map(m => m.serviciosAsignados), 1);
  const maxTouchpoint = Math.max(...pulse.touchpoints.porMonitorista.map(t => t.promedioMin), 1);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-lg font-semibold text-foreground">Pulso Operativo</h2>
        </div>
        <LiveClock />
      </div>

      {/* Phase Grid 2x3 */}
      <div className="grid grid-cols-3 gap-2.5">
        <PhaseCard value={pulse.fases.porSalir} label="Por Salir" icon={Clock} accent="text-blue-500" />
        <PhaseCard value={pulse.fases.enRuta} label="En Ruta" icon={Navigation} accent="text-emerald-500" />
        <PhaseCard value={pulse.fases.enDestino} label="En Destino" icon={MapPin} accent="text-violet-500" />
        <PhaseCard value={pulse.fases.enEvento} label="Evento" icon={Zap} accent="text-purple-500" />
        <PhaseCard value={pulse.fases.enAlerta} label="Alerta" icon={AlertTriangle} accent="text-destructive" pulse />
        <PhaseCard value={pulse.fases.completados} label="Completados" icon={CheckCircle2} accent="text-emerald-600" />
      </div>

      {/* Active services banner */}
      <div className="flex items-center justify-between bg-primary/10 rounded-xl px-4 py-3 border border-primary/20">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Servicios activos</span>
        </div>
        <span className="text-xl font-bold text-primary tabular-nums">{pulse.totalServiciosActivos}</span>
      </div>

      {/* Alerts */}
      {pulse.alertas.servicios.length > 0 && (
        <div className="space-y-2">
          <SectionHeader
            icon={AlertTriangle}
            title="Alertas"
            badge={
              <div className="flex gap-1.5">
                {pulse.alertas.criticalCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/20 text-destructive">
                    {pulse.alertas.criticalCount} CRÍTICA{pulse.alertas.criticalCount > 1 ? 'S' : ''}
                  </span>
                )}
                {pulse.alertas.warningCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600">
                    {pulse.alertas.warningCount}
                  </span>
                )}
              </div>
            }
          />
          <div className="space-y-1.5">
            {pulse.alertas.servicios.slice(0, 5).map(a => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </div>
        </div>
      )}

      {/* Touchpoints */}
      {pulse.touchpoints.porMonitorista.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <SectionHeader
            icon={Clock}
            title="Touchpoints"
            badge={
              <span className="text-xs font-medium text-muted-foreground">
                Prom: <span className="text-foreground font-bold">{pulse.touchpoints.promedioGlobalMin}m</span>
              </span>
            }
          />
          <div className="space-y-0.5">
            {pulse.touchpoints.porMonitorista.map(t => (
              <TouchpointBar key={t.nombre} {...t} maxMin={maxTouchpoint} />
            ))}
          </div>
        </div>
      )}

      {/* Monitoristas */}
      <div className="rounded-xl border border-border bg-card p-4">
        <SectionHeader
          icon={Users}
          title="Monitoristas"
          badge={
            <span className="text-xs font-medium text-muted-foreground">
              <span className="text-emerald-500 font-bold">{pulse.monitoristas.activos}</span>
              /{pulse.monitoristas.totalEnTurno}
            </span>
          }
        />
        <div className="divide-y divide-border/50">
          {pulse.monitoristas.listado.map(m => (
            <MonitoristaRow key={m.id} m={m} maxServices={maxServices} />
          ))}
          {pulse.monitoristas.listado.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin monitoristas registrados</p>
          )}
        </div>
      </div>

      {/* Last update */}
      <p className="text-[10px] text-center text-muted-foreground">
        Datos actualizados cada 15s · {pulse.ultimaActualizacion.toLocaleTimeString('es-MX')}
      </p>
    </div>
  );
};
