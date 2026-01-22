import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePlanificadoresPerformance } from '../hooks/usePlanificadoresPerformance';
import type { PeriodoReporte, CriterioOrdenamiento } from '../types';
import PlanificadorRankingCard from './PlanificadorRankingCard';

export default function PlanificadoresPerformanceDashboard() {
  const [periodo, setPeriodo] = useState<PeriodoReporte>('mes');
  const [ordenarPor, setOrdenarPor] = useState<CriterioOrdenamiento>('score');
  
  const { data, isLoading, error } = usePlanificadoresPerformance(periodo);
  
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  if (!data || data.length === 0) {
    return <EmptyState />;
  }
  
  const planificadoresOrdenados = [...data].sort((a, b) => {
    switch (ordenarPor) {
      case 'servicios':
        return b.serviciosCreados - a.serviciosCreados;
      case 'calidad':
        return b.tasaAceptacion - a.tasaAceptacion;
      case 'eficiencia':
        return b.serviciosPorDia - a.serviciosPorDia;
      default:
        return b.score - a.score;
    }
  });
  
  // Excluir usuarios "Control" del podio (solo planificadores regulares compiten)
  const planificadoresReales = planificadoresOrdenados.filter(p => !p.esControl);
  const top3 = planificadoresReales.slice(0, 3);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Performance Individual de Planificadores</h2>
          <p className="text-sm text-muted-foreground">
            Ranking y métricas detalladas por planificador
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoReporte)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Última Semana</SelectItem>
              <SelectItem value="mes">Último Mes</SelectItem>
              <SelectItem value="trimestre">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Año</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={ordenarPor} onValueChange={(v) => setOrdenarPor(v as CriterioOrdenamiento)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Score General</SelectItem>
              <SelectItem value="servicios">Más Servicios</SelectItem>
              <SelectItem value="calidad">Mayor Calidad</SelectItem>
              <SelectItem value="eficiencia">Mayor Eficiencia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {top3.map((planificador, index) => (
          <PlanificadorRankingCard
            key={planificador.id}
            planificador={planificador}
            position={index + 1}
          />
        ))}
      </div>
      
      <Card className="shadow-apple-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Detalle Completo de Métricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Planificador</TableHead>
                <TableHead className="text-center">Servicios</TableHead>
                <TableHead className="text-center">Por Día</TableHead>
                <TableHead className="text-center">Tasa Aceptación</TableHead>
                <TableHead className="text-center">Tasa Completado</TableHead>
                <TableHead className="text-center">Tiempo Medio</TableHead>
                <TableHead className="text-center">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planificadoresOrdenados.map((planificador, index) => (
                <TableRow key={planificador.id}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {index < 3 ? (
                        <Badge 
                          variant="default" 
                          className={
                            index === 0 
                              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                              : index === 1 
                              ? 'bg-gray-400 hover:bg-gray-500 text-white' 
                              : 'bg-amber-700 hover:bg-amber-800 text-white'
                          }
                        >
                          {index + 1}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{index + 1}</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{planificador.nombre}</div>
                        <div className="text-xs text-muted-foreground">{planificador.email}</div>
                      </div>
                      {planificador.esControl && (
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                          Control
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Badge variant="secondary">{planificador.serviciosCreados}</Badge>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {planificador.serviciosPorDia.toFixed(1)}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>{planificador.tasaAceptacion}%</span>
                      {planificador.tasaAceptacion >= 85 && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {planificador.tasaCompletado}%
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {planificador.tiempoPromedioAsignacion}min
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Badge 
                      variant={
                        planificador.score >= 80 
                          ? 'default' 
                          : planificador.score >= 60 
                          ? 'secondary' 
                          : 'destructive'
                      }
                      className={
                        planificador.score >= 80 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : ''
                      }
                    >
                      {planificador.score}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
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
        <p>No hay planificadores disponibles para el período seleccionado</p>
      </CardContent>
    </Card>
  );
}
