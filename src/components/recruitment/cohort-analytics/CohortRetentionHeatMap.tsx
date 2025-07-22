import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCohortAnalytics } from "@/hooks/useCohortAnalytics";

export const CohortRetentionHeatMap = () => {
  const { cohortRetention, isLoading } = useCohortAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Retención por Cohortes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cohortRetention.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Retención por Cohortes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">No hay datos suficientes</div>
        </CardContent>
      </Card>
    );
  }

  const getColorIntensity = (value: number | null) => {
    if (value === null || value === 0) return 'bg-muted';
    if (value >= 80) return 'bg-success text-success-foreground';
    if (value >= 60) return 'bg-success/70 text-success-foreground';
    if (value >= 40) return 'bg-warning text-warning-foreground';
    if (value >= 20) return 'bg-warning/70 text-warning-foreground';
    return 'bg-destructive/70 text-destructive-foreground';
  };

  const months = ['Mes 0', 'Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Retención por Cohortes</CardTitle>
        <p className="text-sm text-muted-foreground">
          Porcentaje de custodios activos por mes desde contratación
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="p-2 text-sm font-medium text-center">Cohorte</div>
              <div className="p-2 text-sm font-medium text-center">Tamaño</div>
              {months.map((month) => (
                <div key={month} className="p-2 text-sm font-medium text-center">
                  {month}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {cohortRetention.map((cohort) => (
              <div key={cohort.cohorte_mes} className="grid grid-cols-8 gap-1 mb-1">
                {/* Cohorte month */}
                <div className="p-2 text-sm font-medium text-center bg-muted rounded">
                  {cohort.cohorte_mes}
                </div>
                
                {/* Initial size */}
                <div className="p-2 text-sm text-center bg-muted rounded">
                  {cohort.custodios_iniciales}
                </div>
                
                {/* Retention percentages */}
                <div className={`p-2 text-sm text-center rounded ${getColorIntensity(cohort.mes_0)}`}>
                  {cohort.mes_0?.toFixed(0)}%
                </div>
                <div className={`p-2 text-sm text-center rounded ${getColorIntensity(cohort.mes_1)}`}>
                  {cohort.mes_1?.toFixed(0) || '-'}%
                </div>
                <div className={`p-2 text-sm text-center rounded ${getColorIntensity(cohort.mes_2)}`}>
                  {cohort.mes_2?.toFixed(0) || '-'}%
                </div>
                <div className={`p-2 text-sm text-center rounded ${getColorIntensity(cohort.mes_3)}`}>
                  {cohort.mes_3?.toFixed(0) || '-'}%
                </div>
                <div className={`p-2 text-sm text-center rounded ${getColorIntensity(cohort.mes_4)}`}>
                  {cohort.mes_4?.toFixed(0) || '-'}%
                </div>
                <div className={`p-2 text-sm text-center rounded ${getColorIntensity(cohort.mes_5)}`}>
                  {cohort.mes_5?.toFixed(0) || '-'}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">Retención:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-success rounded"></div>
            <span>80%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-success/70 rounded"></div>
            <span>60-79%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-warning rounded"></div>
            <span>40-59%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-warning/70 rounded"></div>
            <span>20-39%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-destructive/70 rounded"></div>
            <span>&lt;20%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};