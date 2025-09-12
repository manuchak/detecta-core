import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Simple placeholder component to prevent caching issues
const AdvancedForecastDashboard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sistema de Forecasting Avanzado</CardTitle>
        <CardDescription>
          El sistema avanzado se ha movido a la pestaña de Calibración
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Para acceder al sistema completo de forecasting y calibración, 
          por favor dirígete a la pestaña "Calibración" en el dashboard principal.
        </p>
      </CardContent>
    </Card>
  );
};

export { AdvancedForecastDashboard };