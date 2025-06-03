
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { useEstadisticasTiempoRetraso } from "@/hooks/useTiempoRetraso";
import { formatTiempoRetrasoDisplay } from "@/utils/timeUtils";

interface TiempoRetrasoCardProps {
  fechaInicio?: Date;
  fechaFin?: Date;
}

export const TiempoRetrasoCard = ({ fechaInicio, fechaFin }: TiempoRetrasoCardProps) => {
  const { data: estadisticas, isLoading } = useEstadisticasTiempoRetraso(fechaInicio, fechaFin);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Análisis de Puntualidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!estadisticas || estadisticas.totalServicios === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Análisis de Puntualidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No hay datos de tiempo de retraso disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const porcentajeATiempo = ((estadisticas.serviciosATiempo / estadisticas.totalServicios) * 100).toFixed(1);
  const porcentajeRetraso = ((estadisticas.serviciosConRetraso / estadisticas.totalServicios) * 100).toFixed(1);
  const porcentajeAntes = ((estadisticas.serviciosAntes / estadisticas.totalServicios) * 100).toFixed(1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Análisis de Puntualidad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen principal */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-lg font-semibold text-green-600">
                {estadisticas.serviciosATiempo}
              </span>
            </div>
            <p className="text-xs text-gray-500">A tiempo</p>
            <Badge variant="secondary" className="text-xs mt-1">
              {porcentajeATiempo}%
            </Badge>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-lg font-semibold text-red-600">
                {estadisticas.serviciosConRetraso}
              </span>
            </div>
            <p className="text-xs text-gray-500">Con retraso</p>
            <Badge variant="destructive" className="text-xs mt-1">
              {porcentajeRetraso}%
            </Badge>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-lg font-semibold text-blue-600">
                {estadisticas.serviciosAntes}
              </span>
            </div>
            <p className="text-xs text-gray-500">Antes</p>
            <Badge variant="outline" className="text-xs mt-1">
              {porcentajeAntes}%
            </Badge>
          </div>
        </div>

        {/* Estadísticas adicionales */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Total servicios:</span>
            <span className="font-medium">{estadisticas.totalServicios.toLocaleString()}</span>
          </div>
          
          {estadisticas.mayorRetraso && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Mayor retraso:</span>
              <span className="font-medium text-red-600">
                {formatTiempoRetrasoDisplay(estadisticas.mayorRetraso)}
              </span>
            </div>
          )}

          {estadisticas.promedioRetraso !== 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Promedio:</span>
              <span className="font-medium">
                {Math.abs(estadisticas.promedioRetraso).toFixed(1)} min
                {estadisticas.promedioRetraso < 0 ? ' antes' : ' tarde'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
