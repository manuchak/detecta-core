import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCcw
} from 'lucide-react';
import { useDynamicDeficitTracking } from '@/hooks/useDynamicDeficitTracking';
import { Button } from '@/components/ui/button';

export const DeficitProgressTracker: React.FC = () => {
  const { 
    loading, 
    deficitData, 
    alerts, 
    metrics, 
    lastUpdate, 
    refreshData 
  } = useDynamicDeficitTracking();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Cargando progreso de déficit dinámico...</span>
        </div>
      </Card>
    );
  }

  const getProgressColor = (porcentaje: number) => {
    if (porcentaje >= 90) return 'bg-green-500';
    if (porcentaje >= 70) return 'bg-blue-500';
    if (porcentaje >= 50) return 'bg-yellow-500';
    if (porcentaje >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (porcentaje: number) => {
    if (porcentaje >= 90) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (porcentaje >= 50) return <TrendingUp className="w-4 h-4 text-blue-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusBadge = (estado: string): "outline" | "default" | "secondary" | "destructive" => {
    const colorMap: Record<string, "outline" | "default" | "secondary" | "destructive"> = {
      'Objetivo Cumplido': 'default',
      'Progreso Excelente': 'default', 
      'Progreso Bueno': 'secondary',
      'Progreso Moderado': 'outline',
      'Necesita Atención': 'destructive'
    };
    return colorMap[estado] || 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Header con métricas generales */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Progreso de Déficit Dinámico</h2>
          <p className="text-sm text-muted-foreground">
            Tracking en tiempo real de incorporaciones por zona
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Actualizado: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCcw className="w-4 h-4 mr-1" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Incorporaciones</p>
              <p className="text-xl font-bold">{metrics.totalIncorporaciones}</p>
              <p className="text-xs text-muted-foreground">últimos 30 días</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Progreso Promedio</p>
              <p className="text-xl font-bold">{metrics.progresoPromedio.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">todas las zonas</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Objetivos Cumplidos</p>
              <p className="text-xl font-bold">{metrics.zonasConObjetivoCumplido}</p>
              <p className="text-xs text-muted-foreground">zonas ≥90%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Zonas en Riesgo</p>
              <p className="text-xl font-bold">{metrics.zonasEnRiesgo}</p>
              <p className="text-xs text-muted-foreground">progreso &lt;25%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-6 h-6 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">Déficit Restante</p>
              <p className="text-xl font-bold">{metrics.deficitTotalRestante}</p>
              <p className="text-xs text-muted-foreground">custodios</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alertas de Progreso */}
      {alerts.length > 0 && (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Alertas de Progreso
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(alert.porcentaje)}
                    <span className="text-sm">{alert.mensaje}</span>
                  </div>
                  <Badge variant={
                    alert.tipo === 'objetivo_cumplido' ? 'default' :
                    alert.tipo === 'progreso_excelente' ? 'default' :
                    alert.tipo === 'progreso_bueno' ? 'secondary' :
                    'destructive'
                  }>
                    {alert.porcentaje.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progreso por Zona */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Progreso por Zona Operativa</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="space-y-4">
            {deficitData.map((zona) => (
              <div key={zona.zona_operacion} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(zona.porcentaje_progreso)}
                    <span className="font-medium">{zona.zona_operacion}</span>
                    <Badge variant={getStatusBadge(zona.estado_progreso)}>
                      {zona.estado_progreso}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {zona.nuevos_custodios_incorporados}/{zona.deficit_inicial + zona.nuevos_custodios_incorporados}
                    </span>
                    <span className="font-medium text-foreground">
                      {zona.porcentaje_progreso.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <Progress 
                  value={zona.porcentaje_progreso} 
                  className="h-2"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Incorporados: {zona.nuevos_custodios_incorporados} custodios
                  </span>
                  <span>
                    Déficit restante: {zona.deficit_ajustado} custodios
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};