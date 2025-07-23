
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Users, AlertTriangle } from "lucide-react";
import { useCohortAnalytics } from "@/hooks/useCohortAnalytics";

interface RealRotationCardProps {
  className?: string;
}

export const RealRotationCard = ({ className }: RealRotationCardProps) => {
  const { realRotation, realRotationLoading } = useCohortAnalytics();

  if (realRotationLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rotación Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[100px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!realRotation) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rotación Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">No hay datos disponibles</div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (realRotation.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (realRotation.trend) {
      case 'up':
        return 'text-red-600';
      case 'down':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendText = () => {
    switch (realRotation.trend) {
      case 'up':
        return `+${realRotation.trendPercentage}% vs promedio`;
      case 'down':
        return `-${realRotation.trendPercentage}% vs promedio`;
      default:
        return 'Sin cambio significativo';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Rotación Real
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Custodios 60-90 días inactivos con historial de servicios previos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rotación del mes actual - Cálculo transparente */}
        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold text-primary">
              {realRotation.currentMonthRate.toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">Este mes</div>
          </div>
          
          {/* Desglose del cálculo */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-red-600">
                {realRotation.retiredCustodiansCount}
              </span>
              <span className="text-muted-foreground">custodios inactivados</span>
            </div>
            <span className="text-muted-foreground">÷</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-blue-600">
                {realRotation.activeCustodiansBase}
              </span>
              <span className="text-muted-foreground">custodios activos</span>
            </div>
            <span className="text-muted-foreground">=</span>
            <span className="font-semibold text-primary">
              {realRotation.currentMonthRate.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-medium text-gray-700">
                {realRotation.historicalAverageRate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Promedio 3 meses</p>
            </div>
            <div className={`flex items-center gap-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {getTrendText()}
              </span>
            </div>
          </div>
        </div>

        
        {/* Badge de estado */}
        <div className="pt-2">
          {realRotation.currentMonthRate > 15 ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Rotación Alta
            </Badge>
          ) : realRotation.currentMonthRate > 10 ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Rotación Moderada
            </Badge>
          ) : (
            <Badge variant="default" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Rotación Normal
            </Badge>
          )}
        </div>

        {/* Contexto metodológico */}
        <div className="text-xs text-muted-foreground pt-2 space-y-1">
          <p>📊 <strong>Metodología:</strong> Custodios 60-90 días inactivos con historial de servicios previos</p>
          <p>📈 <strong>Base de cálculo:</strong> {realRotation.activeCustodiansBase} custodios activos al inicio del mes</p>
        </div>
      </CardContent>
    </Card>
  );
};
