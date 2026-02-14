import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCSCartera } from '@/hooks/useCSCartera';
import { useCSQuejaStats } from '@/hooks/useCSQuejas';
import { useOverdueTouchpoints } from '@/hooks/useCSTouchpoints';
import { CSLoyaltyFunnel } from './CSLoyaltyFunnel';
import { CSAlertsFeed } from './CSAlertsFeed';
import { CSClienteProfileModal } from './CSClienteProfileModal';
import { Users, AlertTriangle, MessageSquare, ShieldAlert, ArrowRight, Clock, Camera, CalendarClock } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const { data: overdueTps } = useOverdueTouchpoints();
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [, setSearchParams] = useSearchParams();
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const isLoading = carteraLoading || statsLoading;

  const handleSnapshot = async () => {
    setSnapshotLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('cs-health-snapshot', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      toast.success(`Snapshot generado: ${res.data.count} clientes procesados`);
    } catch (e: any) {
      toast.error(`Error generando snapshot: ${e.message}`);
    } finally {
      setSnapshotLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
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
  const sinContacto30d = activos.filter(c => c.dias_sin_contacto >= 30).length;
  const seguimientosVencidos = overdueTps?.length || 0;

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

  const lvlSinContacto: 'verde' | 'amarillo' | 'rojo' =
    sinContacto30d === 0 ? 'verde' :
    sinContacto30d <= 5 ? 'amarillo' : 'rojo';

  const lvlSeguimientos: 'verde' | 'amarillo' | 'rojo' =
    seguimientosVencidos === 0 ? 'verde' :
    seguimientosVencidos <= 5 ? 'amarillo' : 'rojo';

  const navigateToCartera = (filter?: string) => {
    setSearchParams(filter ? { tab: 'cartera', filtro: filter } : { tab: 'cartera' });
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Hero KPIs - 6 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
        <SemaforoKPI
          label="Sin Contacto 30d+"
          value={sinContacto30d}
          subtitle={sinContacto30d > 0 ? 'Pendientes de seguimiento' : 'Todos al día'}
          icon={Clock}
          level={lvlSinContacto}
          onClick={() => navigateToCartera('sin_servicio')}
        />
        <SemaforoKPI
          label="Seg. Pendientes"
          value={seguimientosVencidos}
          subtitle={seguimientosVencidos > 0 ? 'Seguimientos vencidos' : 'Al día'}
          icon={CalendarClock}
          level={lvlSeguimientos}
          onClick={() => setSearchParams({ tab: 'operativo' })}
        />
      </div>

      {/* Snapshot button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSnapshot}
          disabled={snapshotLoading}
          className="gap-1.5"
        >
          <Camera className="h-4 w-4" />
          {snapshotLoading ? 'Generando...' : 'Generar Snapshot Health'}
        </Button>
      </div>

      {/* Funnel + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CSLoyaltyFunnel />
        <CSAlertsFeed onClienteClick={id => setSelectedClienteId(id)} />
      </div>

      <CSClienteProfileModal
        clienteId={selectedClienteId}
        onClose={() => setSelectedClienteId(null)}
      />
    </div>
  );
}
