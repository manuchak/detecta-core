import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCSCartera } from '@/hooks/useCSCartera';
import { useCSQuejaStats } from '@/hooks/useCSQuejas';
import { CSLoyaltyFunnel } from './CSLoyaltyFunnel';
import { CSClienteProfileModal } from './CSClienteProfileModal';
import { Users, AlertTriangle, MessageSquare, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router-dom';

interface SemaforoKPIProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  level: 'verde' | 'amarillo' | 'rojo';
  onClick?: () => void;
}

const LEVEL_STYLES = {
  verde: 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20',
  amarillo: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
  rojo: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
};

const DOT_STYLES = {
  verde: 'bg-green-500',
  amarillo: 'bg-amber-500',
  rojo: 'bg-red-500',
};

function SemaforoKPI({ label, value, subtitle, icon: Icon, level, onClick }: SemaforoKPIProps) {
  return (
    <Card
      className={`border-l-4 ${LEVEL_STYLES[level]} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${DOT_STYLES[level]}`} />
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <Icon className="h-6 w-6 text-muted-foreground/50" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CSPanorama() {
  const { data: cartera, isLoading: carteraLoading } = useCSCartera();
  const { data: stats, isLoading: statsLoading } = useCSQuejaStats();
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [, setSearchParams] = useSearchParams();

  const isLoading = carteraLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  const activos = cartera?.filter(c => c.activo) || [];
  const conServicio = activos.filter(c => c.servicios_90d > 0);
  const enRiesgo = activos.filter(c => c.salud === 'rojo');
  const quejasAbiertas = stats?.abiertas || 0;
  const csatPromedio = stats?.csatPromedio;

  // Semaphore levels
  const lvlActivos: 'verde' | 'amarillo' | 'rojo' =
    conServicio.length >= activos.length * 0.7 ? 'verde' :
    conServicio.length >= activos.length * 0.5 ? 'amarillo' : 'rojo';

  const lvlCsat: 'verde' | 'amarillo' | 'rojo' =
    !csatPromedio ? 'amarillo' :
    csatPromedio >= 4 ? 'verde' :
    csatPromedio >= 3 ? 'amarillo' : 'rojo';

  const lvlQuejas: 'verde' | 'amarillo' | 'rojo' =
    quejasAbiertas === 0 ? 'verde' :
    quejasAbiertas <= 3 ? 'amarillo' : 'rojo';

  const lvlRiesgo: 'verde' | 'amarillo' | 'rojo' =
    enRiesgo.length === 0 ? 'verde' :
    enRiesgo.length <= 3 ? 'amarillo' : 'rojo';

  // Top 5 urgent actions
  const urgentes = [...(activos.filter(c => c.salud === 'rojo' || c.salud === 'amarillo'))]
    .sort((a, b) => {
      if (a.salud === 'rojo' && b.salud !== 'rojo') return -1;
      if (b.salud === 'rojo' && a.salud !== 'rojo') return 1;
      return b.quejas_abiertas - a.quejas_abiertas || b.dias_sin_contacto - a.dias_sin_contacto;
    })
    .slice(0, 5);

  const navigateToCartera = (filter?: string) => {
    setSearchParams(filter ? { tab: 'cartera', filtro: filter } : { tab: 'cartera' });
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SemaforoKPI
          label="Clientes Activos"
          value={conServicio.length}
          subtitle={`de ${activos.length} con servicio en 90d`}
          icon={Users}
          level={lvlActivos}
          onClick={() => navigateToCartera('activos')}
        />
        <SemaforoKPI
          label="CSAT Promedio"
          value={csatPromedio ? csatPromedio.toFixed(1) : '—'}
          subtitle={csatPromedio ? `de 5.0` : 'Sin datos'}
          icon={MessageSquare}
          level={lvlCsat}
        />
        <SemaforoKPI
          label="Quejas Abiertas"
          value={quejasAbiertas}
          subtitle={`${stats?.cerradasMes || 0} cerradas este mes`}
          icon={AlertTriangle}
          level={lvlQuejas}
          onClick={() => setSearchParams({ tab: 'operativo' })}
        />
        <SemaforoKPI
          label="Clientes en Riesgo"
          value={enRiesgo.length}
          subtitle={enRiesgo.length > 0 ? 'Requieren atención inmediata' : 'Sin alertas'}
          icon={ShieldAlert}
          level={lvlRiesgo}
          onClick={() => navigateToCartera('en_riesgo')}
        />
      </div>

      {/* Funnel + Urgent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CSLoyaltyFunnel />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Atención Urgente
            </CardTitle>
            <p className="text-xs text-muted-foreground">Clientes que necesitan acción hoy</p>
          </CardHeader>
          <CardContent>
            {urgentes.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                ✓ Todos los clientes están al día
              </div>
            ) : (
              <div className="space-y-2">
                {urgentes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClienteId(c.id)}
                    className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-accent/30 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-3 w-3 rounded-full shrink-0 ${DOT_STYLES[c.salud]}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.nombre}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          {c.quejas_abiertas > 0 && (
                            <span className="text-destructive font-medium">{c.quejas_abiertas} quejas</span>
                          )}
                          {c.dias_sin_contacto < 999 && (
                            <span>{c.dias_sin_contacto}d sin contacto</span>
                          )}
                          {c.servicios_90d === 0 && (
                            <span>Sin servicio 90d</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
                {enRiesgo.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigateToCartera('en_riesgo')}
                  >
                    Ver todos ({enRiesgo.length}) →
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CSClienteProfileModal
        clienteId={selectedClienteId}
        onClose={() => setSelectedClienteId(null)}
      />
    </div>
  );
}
