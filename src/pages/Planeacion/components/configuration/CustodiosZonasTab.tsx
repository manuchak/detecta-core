/**
 * CustodiosZonasTab - Vista de distribución de custodios por zona
 * Muestra métricas y mapa de distribución geográfica
 * Alineado con Perfiles Operativos como fuente de verdad
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Users, MapPin } from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { CoverageRing } from '@/components/planeacion/CoverageRing';
import { CustodianZoneBubbleMap } from './CustodianZoneBubbleMap';

interface CustodioOperativo {
  id: string;
  nombre: string;
  zona_base: string | null;
  estado: string;
  fecha_ultimo_servicio: string | null;
}

type ActivityFilter = 'all' | '60' | '90' | '120' | '120+';

const ACTIVITY_FILTER_OPTIONS: { value: ActivityFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: '60', label: 'Últimos 60 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: '120', label: 'Últimos 120 días' },
  { value: '120+', label: 'Sin actividad +120 días' },
];

export function CustodiosZonasTab() {
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');

  // Fetch custodios operativos - incluye activos y suspendidos (alineado con Perfiles Operativos)
  const { data: custodios = [] } = useAuthenticatedQuery(
    ['custodios-operativos-zonas'],
    async () => {
      const { data, error } = await supabase
        .from('custodios_operativos')
        .select('id, nombre, zona_base, estado, fecha_ultimo_servicio')
        .in('estado', ['activo', 'suspendido'])
        .order('nombre');
      
      if (error) throw error;
      return data as CustodioOperativo[];
    }
  );

  // Helper to calculate days since last service
  const getDaysSinceLastService = (fecha: string | null): number | null => {
    if (!fecha) return null;
    const lastDate = new Date(fecha);
    const today = new Date();
    const diffTime = today.getTime() - lastDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Custodios filtrados por actividad
  const custodiosPorActividad = useMemo(() => {
    if (activityFilter === 'all') return custodios;
    
    return custodios.filter(c => {
      const days = getDaysSinceLastService(c.fecha_ultimo_servicio);
      
      if (activityFilter === '120+') {
        return days === null || days > 120;
      }
      
      const maxDays = parseInt(activityFilter);
      return days !== null && days <= maxDays;
    });
  }, [custodios, activityFilter]);

  // Contar custodios sin zona definida
  const custodiosSinZona = useMemo(() => {
    return custodiosPorActividad.filter(c => 
      !c.zona_base || 
      c.zona_base === 'Por asignar' || 
      c.zona_base === 'Sin asignar' ||
      c.zona_base.trim() === ''
    );
  }, [custodiosPorActividad]);

  // Calcular completitud
  const completitudPorcentaje = useMemo(() => {
    if (custodiosPorActividad.length === 0) return 0;
    return Math.round(((custodiosPorActividad.length - custodiosSinZona.length) / custodiosPorActividad.length) * 100);
  }, [custodiosPorActividad.length, custodiosSinZona.length]);

  // Estadísticas por zona
  const estadisticasZona = useMemo(() => {
    const porZona: Record<string, number> = {};
    custodiosPorActividad.forEach(c => {
      const zona = c.zona_base || 'Sin asignar';
      porZona[zona] = (porZona[zona] || 0) + 1;
    });
    return Object.entries(porZona)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [custodiosPorActividad]);

  const zonasConCustodios = new Set(custodiosPorActividad.filter(c => c.zona_base).map(c => c.zona_base)).size;

  // Etiqueta dinámica para métrica
  const metricLabel = activityFilter === 'all' 
    ? 'Total Activos' 
    : `Activos (${activityFilter === '120+' ? '+120d' : activityFilter + 'd'})`;

  return (
    <div className="space-y-4">
      {/* Alerta de datos faltantes */}
      {custodiosSinZona.length > 0 && (
        <Alert className="border-warning/50 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Datos incompletos detectados</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{custodiosSinZona.length}</strong> custodios activos sin zona base definida. 
              Gestiona las zonas en <strong>Perfiles Operativos</strong>.
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/perfiles-operativos'}
              className="border-warning/50 hover:bg-warning/10"
            >
              Ir a Perfiles
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Apple Metrics Grid with Activity Filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="grid gap-4 md:grid-cols-4 flex-1">
          {/* Total en Filtro */}
          <div className="apple-metric apple-metric-neutral">
            <div className="apple-metric-icon">
              <Users className="h-5 w-5" />
            </div>
            <div className="apple-metric-content">
              <div className="apple-metric-value">{custodiosPorActividad.length}</div>
              <div className="apple-metric-label">{metricLabel}</div>
            </div>
          </div>

          {/* Sin Zona */}
          <div className="apple-metric apple-metric-warning">
            <div className="apple-metric-icon">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="apple-metric-content">
              <div className="apple-metric-value">{custodiosSinZona.length}</div>
              <div className="apple-metric-label">Sin Zona</div>
            </div>
          </div>

          {/* Zonas Cubiertas */}
          <div className="apple-metric apple-metric-info">
            <div className="apple-metric-icon">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="apple-metric-content">
              <div className="apple-metric-value">{zonasConCustodios}</div>
              <div className="apple-metric-label">Zonas Cubiertas</div>
            </div>
          </div>

          {/* Completitud con CoverageRing */}
          <div className="apple-metric apple-metric-success">
            <CoverageRing 
              percentage={completitudPorcentaje} 
              size={48}
              strokeWidth={5}
              showLabel={false}
            />
            <div className="apple-metric-content">
              <div className="apple-metric-value">{completitudPorcentaje}%</div>
              <div className="apple-metric-label">Completitud</div>
            </div>
          </div>
        </div>

        {/* Activity Filter Selector */}
        <Select value={activityFilter} onValueChange={(v) => setActivityFilter(v as ActivityFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por actividad" />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mapa de distribución por zona - Altura dinámica */}
      <CustodianZoneBubbleMap estadisticasZona={estadisticasZona} />
    </div>
  );
}

export default CustodiosZonasTab;
