import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCohortAnalysis, CohortData } from "@/utils/cohortPermanenceAnalysis";
import { Skeleton } from "@/components/ui/skeleton";

export function CohortAnalysisView() {
  const { data: cohortData, isLoading } = useQuery({
    queryKey: ['cohort-analysis'],
    queryFn: getCohortAnalysis,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const getTrendIndicator = (permanenciaMediana: number) => {
    if (permanenciaMediana > 8) {
      return { icon: <TrendingUp className="h-4 w-4 text-green-600" />, color: "text-green-600", label: "Excelente" };
    }
    if (permanenciaMediana > 5) {
      return { icon: <TrendingUp className="h-4 w-4 text-blue-600" />, color: "text-blue-600", label: "Bueno" };
    }
    if (permanenciaMediana > 3) {
      return { icon: <TrendingDown className="h-4 w-4 text-yellow-600" />, color: "text-yellow-600", label: "Regular" };
    }
    return { icon: <TrendingDown className="h-4 w-4 text-red-600" />, color: "text-red-600", label: "Bajo" };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis por Cohorte de Incorporación</CardTitle>
          <CardDescription>Permanencia según mes de entrada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cohortData || cohortData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis por Cohorte de Incorporación</CardTitle>
          <CardDescription>Permanencia según mes de entrada</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay suficientes datos para mostrar análisis de cohortes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Análisis por Cohorte de Incorporación
        </CardTitle>
        <CardDescription>
          Permanencia promedio y mediana según mes de entrada de custodios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cohortData.map((cohorte) => {
            const trend = getTrendIndicator(cohorte.permanenciaMediana);
            const fechaCohorte = new Date(cohorte.cohorte + '-01');
            const cohortLabel = fechaCohorte.toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long' 
            });

            return (
              <div 
                key={cohorte.cohorte}
                className="p-4 border rounded-lg hover:bg-secondary/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-sm capitalize">
                        {cohortLabel}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {trend.label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Custodios</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {cohorte.custodios}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground text-xs">Mediana</p>
                        <p className="font-semibold flex items-center gap-1">
                          {trend.icon}
                          <span className={trend.color}>
                            {cohorte.permanenciaMediana.toFixed(1)}m
                          </span>
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground text-xs">Promedio</p>
                        <p className="font-semibold">
                          {cohorte.permanenciaPromedio.toFixed(1)}m
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de progreso visual */}
                <div className="mt-3">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        cohorte.permanenciaMediana > 8 ? 'bg-green-500' :
                        cohorte.permanenciaMediana > 5 ? 'bg-blue-500' :
                        cohorte.permanenciaMediana > 3 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, (cohorte.permanenciaMediana / 20) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">💡 Insights Clave</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              • <strong>Mejor cohorte:</strong> {
                cohortData.reduce((max, c) => 
                  c.permanenciaMediana > max.permanenciaMediana ? c : max
                ).cohorte
              } con {
                cohortData.reduce((max, c) => 
                  c.permanenciaMediana > max.permanenciaMediana ? c : max
                ).permanenciaMediana.toFixed(1)
              }m de mediana
            </li>
            <li>
              • <strong>Cohorte más reciente:</strong> {cohortData[0].cohorte} ({cohortData[0].custodios} custodios)
            </li>
            <li>
              • <strong>Total cohortes analizadas:</strong> {cohortData.length} meses
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
