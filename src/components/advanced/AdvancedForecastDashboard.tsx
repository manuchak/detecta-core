import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, ArrowRight, BarChart3 } from 'lucide-react';

const AdvancedForecastDashboard = () => {
  const navigate = useNavigate();

  const handleNavigateToCalibration = () => {
    navigate('/dashboard/kpis?tab=calibracion');
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Sistema de Forecasting Avanzado
        </CardTitle>
        <CardDescription>
          Calibración de modelos, ajuste de feriados y monitoreo de precisión MAPE
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <BarChart3 className="h-5 w-5 text-muted-foreground mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Accede al sistema completo de forecasting para calibrar modelos predictivos, 
            configurar factores de impacto por feriados y monitorear la precisión del sistema.
          </p>
        </div>
        <Button onClick={handleNavigateToCalibration} className="gap-2">
          Ir a Calibración
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export { AdvancedForecastDashboard };
