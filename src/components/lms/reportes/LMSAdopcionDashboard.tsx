import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LMSMetricCard } from "./LMSMetricCard";
import { useLMSAdopcionMetrics } from "@/hooks/lms/useLMSAdopcionMetrics";
import { Users, UserCheck, BookOpen, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--muted))'];

const estadoLabels: Record<string, string> = {
  inscrito: 'Inscrito',
  en_progreso: 'En Progreso',
  completado: 'Completado',
  vencido: 'Vencido',
  cancelado: 'Cancelado'
};

export const LMSAdopcionDashboard: React.FC = () => {
  const { data: metrics, isLoading, error } = useLMSAdopcionMetrics();

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Error al cargar métricas de adopción</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const tendenciaMensual = metrics.inscripcionesMesPasado > 0
    ? Math.round(((metrics.inscripcionesEsteMes - metrics.inscripcionesMesPasado) / metrics.inscripcionesMesPasado) * 100)
    : metrics.inscripcionesEsteMes > 0 ? 100 : 0;

  // Datos para pie chart de estados
  const pieData = Object.entries(metrics.distribucionPorEstado)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: estadoLabels[key] || key,
      value
    }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <LMSMetricCard
          title="Tasa de Adopción"
          value={`${metrics.tasaAdopcion}%`}
          icon={TrendingUp}
          description={`${metrics.usuariosConInscripciones} de ${metrics.totalUsuariosActivos} usuarios`}
          variant={metrics.tasaAdopcion >= 50 ? 'success' : metrics.tasaAdopcion >= 25 ? 'warning' : 'danger'}
        />
        <LMSMetricCard
          title="Total Inscripciones"
          value={metrics.totalInscripciones}
          icon={BookOpen}
          description="En todos los cursos"
        />
        <LMSMetricCard
          title="Inscripciones Este Mes"
          value={metrics.inscripcionesEsteMes}
          icon={UserCheck}
          trend={{ value: tendenciaMensual, label: 'vs mes anterior' }}
        />
        <LMSMetricCard
          title="Usuarios Activos"
          value={metrics.totalUsuariosActivos}
          icon={Users}
          description="Con acceso al LMS"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inscripciones por mes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inscripciones por Mes</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics.inscripcionesPorMes}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="inscripciones" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado de Inscripciones</CardTitle>
            <CardDescription>Distribución actual</CardDescription>
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
                No hay inscripciones aún
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cursos más populares */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cursos Más Populares</CardTitle>
          <CardDescription>Top 5 por número de inscripciones</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.cursosMasPopulares.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics.cursosMasPopulares} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="titulo" 
                  tick={{ fontSize: 12 }} 
                  width={150}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="inscripciones" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No hay cursos con inscripciones
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
