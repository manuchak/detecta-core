import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, MapPin, TrendingUp, FileWarning } from 'lucide-react';

interface StatsData {
  total: number;
  por_tipo: Record<string, number>;
  por_severidad: Record<string, number>;
  geocodificados: number;
  por_metodo_geocoding: Record<string, number>;
  relevancia_promedio?: number;
}

interface Props {
  stats: StatsData | undefined;
  loading: boolean;
}

const SEVERIDAD_COLORS: Record<string, string> = {
  critica: 'bg-destructive text-destructive-foreground',
  alta: 'bg-warning text-warning-foreground',
  media: 'bg-warning/60 text-foreground',
  baja: 'bg-success text-success-foreground',
};

export function IncidentesStatsKPIs({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2 p-4"><Skeleton className="h-4 w-20" /></CardHeader>
            <CardContent className="p-4 pt-0"><Skeleton className="h-7 w-14" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const geocodificadosPct = stats?.total
    ? Math.round((stats.geocodificados / stats.total) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">Total Incidentes</span>
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold">{stats?.total || 0}</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Relevancia Ø {stats?.relevancia_promedio || 0}/100
        </p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">Geocodificados</span>
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold">{stats?.geocodificados || 0}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{geocodificadosPct}% del total</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">Severidad</span>
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {stats?.por_severidad && Object.entries(stats.por_severidad).map(([sev, count]) => (
            <Badge key={sev} className={SEVERIDAD_COLORS[sev] || 'bg-muted text-muted-foreground'}>
              {sev}: {count}
            </Badge>
          ))}
          {(!stats?.por_severidad || Object.keys(stats.por_severidad).length === 0) && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">Geocoding</span>
          <FileWarning className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {stats?.por_metodo_geocoding && Object.entries(stats.por_metodo_geocoding).map(([m, c]) => (
            <Badge key={m} variant="outline" className="text-xs">{m}: {c}</Badge>
          ))}
          {(!stats?.por_metodo_geocoding || Object.keys(stats.por_metodo_geocoding).length === 0) && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </Card>
    </div>
  );
}
