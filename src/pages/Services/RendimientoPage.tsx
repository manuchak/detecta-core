
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, CheckCircle, TrendingUp, Users, Timer } from 'lucide-react';
import { useRendimientoWorkflow } from '@/hooks/useRendimientoWorkflow';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export const RendimientoPage = () => {
  const {
    metricas,
    loadingMetricas,
    distribucionEtapas,
    loadingDistribucion,
    cuellosBottella,
    loadingCuellos
  } = useRendimientoWorkflow();

  if (loadingMetricas || loadingDistribucion || loadingCuellos) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rendimiento del Workflow</h1>
        <p className="text-muted-foreground mt-2">
          Monitorea el rendimiento y identifica cuellos de botella en el proceso de servicios de monitoreo GPS
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas?.totalServicios || 0}</div>
            <p className="text-xs text-muted-foreground">
              Servicios registrados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metricas?.serviciosActivos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Servicios completamente funcionales
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metricas?.serviciosEnProceso || 0}</div>
            <p className="text-xs text-muted-foreground">
              Servicios en diferentes etapas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Completación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metricas?.tasaCompletacion || 0}%</div>
            <Progress value={metricas?.tasaCompletacion || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribución por etapas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Etapas</CardTitle>
            <CardDescription>
              Cantidad de servicios en cada etapa del workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distribucionEtapas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nombre" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico circular de estados */}
        <Card>
          <CardHeader>
            <CardTitle>Estados del Workflow</CardTitle>
            <CardDescription>
              Proporción de servicios por estado actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribucionEtapas?.filter(d => d.cantidad > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nombre, cantidad }) => `${nombre}: ${cantidad}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cantidad"
                >
                  {distribucionEtapas?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tiempo promedio de procesamiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Métricas de Tiempo
          </CardTitle>
          <CardDescription>
            Tiempos promedio de procesamiento en las diferentes etapas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {metricas?.tiempoPromedioAprobacion || 0}h
              </div>
              <div className="text-sm text-blue-800">Tiempo Promedio Aprobación</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                2.5h
              </div>
              <div className="text-sm text-green-800">Tiempo Promedio Análisis</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                24h
              </div>
              <div className="text-sm text-purple-800">Tiempo Promedio Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cuellos de botella */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Cuellos de Botella Identificados
          </CardTitle>
          <CardDescription>
            Servicios que llevan más tiempo del esperado en una etapa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cuellosBottella && cuellosBottella.length > 0 ? (
            <div className="space-y-4">
              {cuellosBottella.slice(0, 10).map((servicio) => (
                <div key={servicio.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Servicio ID: {servicio.id.slice(0, 8)}...</div>
                    <div className="text-sm text-gray-600">
                      Estado: {servicio.estado_general} • {servicio.diasEnEtapa} días en esta etapa
                    </div>
                  </div>
                  <Badge className={getPrioridadColor(servicio.prioridad)}>
                    {servicio.prioridad.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>¡Excelente! No se detectaron cuellos de botella significativos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RendimientoPage;
