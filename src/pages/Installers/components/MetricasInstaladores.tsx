import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Star, 
  DollarSign,
  Target,
  Activity,
  Users,
  Calendar
} from 'lucide-react';

interface MetricaInstalador {
  id: string;
  instalador: {
    nombre_completo: string;
  };
  periodo_inicio: string;
  periodo_fin: string;
  servicios_completados: number;
  servicios_cancelados: number;
  tiempo_promedio_instalacion: number;
  calificacion_promedio: number;
  porcentaje_puntualidad: number;
  porcentaje_calidad: number;
  ingresos_periodo: number;
  horas_trabajadas: number;
  kilometros_recorridos: number;
}

export const MetricasInstaladores = () => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes_actual');

  // Datos simulados - en producción vendría de la base de datos
  const metricas: MetricaInstalador[] = [
    {
      id: '1',
      instalador: { nombre_completo: 'Juan Carlos Rodríguez' },
      periodo_inicio: '2024-01-01',
      periodo_fin: '2024-01-31',
      servicios_completados: 28,
      servicios_cancelados: 2,
      tiempo_promedio_instalacion: 120,
      calificacion_promedio: 4.8,
      porcentaje_puntualidad: 96.7,
      porcentaje_calidad: 98.2,
      ingresos_periodo: 23800,
      horas_trabajadas: 176,
      kilometros_recorridos: 1240
    },
    {
      id: '2',
      instalador: { nombre_completo: 'María Elena Sánchez' },
      periodo_inicio: '2024-01-01',
      periodo_fin: '2024-01-31',
      servicios_completados: 32,
      servicios_cancelados: 1,
      tiempo_promedio_instalacion: 105,
      calificacion_promedio: 4.9,
      porcentaje_puntualidad: 100,
      porcentaje_calidad: 99.1,
      ingresos_periodo: 27200,
      horas_trabajadas: 168,
      kilometros_recorridos: 1560
    },
    {
      id: '3',
      instalador: { nombre_completo: 'Roberto Méndez Torres' },
      periodo_inicio: '2024-01-01',
      periodo_fin: '2024-01-31',
      servicios_completados: 18,
      servicios_cancelados: 3,
      tiempo_promedio_instalacion: 140,
      calificacion_promedio: 4.6,
      porcentaje_puntualidad: 85.7,
      porcentaje_calidad: 92.4,
      ingresos_periodo: 15300,
      horas_trabajadas: 126,
      kilometros_recorridos: 890
    }
  ];

  // Datos para gráficos
  const datosRendimiento = metricas.map(m => ({
    nombre: m.instalador.nombre_completo.split(' ')[0],
    servicios: m.servicios_completados,
    calificacion: m.calificacion_promedio,
    puntualidad: m.porcentaje_puntualidad,
    ingresos: m.ingresos_periodo
  }));

  const datosTiempo = [
    { mes: 'Oct', promedio: 125 },
    { mes: 'Nov', promedio: 118 },
    { mes: 'Dic', promedio: 115 },
    { mes: 'Ene', promedio: 112 }
  ];

  const datosDistribucion = [
    { name: 'Excelente (4.8-5.0)', value: 65, color: '#10b981' },
    { name: 'Bueno (4.0-4.7)', value: 30, color: '#3b82f6' },
    { name: 'Regular (3.0-3.9)', value: 5, color: '#f59e0b' }
  ];

  const estadisticasGenerales = {
    promedioServicios: Math.round(metricas.reduce((sum, m) => sum + m.servicios_completados, 0) / metricas.length),
    promedioCalificacion: (metricas.reduce((sum, m) => sum + m.calificacion_promedio, 0) / metricas.length).toFixed(1),
    promedioPuntualidad: Math.round(metricas.reduce((sum, m) => sum + m.porcentaje_puntualidad, 0) / metricas.length),
    totalIngresos: metricas.reduce((sum, m) => sum + m.ingresos_periodo, 0),
    eficienciaGeneral: 94.2
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Métricas de Performance</h2>
          <p className="text-muted-foreground mt-1">Análisis de rendimiento de instaladores</p>
        </div>
        <div className="flex gap-2">
          <select
            value={periodoSeleccionado}
            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="mes_actual">Mes Actual</option>
            <option value="trimestre">Último Trimestre</option>
            <option value="semestre">Último Semestre</option>
            <option value="año">Último Año</option>
          </select>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios Promedio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasGenerales.promedioServicios}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasGenerales.promedioCalificacion}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.2</span> vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntualidad</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasGenerales.promedioPuntualidad}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3%</span> vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${estadisticasGenerales.totalIngresos.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18%</span> vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticasGenerales.eficienciaGeneral}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> vs mes anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Rendimiento por instalador */}
        <Card>
          <CardHeader>
            <CardTitle>Servicios Completados por Instalador</CardTitle>
            <CardDescription>Comparativo de rendimiento mensual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosRendimiento}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="servicios" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolución tiempo promedio */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución Tiempo Promedio</CardTitle>
            <CardDescription>Tendencia de eficiencia en instalaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datosTiempo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="promedio" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribución de calificaciones y tabla de métricas */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Distribución de calificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Calificaciones</CardTitle>
            <CardDescription>Clasificación por rangos de calidad</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={datosDistribucion}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  label={({ value }) => `${value}%`}
                >
                  {datosDistribucion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {datosDistribucion.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabla de top performers */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Performers del Mes</CardTitle>
            <CardDescription>Instaladores con mejor rendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metricas
                .sort((a, b) => b.calificacion_promedio - a.calificacion_promedio)
                .map((metrica, index) => (
                <div key={metrica.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        #{index + 1}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium">{metrica.instalador.nombre_completo}</div>
                      <div className="text-sm text-muted-foreground">
                        {metrica.servicios_completados} servicios • {metrica.horas_trabajadas}h trabajadas
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{metrica.calificacion_promedio}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {metrica.porcentaje_puntualidad}% puntualidad
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas detalladas */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas Detalladas por Instalador</CardTitle>
          <CardDescription>Análisis completo de performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Instalador</th>
                  <th className="text-center p-2">Servicios</th>
                  <th className="text-center p-2">Calificación</th>
                  <th className="text-center p-2">Puntualidad</th>
                  <th className="text-center p-2">Tiempo Prom.</th>
                  <th className="text-center p-2">Ingresos</th>
                  <th className="text-center p-2">KM Recorridos</th>
                </tr>
              </thead>
              <tbody>
                {metricas.map((metrica) => (
                  <tr key={metrica.id} className="border-b">
                    <td className="p-2 font-medium">{metrica.instalador.nombre_completo}</td>
                    <td className="text-center p-2">
                      <Badge variant="outline">
                        {metrica.servicios_completados}
                      </Badge>
                    </td>
                    <td className="text-center p-2">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {metrica.calificacion_promedio}
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <Badge 
                        variant={metrica.porcentaje_puntualidad >= 95 ? 'default' : 'secondary'}
                      >
                        {metrica.porcentaje_puntualidad}%
                      </Badge>
                    </td>
                    <td className="text-center p-2">{metrica.tiempo_promedio_instalacion} min</td>
                    <td className="text-center p-2">${metrica.ingresos_periodo.toLocaleString()}</td>
                    <td className="text-center p-2">{metrica.kilometros_recorridos} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};