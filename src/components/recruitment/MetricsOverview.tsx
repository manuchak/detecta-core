import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, MapPin } from 'lucide-react';
import type { MetricaDemandaZona, ZonaOperacion } from '@/hooks/useNationalRecruitment';

interface MetricsOverviewProps {
  metricas: MetricaDemandaZona[];
  zonas: ZonaOperacion[];
  loading: boolean;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metricas, zonas, loading }) => {
  if (loading) {
    return <Card className="p-6"><div>Cargando métricas...</div></Card>;
  }

  const totalCustodios = metricas.reduce((sum, m) => sum + (m.custodios_activos || 0), 0);
  const totalRequeridos = metricas.reduce((sum, m) => sum + (m.custodios_requeridos || 0), 0);
  const totalServicios = metricas.reduce((sum, m) => sum + (m.servicios_promedio_dia || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Métricas y Análisis Nacional</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Custodios Totales</p>
              <p className="text-2xl font-bold">{totalCustodios}</p>
              <p className="text-xs text-muted-foreground">de {totalRequeridos} requeridos</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Servicios/Día</p>
              <p className="text-2xl font-bold">{totalServicios.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">promedio nacional</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Cobertura</p>
              <p className="text-2xl font-bold">{zonas.length}</p>
              <p className="text-xs text-muted-foreground">zonas operativas</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Resumen por Zona</h3>
        <div className="space-y-3">
          {metricas.map((metrica) => (
            <div key={metrica.id} className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="font-medium">{metrica.zona?.nombre || 'Zona desconocida'}</p>
                <p className="text-sm text-muted-foreground">
                  {metrica.custodios_activos || 0} custodios • {metrica.servicios_promedio_dia || 0} servicios/día
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant={metrica.deficit_custodios && metrica.deficit_custodios > 0 ? "destructive" : "default"}>
                  Score: {metrica.score_urgencia || 0}/10
                </Badge>
                {metrica.deficit_custodios && metrica.deficit_custodios > 0 && (
                  <Badge variant="outline">
                    Déficit: {metrica.deficit_custodios}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};