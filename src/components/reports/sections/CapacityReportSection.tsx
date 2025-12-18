import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, Car, MapPin, AlertTriangle } from 'lucide-react';
import { CapacityReportData } from '@/types/reports';

interface CapacityReportSectionProps {
  data: CapacityReportData;
}

export function CapacityReportSection({ data }: CapacityReportSectionProps) {
  return (
    <div className="space-y-6 print:break-before-page" id="capacity-section">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Gauge className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Capacidad Operativa</h2>
          <p className="text-sm text-muted-foreground">Análisis de capacidad y utilización de flota</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Capacidad Actual</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Custodios Totales</p>
              <p className="text-2xl font-bold">{data.currentCapacity.totalCustodians}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Disponibles Hoy</p>
              <p className="text-2xl font-bold text-green-600">{data.currentCapacity.availableToday}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Retornando de Foráneo</p>
              <p className="text-2xl font-bold text-orange-600">{data.currentCapacity.unavailable.returningFromForeign}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">En Ruta</p>
              <p className="text-2xl font-bold text-blue-600">{data.currentCapacity.unavailable.currentlyOnRoute}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5" />Capacidad por Tipo de Servicio (Diaria)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Locales (≤50km)</p>
              <p className="text-2xl font-bold text-blue-600">{data.capacityByServiceType.local}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Regionales (51-200km)</p>
              <p className="text-2xl font-bold text-purple-600">{data.capacityByServiceType.regional}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Foráneos (&gt;200km)</p>
              <p className="text-2xl font-bold text-orange-600">{data.capacityByServiceType.foraneo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Capacidad Mensual vs Forecast</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Capacidad Total</p>
              <p className="text-xl font-bold">{data.monthlyCapacity.total.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Forecast Mes</p>
              <p className="text-xl font-bold">{data.monthlyCapacity.forecastCurrentMonth.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Servicios MTD</p>
              <p className="text-xl font-bold">{data.monthlyCapacity.servicesMTD.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Utilización vs Forecast</p>
              <p className="text-xl font-bold">{data.monthlyCapacity.utilizationVsForecast.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gap (Capacidad Extra)</p>
              <p className={`text-xl font-bold ${data.monthlyCapacity.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.monthlyCapacity.gap >= 0 ? '+' : ''}{data.monthlyCapacity.gap.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Métricas de Utilización</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Utilización Actual</p>
              <p className={`text-2xl font-bold ${data.utilizationMetrics.current > data.utilizationMetrics.maxSafe ? 'text-red-600' : data.utilizationMetrics.current > data.utilizationMetrics.healthy ? 'text-yellow-600' : 'text-green-600'}`}>
                {data.utilizationMetrics.current.toFixed(1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Objetivo Saludable</p>
              <p className="text-2xl font-bold text-green-600">{data.utilizationMetrics.healthy}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Límite Máximo Seguro</p>
              <p className="text-2xl font-bold text-orange-600">{data.utilizationMetrics.maxSafe}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
