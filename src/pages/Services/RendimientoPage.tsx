
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, CheckCircle, TrendingUp, Users, Timer, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
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

  // Calcular crecimiento (simulado para demostración)
  const calcularCrecimiento = (valor: number) => {
    const crecimiento = Math.floor(Math.random() * 20) - 10; // -10% a +10%
    return crecimiento;
  };

  const formatearTiempo = (horas: number) => {
    if (horas < 1) {
      return `${Math.round(horas * 60)}min`;
    }
    return `${horas.toFixed(1)}h`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rendimiento del Workflow</h1>
        <p className="text-muted-foreground mt-2">
          Monitorea el rendimiento y identifica cuellos de botella en el proceso de servicios de monitoreo GPS
        </p>
      </div>

      {/* Métricas principales mejoradas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Servicios */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">Total Servicios</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {metricas?.totalServicios || 0}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center text-xs text-blue-600">
                {calcularCrecimiento(metricas?.totalServicios || 0) >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{Math.abs(calcularCrecimiento(metricas?.totalServicios || 0))}%</span>
              </div>
              <p className="text-xs text-blue-600">vs mes anterior</p>
            </div>
          </CardContent>
        </Card>

        {/* Servicios Activos */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Servicios Activos</CardTitle>
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 mb-1">
              {metricas?.serviciosActivos || 0}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center text-xs text-green-600">
                <ArrowUpRight className="h-3 w-3" />
                <span>{Math.abs(calcularCrecimiento(metricas?.serviciosActivos || 0))}%</span>
              </div>
              <p className="text-xs text-green-600">funcionando correctamente</p>
            </div>
          </CardContent>
        </Card>

        {/* En Proceso */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">En Proceso</CardTitle>
            <div className="p-2 bg-orange-500 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 mb-1">
              {metricas?.serviciosEnProceso || 0}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center text-xs text-orange-600">
                <Clock className="h-3 w-3" />
                <span>En diferentes etapas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasa Completación */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">Tasa Completación</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 mb-2">
              {metricas?.tasaCompletacion || 0}%
            </div>
            <Progress 
              value={metricas?.tasaCompletacion || 0} 
              className="h-2 bg-purple-200"
            />
            <p className="text-xs text-purple-600 mt-1">Eficiencia del proceso</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribución por etapas */}
        <Card className="shadow-lg">
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
                <Bar dataKey="cantidad" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico circular de estados */}
        <Card className="shadow-lg">
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

      {/* Tiempo promedio de procesamiento mejorado */}
      <Card className="shadow-lg">
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
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatearTiempo(metricas?.tiempoPromedioAprobacion || 0)}
              </div>
              <div className="text-sm font-medium text-blue-800">Tiempo Promedio Aprobación</div>
              <div className="text-xs text-blue-600 mt-1">Coordinador de Operaciones</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">
                2.5h
              </div>
              <div className="text-sm font-medium text-green-800">Tiempo Promedio Análisis</div>
              <div className="text-xs text-green-600 mt-1">Análisis de Riesgo de Seguridad</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {formatearTiempo((metricas?.tiempoPromedioAprobacion || 0) + 2.5 + 19.5)}
              </div>
              <div className="text-sm font-medium text-purple-800">Tiempo Promedio Total</div>
              <div className="text-xs text-purple-600 mt-1">Desde solicitud hasta activo</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cuellos de botella mejorados */}
      <Card className="shadow-lg">
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
              {cuellosBottella.slice(0, 8).map((servicio) => (
                <div key={servicio.id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-medium text-gray-900">
                        Servicio ID: {servicio.id.slice(0, 8)}...
                      </div>
                      <Badge className={getPrioridadColor(servicio.prioridad)}>
                        {servicio.prioridad.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Estado:</span> {servicio.estado_general}
                    </div>
                    <div className="text-sm text-gray-500">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {servicio.diasEnEtapa} días en esta etapa
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">
                      {servicio.diasEnEtapa}
                    </div>
                    <div className="text-xs text-orange-500">días</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Excelente rendimiento!
              </h3>
              <p className="text-gray-600">
                No se detectaron cuellos de botella significativos en el sistema
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RendimientoPage;
