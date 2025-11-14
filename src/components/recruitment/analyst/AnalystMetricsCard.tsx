import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, TrendingUp, Phone, CheckCircle, XCircle, Clock } from "lucide-react";
import { AnalystMetric } from "@/hooks/useAnalystMetrics";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AnalystMetricsCardProps {
  metric: AnalystMetric;
}

export const AnalystMetricsCard = ({ metric }: AnalystMetricsCardProps) => {
  const getPerformanceColor = (rate: number) => {
    if (rate >= 70) return "text-emerald-600";
    if (rate >= 50) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{metric.analystName}</CardTitle>
              <p className="text-sm text-muted-foreground">{metric.analystEmail}</p>
            </div>
          </div>
          <Badge variant={metric.leadsAsignados > 0 ? "default" : "secondary"}>
            {metric.leadsAsignados} leads
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lead distribution */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Nuevos</span>
            </div>
            <p className="text-lg font-semibold">{metric.leadsNuevos}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span>En proceso</span>
            </div>
            <p className="text-lg font-semibold">{metric.leadsEnProceso}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-emerald-600" />
              <span>Aprobados</span>
            </div>
            <p className="text-lg font-semibold text-emerald-600">{metric.leadsAprobados}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <XCircle className="h-3 w-3 text-red-600" />
              <span>Rechazados</span>
            </div>
            <p className="text-lg font-semibold text-muted-foreground">{metric.leadsRechazados}</p>
          </div>
        </div>

        {/* Performance metrics */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>Tasa contacto</span>
            </div>
            <span className={`font-semibold ${getPerformanceColor(metric.tasaContacto)}`}>
              {metric.tasaContacto}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Tasa conversión</span>
            </div>
            <span className={`font-semibold ${getPerformanceColor(metric.tasaConversion)}`}>
              {metric.tasaConversion}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Tasa aprobación</span>
            </div>
            <span className={`font-semibold ${getPerformanceColor(metric.tasaAprobacion)}`}>
              {metric.tasaAprobacion}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Tiempo respuesta</span>
            </div>
            <span className="font-semibold">
              {metric.tiempoPromedioRespuesta > 0 
                ? `${metric.tiempoPromedioRespuesta}h`
                : 'N/A'
              }
            </span>
          </div>
        </div>

        {/* Last assignment */}
        {metric.ultimaAsignacion && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Última asignación:{" "}
              {formatDistanceToNow(new Date(metric.ultimaAsignacion), {
                addSuffix: true,
                locale: es
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
