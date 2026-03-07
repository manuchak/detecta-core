import React, { useState, useEffect, useCallback } from 'react';
import { useOperationalPulse, PulseAlertService, PulseMonitorista } from '@/hooks/useOperationalPulse';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, Clock, Users, CheckCircle2, MapPin, Navigation, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertServiceDrawer } from './AlertServiceDrawer';
import { PhaseServicesDrawer } from './PhaseServicesDrawer';

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
  onDoubleClick?: () => void;
}

const PhaseCard = ({ value, label, icon: Icon, accent, pulse, onDoubleClick }: PhaseCardProps) => (
  <div
    className={cn(
      'rounded-xl border p-3 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none active:scale-[0.97]',
      'bg-card border-border/60',
      pulse && value > 0 && 'border-destructive/50 animate-pulse'
    )}
    onDoubleClick={onDoubleClick}
  >
    <Icon className={cn('h-4 w-4', accent)} />
    <span className={cn('text-2xl font-bold tabular-nums', accent)}>{value}</span>
    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-tight text-center">{label}</span>
  </div>
);

/* ─── Alert Row ─── */
const AlertRow = ({ alert, onDoubleClick }: { alert: PulseAlertService; onDoubleClick?: () => void }) => (
  <div
    className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer select-none active:scale-[0.98] transition-transform',
      alert.nivel === 'critical'
        ? 'bg-destructive/10 border-destructive/30'
        : 'bg-amber-500/10 border-amber-500/30'
    )}
    onDoubleClick={onDoubleClick}
  >
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

/* ─── Touchpoint Gauge (semicircular SVG) ─── */
const TouchpointGauge = ({ value }: { value: number }) => {
  const maxScale = 60; // max 60 minutes
  const clamped = Math.min(Math.max(value, 0), maxScale);
  const ratio = clamped / maxScale;

  // SVG arc params
  const cx = 100, cy = 90;
  const r = 70;
  const startAngle = Math.PI; // left
  const endAngle = 0; // right
  const totalArc = Math.PI; // 180°
  const sweepAngle = ratio * totalArc;

  // Background arc (full semicircle)
  const bgX1 = cx + r * Math.cos(startAngle);
  const bgY1 = cy - r * Math.sin(startAngle);
  const bgX2 = cx + r * Math.cos(endAngle);
  const bgY2 = cy - r * Math.sin(endAngle);
  const bgPath = `M ${bgX1} ${bgY1} A ${r} ${r} 0 0 1 ${bgX2} ${bgY2}`;

  // Value arc
  const valEndAngle = startAngle - sweepAngle;
  const valX2 = cx + r * Math.cos(valEndAngle);
  const valY2 = cy - r * Math.sin(valEndAngle);
  const largeArc = sweepAngle > Math.PI ? 1 : 0;
  const valPath = `M ${bgX1} ${bgY1} A ${r} ${r} 0 ${largeArc} 1 ${valX2} ${valY2}`;

  // Color by threshold
  const color = value < 30
    ? 'hsl(var(--chart-2))' // green
    : value <= 40
      ? 'hsl(45, 93%, 47%)' // amber
      : 'hsl(var(--destructive))'; // red

  const label = value < 30 ? 'Excelente' : value <= 40 ? 'Aceptable' : 'Atención';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-44 h-auto">
        {/* Background track */}
        <path
          d={bgPath}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Value arc */}
        {value > 0 && (
          <path
            d={valPath}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            style={{ transition: 'all 0.6s ease-out' }}
          />
        )}
        {/* Center value */}
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          className="text-3xl font-bold"
          fill="currentColor"
          style={{ fontSize: '32px', fontWeight: 700 }}
        >
          {value}
        </text>
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          style={{ fontSize: '11px', fontWeight: 500 }}
        >
          min promedio
        </text>
      </svg>
      <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color }}>
        {label}
      </span>
    </div>
  );
};

/* ─── Monitorista Row (compact, active only) ─── */
const MonitoristaRow = ({ m, maxServices }: { m: PulseMonitorista; maxServices: number }) => (
  <div className="flex items-center gap-3 py-2.5">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">
        {m.nombre.split(' ').slice(0, 2).join(' ')}
      </p>
      <div className="flex items-center gap-2 mt-0.5">
        <Progress
          value={maxServices > 0 ? (m.serviciosAsignados / maxServices) * 100 : 0}
          className="h-1.5 flex-1"
        />
        <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
          {m.serviciosAsignados}s
        </span>
      </div>
    </div>
    <span className="text-xs font-semibold text-muted-foreground tabular-nums flex-shrink-0">
      {m.eventosRegistrados}
      <span className="text-[9px] font-normal ml-0.5">evt</span>
    </span>
  </div>
);

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
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  const phaseFilteredServices = React.useMemo(() => {
    if (!selectedPhase) return [];
    return pulse.rawServicios.filter(s => {
      switch (selectedPhase) {
        case 'Por Salir': return s.phase === 'por_iniciar';
        case 'En Ruta': return s.phase === 'en_curso' && s.alertLevel === 'normal';
        case 'En Destino': return s.phase === 'en_destino';
        case 'Evento': return s.phase === 'evento_especial';
        case 'Alerta': return (s.alertLevel === 'warning' || s.alertLevel === 'critical') && s.minutesSinceLastAction <= 1440;
        case 'Completados': return (s.phase as string) === 'completado';
        default: return false;
      }
    });
  }, [selectedPhase, pulse.rawServicios]);

  const selectedService = selectedAlertId
    ? pulse.rawServicios.find(s => s.id === selectedAlertId) || null
    : null;

  const selectedEvents = selectedAlertId && selectedService
    ? pulse.rawEventsByService[selectedService.id_servicio] || []
    : [];
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

  const activeMonitoristas = pulse.monitoristas.listado.filter(m => m.enTurno);
  const maxServices = Math.max(...activeMonitoristas.map(m => m.serviciosAsignados), 1);

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-24" style={{ overscrollBehaviorY: 'contain' }}>
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
        <PhaseCard value={pulse.fases.porSalir} label="Por Salir" icon={Clock} accent="text-blue-500" onDoubleClick={() => setSelectedPhase('Por Salir')} />
        <PhaseCard value={pulse.fases.enRuta} label="En Ruta" icon={Navigation} accent="text-emerald-500" onDoubleClick={() => setSelectedPhase('En Ruta')} />
        <PhaseCard value={pulse.fases.enDestino} label="En Destino" icon={MapPin} accent="text-violet-500" onDoubleClick={() => setSelectedPhase('En Destino')} />
        <PhaseCard value={pulse.fases.enEvento} label="Evento" icon={Zap} accent="text-purple-500" onDoubleClick={() => setSelectedPhase('Evento')} />
        <PhaseCard value={pulse.fases.enAlerta} label="Alerta" icon={AlertTriangle} accent="text-destructive" pulse onDoubleClick={() => setSelectedPhase('Alerta')} />
        <PhaseCard value={pulse.fases.completados} label="Completados" icon={CheckCircle2} accent="text-emerald-600" onDoubleClick={() => setSelectedPhase('Completados')} />
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
              <AlertRow key={a.id} alert={a} onDoubleClick={() => setSelectedAlertId(a.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Touchpoint Gauge */}
      <div className="rounded-xl border border-border bg-card p-4">
        <SectionHeader
          icon={Clock}
          title="Performance"
        />
        <TouchpointGauge value={pulse.touchpoints.promedioGlobalMin} />
      </div>

      {/* Monitoristas — only active */}
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
          {activeMonitoristas.map(m => (
            <MonitoristaRow key={m.id} m={m} maxServices={maxServices} />
          ))}
          {activeMonitoristas.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin monitoristas en turno</p>
          )}
        </div>
      </div>

      {/* Last update */}
      <p className="text-[10px] text-center text-muted-foreground">
        Datos actualizados cada 15s · {pulse.ultimaActualizacion.toLocaleTimeString('es-MX')}
      </p>

      {/* Alert detail drawer */}
      <AlertServiceDrawer
        open={!!selectedAlertId}
        onOpenChange={(open) => { if (!open) setSelectedAlertId(null); }}
        service={selectedService}
        events={selectedEvents}
      />

      {/* Phase services drawer */}
      <PhaseServicesDrawer
        open={!!selectedPhase}
        onOpenChange={(open) => { if (!open) setSelectedPhase(null); }}
        phase={selectedPhase}
        services={phaseFilteredServices}
      />
    </div>
  );
};
