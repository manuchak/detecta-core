import React from 'react';
import { CorridorRiskTable } from './CorridorRiskTable';
import { SafePointsManager } from './SafePointsManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Route, Info, MapPin } from 'lucide-react';

export function RouteRiskIntelligence() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" />
            Corredores de Riesgo — Datos CANACAR/AMIS 2024-2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CorridorRiskTable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Puntos Seguros Certificados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SafePointsManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Análisis de Ruta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Selecciona un origen y destino para analizar el riesgo de la ruta</p>
            <p className="text-xs mt-1">Incluye: segmentos cruzados, cobertura celular, puntos seguros y recomendaciones ISO 28000</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
