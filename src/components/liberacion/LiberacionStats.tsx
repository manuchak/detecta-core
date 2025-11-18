import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { CustodioLiberacion } from '@/types/liberacion';
import { useMemo } from 'react';

interface LiberacionStatsProps {
  liberaciones: CustodioLiberacion[];
}

const LiberacionStats = ({ liberaciones }: LiberacionStatsProps) => {
  const stats = useMemo(() => {
    const enProceso = liberaciones.filter(l => 
      !['liberado', 'rechazado'].includes(l.estado_liberacion)
    ).length;

    const liberadosMes = liberaciones.filter(l => {
      if (l.estado_liberacion !== 'liberado' || !l.fecha_liberacion) return false;
      const fechaLiberacion = new Date(l.fecha_liberacion);
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      return fechaLiberacion >= inicioMes;
    }).length;

    // Calcular tiempo promedio
    const liberadosConFecha = liberaciones.filter(l => 
      l.estado_liberacion === 'liberado' && l.fecha_liberacion
    );
    
    let tiempoPromedio = 0;
    if (liberadosConFecha.length > 0) {
      const totalDias = liberadosConFecha.reduce((sum, l) => {
        const inicio = new Date(l.created_at);
        const fin = new Date(l.fecha_liberacion!);
        const dias = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
        return sum + dias;
      }, 0);
      tiempoPromedio = totalDias / liberadosConFecha.length;
    }

    // Identificar bottleneck
    const sinDocs = liberaciones.filter(l => !l.documentacion_completa && l.estado_liberacion !== 'liberado').length;
    const sinPsico = liberaciones.filter(l => !l.psicometricos_completado && l.estado_liberacion !== 'liberado').length;
    const sinGPS = liberaciones.filter(l => !l.instalacion_gps_completado && l.estado_liberacion !== 'liberado').length;
    
    let bottleneck = 'Ninguno';
    let bottleneckCount = 0;
    if (sinGPS > sinDocs && sinGPS > sinPsico) {
      bottleneck = 'GPS';
      bottleneckCount = sinGPS;
    } else if (sinDocs > sinPsico) {
      bottleneck = 'Documentación';
      bottleneckCount = sinDocs;
    } else if (sinPsico > 0) {
      bottleneck = 'Psicométricos';
      bottleneckCount = sinPsico;
    }

    return {
      enProceso,
      liberadosMes,
      tiempoPromedio: tiempoPromedio.toFixed(1),
      bottleneck,
      bottleneckCount
    };
  }, [liberaciones]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.enProceso}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Custodios en pipeline
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Liberados (Mes)</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.liberadosMes}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Este mes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tiempoPromedio}</div>
          <p className="text-xs text-muted-foreground mt-1">
            días hasta liberación
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bottleneck Actual</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant={stats.bottleneckCount > 0 ? "destructive" : "secondary"}>
            {stats.bottleneck}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.bottleneckCount > 0 ? `${stats.bottleneckCount} pendientes` : 'Sin cuellos de botella'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiberacionStats;
