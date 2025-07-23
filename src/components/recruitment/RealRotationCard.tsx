
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Users, AlertTriangle } from "lucide-react";

interface RealRotationData {
  currentMonthRate: number;
  historicalAverageRate: number;
  retiredCustodiansCount: number;
  activeCustodiansBase: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface RealRotationCardProps {
  data?: RealRotationData;
  loading?: boolean;
}

export const RealRotationCard = ({ data, loading }: RealRotationCardProps) => {
  if (loading) {
    return (
      <Card>
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

  if (!data) {
    return (
      <Card>
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
    switch (data.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (data.trend) {
      case 'up':
        return 'text-red-600';
      case 'down':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendText = () => {
    switch (data.trend) {
      case 'up':
        return `+${data.trendPercentage}% vs promedio`;
      case 'down':
        return `-${data.trendPercentage}% vs promedio`;
      default:
        return 'Sin cambio significativo';
    }
  };

  return (
    <Card>
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
              {data.currentMonthRate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">Este mes</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-medium">
              {data.retiredCustodiansCount}
            </div>
            <p className="text-xs text-muted-foreground">custodios retirados</p>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-medium text-gray-700">
                {data.historicalAverageRate.toFixed(1)}%
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
          {data.currentMonthRate > 15 ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Rotación Alta
            </Badge>
          ) : data.currentMonthRate > 10 ? (
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
          Base: {data.activeCustodiansBase} custodios activos al inicio del mes
        </p>
      </CardContent>
    </Card>
  );
};
