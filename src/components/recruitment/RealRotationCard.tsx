
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
    <Card className={`${className} overflow-hidden hover:shadow-lg transition-all duration-300`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold">Rotación Real</div>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Custodios que dejaron de ser activos vs base activa (60 días)
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Métrica Principal con diseño mejorado */}
        <div className="relative bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl font-bold text-primary animate-fade-in">
              {realRotation.currentMonthRate.toFixed(2)}%
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Este mes</span>
            </div>
          </div>
          
          {/* Desglose del cálculo mejorado */}
          <div className="flex items-center justify-center gap-3 text-sm bg-background/50 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-lg border border-red-200">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              <span className="font-semibold text-red-700">
                {realRotation.retiredCustodiansCount}
              </span>
              <span className="text-red-600 text-xs">inactivados</span>
            </div>
            
            <div className="text-muted-foreground font-mono">÷</div>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span className="font-semibold text-blue-700">
                {realRotation.activeCustodiansBase}
              </span>
              <span className="text-blue-600 text-xs">activos</span>
            </div>
            
            <div className="text-muted-foreground font-mono">=</div>
            
            <div className="px-3 py-1 bg-primary/10 rounded-lg border border-primary/30">
              <span className="font-bold text-primary">
                {realRotation.currentMonthRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Comparación con promedio histórico */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-foreground">
              {realRotation.historicalAverageRate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
              Promedio 3 meses
            </p>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getTrendColor() === 'text-red-600' ? 'bg-red-50 border border-red-200' : getTrendColor() === 'text-green-600' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {getTrendText()}
              </span>
            </div>
          </div>
        </div>

        {/* Badge de estado mejorado */}
        <div className="flex justify-center">
          {realRotation.currentMonthRate > 15 ? (
            <Badge variant="destructive" className="flex items-center gap-2 px-4 py-2 text-sm font-medium animate-pulse">
              <AlertTriangle className="h-4 w-4" />
              Rotación Alta
            </Badge>
          ) : realRotation.currentMonthRate > 10 ? (
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Rotación Moderada
            </Badge>
          ) : (
            <Badge variant="default" className="flex items-center gap-2 px-4 py-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              Rotación Normal
            </Badge>
          )}
        </div>

        {/* Contexto metodológico mejorado */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
            <div className="p-1 rounded bg-blue-100">
              <span className="text-blue-600 text-xs">📊</span>
            </div>
            <div className="text-xs text-blue-800">
              <strong>Metodología:</strong> Custodios que dejaron de ser activos vs base activa (60 días)
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-green-50/50 rounded-lg border border-green-200/50">
            <div className="p-1 rounded bg-green-100">
              <span className="text-green-600 text-xs">📈</span>
            </div>
            <div className="text-xs text-green-800">
              <strong>Base de cálculo:</strong> {realRotation.activeCustodiansBase} custodios con servicios recientes
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
