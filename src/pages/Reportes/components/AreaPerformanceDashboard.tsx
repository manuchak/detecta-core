import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { useAreaPerformanceMetrics } from '../hooks/useAreaPerformanceMetrics';
import type { PeriodoReporte } from '../types';
import MetricCard from './MetricCard';

export default function AreaPerformanceDashboard() {
  const [periodo, setPeriodo] = useState<PeriodoReporte>('mes');
  const { data, isLoading, error } = useAreaPerformanceMetrics(periodo);
  
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  if (!data) {
    return <EmptyState />;
  }
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Performance General del Área</h2>
          <p className="text-sm text-muted-foreground">
            Métricas agregadas de eficiencia operativa
          </p>
        </div>
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoReporte)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semana">Última Semana</SelectItem>
            <SelectItem value="mes">Último Mes</SelectItem>
            <SelectItem value="trimestre">Último Trimestre</SelectItem>
            <SelectItem value="year">Último Año</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Servicios Creados"
          value={data.totalServiciosCreados}
          subtitle={`${data.serviciosPorDia.toFixed(1)} por día`}
          trend={data.tendenciaMensual}
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="text-blue-600"
        />
        
        <MetricCard
          title="Tasa de Aceptación"
          value={`${data.tasaAceptacion}%`}
          subtitle="Servicios confirmados"
          trend={5.2}
          icon={<CheckCircle className="h-5 w-5" />}
          iconColor="text-green-600"
        />
        
        <MetricCard
          title="Tiempo Medio Asignación"
          value={`${data.tiempoMedioAsignacion}min`}
          subtitle="Desde creación a asignación"
          trend={-8.5}
          icon={<Clock className="h-5 w-5" />}
          iconColor="text-amber-600"
          trendInverted
        />
        
        <MetricCard
          title="Cumplimiento Armados"
          value={`${data.cumplimientoArmados}%`}
          subtitle="Servicios con armado asignado"
          trend={3.1}
          icon={<Shield className="h-5 w-5" />}
          iconColor="text-purple-600"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-apple-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completados a Tiempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.serviciosCompletadosATiempo}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dentro de ventana horaria
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-apple-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custodios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.custodiosActivosPromedio}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Disponibles para asignación
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-apple-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Personal Armado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.armadosActivosPromedio}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Armados disponibles
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-apple-soft">
        <CardHeader>
          <CardTitle>Evolución de Servicios (Últimos 30 Días)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.historicoServicios}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="fecha" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="creados" 
                stroke="#0088FE" 
                strokeWidth={2}
                name="Creados" 
                dot={{ fill: '#0088FE', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="completados" 
                stroke="#00C49F" 
                strokeWidth={2}
                name="Completados" 
                dot={{ fill: '#00C49F', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="cancelados" 
                stroke="#FF8042" 
                strokeWidth={2}
                name="Cancelados" 
                dot={{ fill: '#FF8042', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-apple-soft">
          <CardHeader>
            <CardTitle>Servicios por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(data.serviciosPorEstado).map(([key, value]) => ({
                    name: formatEstado(key),
                    value
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(data.serviciosPorEstado).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {Object.entries(data.serviciosPorEstado).map(([key, value], index) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{formatEstado(key)}</span>
                  </div>
                  <Badge variant="secondary">{value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-apple-soft">
          <CardHeader>
            <CardTitle>Servicios por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(data.serviciosPorTipo).map(([key, value]) => ({
                    name: formatTipo(key),
                    value
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(data.serviciosPorTipo).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {Object.entries(data.serviciosPorTipo).map(([key, value], index) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{formatTipo(key)}</span>
                  </div>
                  <Badge variant="secondary">{value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatEstado(estado: string): string {
  const map: Record<string, string> = {
    'pendiente_asignacion': 'Pendiente Asignación',
    'confirmado': 'Confirmado',
    'en_curso': 'En Curso',
    'completado': 'Completado',
    'cancelado': 'Cancelado',
    'sin_estado': 'Sin Estado'
  };
  return map[estado] || estado;
}

function formatTipo(tipo: string): string {
  const map: Record<string, string> = {
    'con_armado': 'Con Armado',
    'sin_armado': 'Sin Armado'
  };
  return map[tipo] || tipo;
}

function renderCustomLabel(entry: any) {
  return `${entry.value}`;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

function ErrorMessage({ error }: { error: any }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <p>Error al cargar métricas: {error.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="pt-6 text-center text-muted-foreground">
        <p>No hay datos disponibles para el período seleccionado</p>
      </CardContent>
    </Card>
  );
}
