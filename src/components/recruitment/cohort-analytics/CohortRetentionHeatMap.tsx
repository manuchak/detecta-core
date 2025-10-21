import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCohortAnalytics, type CohortRetention } from "@/hooks/useCohortAnalytics";

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

  const getColorIntensity = (value: number | null, isMonth0: boolean = false) => {
    if (value === null || value === undefined) return 'bg-muted/50 text-muted-foreground';
    if (isMonth0) return 'bg-success text-success-foreground font-semibold';
    if (value >= 90) return 'bg-success text-success-foreground';
    if (value >= 75) return 'bg-success/80 text-success-foreground';
    if (value >= 60) return 'bg-warning text-warning-foreground';
    if (value >= 40) return 'bg-warning/70 text-warning-foreground';
    if (value >= 20) return 'bg-destructive/60 text-destructive-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const months = ['month_0', 'month_1', 'month_2', 'month_3', 'month_4', 'month_5', 'month_6'];
  const monthLabels = ['Mes 0', 'Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6'];

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
            <div className="grid grid-cols-9 gap-1 mb-2">
              <div className="p-2 text-sm font-medium text-center">Cohorte</div>
              <div className="p-2 text-sm font-medium text-center">Tamaño</div>
              {monthLabels.map((label) => (
                <div key={label} className="p-2 text-sm font-medium text-center">
                  {label}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {cohortRetention.map((cohort) => (
              <div key={cohort.cohort_month} className="grid grid-cols-9 gap-1 mb-1">
                {/* Cohorte month */}
                <div className="p-2 text-sm font-medium text-center bg-muted rounded">
                  {cohort.cohort_month}
                </div>
                
                {/* Initial size */}
                <div className="p-2 text-sm text-center bg-muted rounded">
                  {cohort.initial_size}
                </div>
                
                {/* Retention percentages */}
                {months.map((monthKey, idx) => {
                  const value = cohort[monthKey as keyof CohortRetention] as number | null;
                  const isMonth0 = monthKey === 'month_0';
                  return (
                    <div 
                      key={monthKey}
                      className={`p-2 text-sm text-center rounded ${getColorIntensity(value, isMonth0)}`}
                    >
                      {value !== null && value !== undefined ? `${value.toFixed(1)}%` : '-'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
          <span className="text-muted-foreground font-medium">Retención:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-success rounded"></div>
            <span>90%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-success/80 rounded"></div>
            <span>75-89%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-warning rounded"></div>
            <span>60-74%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-warning/70 rounded"></div>
            <span>40-59%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-destructive/60 rounded"></div>
            <span>20-39%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-destructive rounded"></div>
            <span>&lt;20%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};