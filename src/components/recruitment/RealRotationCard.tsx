
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
          Custodios 60-90 días inactivos (con servicio previo 90-120 días)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rotación del mes actual */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-primary">
              {realRotation.currentMonthRate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">Este mes</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-medium">
              {realRotation.retiredCustodiansCount}
            </div>
            <p className="text-xs text-muted-foreground">custodios retirados</p>
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

        {/* Contexto adicional */}
        <p className="text-xs text-muted-foreground pt-2">
          Base: {realRotation.activeCustodiansBase} custodios activos al inicio del mes
        </p>
      </CardContent>
    </Card>
  );
};
