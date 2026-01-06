import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LMSMetricCard } from "./LMSMetricCard";
import { useLMSProgresoMetrics } from "@/hooks/lms/useLMSProgresoMetrics";
import { Target, CheckCircle, Clock, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--muted))'];

const tipoLabels: Record<string, string> = {
  video: 'Video',
  documento: 'Documento',
  quiz: 'Quiz',
  texto_enriquecido: 'Texto',
  embed: 'Contenido Externo'
};

export const LMSProgresoDashboard: React.FC = () => {
  const { data: metrics, isLoading, error } = useLMSProgresoMetrics();

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Error al cargar métricas de progreso</p>
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

  // Datos para pie chart de tipos de contenido
  const pieData = Object.entries(metrics.distribucionPorTipo)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: tipoLabels[key] || key,
      value
    }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <LMSMetricCard
          title="Progreso Promedio"
          value={`${metrics.progresoPromedioGeneral}%`}
          icon={Target}
          variant={metrics.progresoPromedioGeneral >= 70 ? 'success' : metrics.progresoPromedioGeneral >= 40 ? 'warning' : 'default'}
        />
        <LMSMetricCard
          title="Tasa de Completación"
          value={`${metrics.tasaCompletacion}%`}
          icon={CheckCircle}
          description="Cursos completados / total"
          variant={metrics.tasaCompletacion >= 50 ? 'success' : 'warning'}
        />
        <LMSMetricCard
          title="Completados Hoy"
          value={metrics.contenidosCompletadosHoy}
          icon={Layers}
          description="Contenidos completados"
        />
        <LMSMetricCard
          title="Tiempo Promedio"
          value={`${metrics.tiempoPromedioSesionMin} min`}
          icon={Clock}
          description="Por sesión de estudio"
        />
      </div>

      {/* Progreso por curso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progreso por Curso</CardTitle>
          <CardDescription>Avance promedio en cada curso</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.progresoPromedioPorCurso.length > 0 ? (
            <div className="space-y-4">
              {metrics.progresoPromedioPorCurso.slice(0, 5).map((curso) => (
                <div key={curso.cursoId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground truncate max-w-[200px]">
                      {curso.titulo}
                    </span>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{curso.inscritos} inscritos</span>
                      <span>{curso.completados} completados</span>
                      <span className="font-semibold text-foreground">{curso.progresoPromedio}%</span>
                    </div>
                  </div>
                  <Progress value={curso.progresoPromedio} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No hay cursos con progreso registrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contenidos más vistos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contenidos Más Vistos</CardTitle>
            <CardDescription>Top 5 por número de visualizaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.contenidosMasVistos.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics.contenidosMasVistos.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="titulo" 
                    tick={{ fontSize: 11 }} 
                    width={120}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} vistas`, 'Vistas']}
                  />
                  <Bar dataKey="vistas" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay contenidos vistos aún
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribución por tipo de contenido */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Contenido</CardTitle>
            <CardDescription>Distribución del catálogo</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay contenidos registrados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
