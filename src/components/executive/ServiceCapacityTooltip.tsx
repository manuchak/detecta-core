import React from 'react';
import { Info, Users, Calendar, TrendingUp, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

interface ServiceCapacityData {
  dailyCapacity: { total: number; local: number; regional: number; foraneo: number };
  monthlyCapacity: { total: number; local: number; regional: number; foraneo: number };
  utilizationMetrics: { current: number; healthy: number; maxSafe: number };
  alerts: { type: 'healthy' | 'warning' | 'critical'; message: string; recommendations: string[] };
  activeCustodians: number;
  availableCustodians: number;
  unavailableCustodians: { returningFromForeign: number; currentlyOnRoute: number };
  recentServices: { total: number; byType: { local: number; regional: number; foraneo: number } };
}

interface ServiceCapacityTooltipProps {
  data: ServiceCapacityData;
  kpiType: string;
}

export const ServiceCapacityTooltip: React.FC<ServiceCapacityTooltipProps> = ({ data, kpiType }) => {
  const getContent = () => {
    switch (kpiType) {
      case 'dailyCapacity':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Capacidad Diaria Real
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>👥 Custodios totales:</span>
                <span className="font-medium">{data.activeCustodians}</span>
              </div>
              <div className="flex justify-between">
                <span>✅ Disponibles hoy:</span>
                <span className="font-medium text-green-600">{data.availableCustodians}</span>
              </div>
              {(data.unavailableCustodians.returningFromForeign + data.unavailableCustodians.currentlyOnRoute) > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>❌ Indisponibles:</span>
                    <span className="font-medium text-red-600">
                      {data.unavailableCustodians.returningFromForeign + data.unavailableCustodians.currentlyOnRoute}
                    </span>
                  </div>
                  {data.unavailableCustodians.returningFromForeign > 0 && (
                    <div className="flex justify-between text-xs text-orange-600 ml-4">
                      <span>• Retornando de foráneo:</span>
                      <span>{data.unavailableCustodians.returningFromForeign}</span>
                    </div>
                  )}
                  {data.unavailableCustodians.currentlyOnRoute > 0 && (
                    <div className="flex justify-between text-xs text-blue-600 ml-4">
                      <span>• En ruta actualmente:</span>
                      <span>{data.unavailableCustodians.currentlyOnRoute}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs font-medium mb-2">Capacidad estimada hoy:</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>🏠 Locales (≤50km):</span>
                  <span className="font-medium">{data.dailyCapacity.local}</span>
                </div>
                <div className="flex justify-between">
                  <span>🌆 Regionales (51-200km):</span>
                  <span className="font-medium">{data.dailyCapacity.regional}</span>
                </div>
                <div className="flex justify-between">
                  <span>🛣️ Foráneos (&gt;200km):</span>
                  <span className="font-medium">{data.dailyCapacity.foraneo}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>📊 Total hoy:</span>
                  <span>{data.dailyCapacity.total} servicios</span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <p>Basado en disponibilidad real y patrones históricos</p>
            </div>
          </div>
        );

      case 'monthlyCapacity':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Capacidad Mensual Proyectada
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>📊 Capacidad total mensual:</span>
                <span className="font-medium">{data.monthlyCapacity.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>📈 Servicios reales (promedio):</span>
                <span className="font-medium">{Math.round(data.recentServices.total / 3).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>⚡ Eficiencia actual:</span>
                <span className="font-medium">{Math.round((data.recentServices.total / 3) / data.monthlyCapacity.total * 100)}%</span>
              </div>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <p><strong>Proyección:</strong> 22 días laborables</p>
              <p>Incluye descansos y rotación saludable</p>
            </div>
          </div>
        );

      case 'healthyUtilization':
        const StatusIcon = data.alerts.type === 'healthy' ? CheckCircle : 
                          data.alerts.type === 'warning' ? AlertTriangle : AlertTriangle;
        const statusColor = data.alerts.type === 'healthy' ? 'text-green-500' : 
                           data.alerts.type === 'warning' ? 'text-yellow-500' : 'text-red-500';
        
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${statusColor}`} />
              Utilización Saludable
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>📊 Utilización actual:</span>
                <span className="font-medium">{data.utilizationMetrics.current}%</span>
              </div>
              <div className="flex justify-between">
                <span>🎯 Objetivo saludable:</span>
                <span className="font-medium">{data.utilizationMetrics.healthy}%</span>
              </div>
              <div className="flex justify-between">
                <span>⚠️ Límite máximo seguro:</span>
                <span className="font-medium">{data.utilizationMetrics.maxSafe}%</span>
              </div>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <p><strong>Estado:</strong> {data.alerts.message}</p>
              <p>Incluye descanso de 8-12h entre servicios foráneos</p>
            </div>
          </div>
        );

      case 'gapForecast':
        const gap = data.monthlyCapacity.total - (data.recentServices.total / 3);
        const isPositive = gap > 0;
        
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Gap vs Forecast
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>🎯 Capacidad mensual:</span>
                <span className="font-medium">{data.monthlyCapacity.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>📈 Demanda actual (promedio):</span>
                <span className="font-medium">{Math.round(data.recentServices.total / 3).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{isPositive ? '✅' : '⚠️'} {isPositive ? 'Capacidad extra:' : 'Déficit:'}:</span>
                <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(gap).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <p>{isPositive ? '🚀 Capacidad para crecer' : '📞 Considerar contratar más custodios'}</p>
              <p>Análisis basado en tendencia de últimos 3 meses</p>
            </div>
          </div>
        );

      case 'fleetEfficiency':
        const efficiency = Math.round((data.recentServices.total / 3) / data.monthlyCapacity.total * 100);
        
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Eficiencia de Flota
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>👥 Custodios disponibles:</span>
                <span className="font-medium">{data.availableCustodians}</span>
              </div>
              <div className="flex justify-between">
                <span>🎯 Servicios por custodio/mes:</span>
                <span className="font-medium">{Math.round((data.recentServices.total / 3) / data.availableCustodians)}</span>
              </div>
              <div className="flex justify-between">
                <span>⚡ Eficiencia operativa:</span>
                <span className="font-medium">{efficiency}%</span>
              </div>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <p><strong>Benchmark:</strong> 29 servicios/custodio promedio</p>
              <p>Incluye servicios locales, regionales y foráneos</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Capacidad de Servicios
            </h4>
            <div className="text-xs text-muted-foreground">
              <p>Análisis de capacidad operativa basado en datos reales</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-sm p-4">
      {getContent()}
      {data.alerts.recommendations.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs font-medium mb-2">💡 Recomendaciones:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {data.alerts.recommendations.slice(0, 2).map((rec, index) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};