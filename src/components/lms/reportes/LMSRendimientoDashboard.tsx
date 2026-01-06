import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LMSMetricCard } from "./LMSMetricCard";
import { useLMSRendimientoMetrics } from "@/hooks/lms/useLMSRendimientoMetrics";
import { Award, Target, Star, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export const LMSRendimientoDashboard: React.FC = () => {
  const { data: metrics, isLoading, error } = useLMSRendimientoMetrics();

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Error al cargar métricas de rendimiento</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const getVariantByScore = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <LMSMetricCard
          title="Calificación Promedio"
          value={`${metrics.calificacionPromedioGeneral}%`}
          icon={Award}
          variant={getVariantByScore(metrics.calificacionPromedioGeneral)}
        />
        <LMSMetricCard
          title="Tasa de Aprobación"
          value={`${metrics.tasaAprobacionGeneral}%`}
          icon={Target}
          description="Puntaje ≥ 70%"
          variant={getVariantByScore(metrics.tasaAprobacionGeneral)}
        />
        <LMSMetricCard
          title="Quizzes Perfectos"
          value={metrics.quizzesPerfectos}
          icon={Star}
          description="Puntaje 100%"
          variant="success"
        />
        <LMSMetricCard
          title="Intentos Promedio"
          value={metrics.intentosPromedioGeneral.toFixed(1)}
          icon={RefreshCw}
          description="Por quiz"
        />
      </div>

      {/* Distribución de calificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribución de Calificaciones</CardTitle>
          <CardDescription>Cantidad de evaluaciones por rango de puntaje</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.distribucionCalificaciones.some(r => r.cantidad > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.distribucionCalificaciones}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="rango" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => {
                    const item = metrics.distribucionCalificaciones.find(r => r.cantidad === value);
                    return [`${value} (${item?.porcentaje || 0}%)`, 'Evaluaciones'];
                  }}
                />
                <Bar 
                  dataKey="cantidad" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No hay evaluaciones registradas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quizzes por rendimiento (más difíciles) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quizzes por Dificultad</CardTitle>
          <CardDescription>Ordenados por tasa de aprobación (menor a mayor)</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.quizzesPorRendimiento.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Quiz</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Curso</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Calif. Prom.</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Intentos</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Aprobación</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.quizzesPorRendimiento.slice(0, 10).map((quiz) => (
                    <tr key={quiz.contenidoId} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium text-foreground">{quiz.titulo}</td>
                      <td className="py-3 px-2 text-muted-foreground truncate max-w-[150px]">
                        {quiz.cursoTitulo}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={quiz.calificacionPromedio >= 70 ? 'default' : 'secondary'}>
                          {quiz.calificacionPromedio}%
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center text-muted-foreground">
                        {quiz.intentosPromedio}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge 
                          variant={quiz.tasaAprobacion >= 70 ? 'default' : quiz.tasaAprobacion >= 50 ? 'secondary' : 'destructive'}
                        >
                          {quiz.tasaAprobacion}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No hay quizzes con evaluaciones registradas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
