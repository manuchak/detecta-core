import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTicketMetrics } from '@/hooks/useTicketMetrics';
import { Loader2, BarChart3, Users, PieChart, AlertCircle } from 'lucide-react';
import { MetricsKPICards } from '@/components/admin/tickets/MetricsKPICards';
import { TicketTrendsChart } from '@/components/admin/tickets/TicketTrendsChart';
import { CategoryDistributionChart } from '@/components/admin/tickets/CategoryDistributionChart';
import { DepartmentPerformanceChart } from '@/components/admin/tickets/DepartmentPerformanceChart';
import { LoadHeatmap } from '@/components/admin/tickets/LoadHeatmap';
import { AgentPerformanceTable } from '@/components/admin/tickets/AgentPerformanceTable';
import { DateRangePicker } from '@/components/admin/tickets/DateRangePicker';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const TicketMetricsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  const { metrics, loading, error } = useTicketMetrics({
    startDate: dateRange.start,
    endDate: dateRange.end
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-destructive">
        <AlertCircle className="h-6 w-6 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Métricas de Tickets</h1>
          <p className="text-muted-foreground">
            Dashboard de rendimiento y análisis del sistema de soporte
          </p>
        </div>
        <DateRangePicker 
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* KPI Cards */}
      {metrics && <MetricsKPICards metrics={metrics} />}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Categorías</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Agentes</span>
          </TabsTrigger>
          <TabsTrigger value="load" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Carga</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Tickets</CardTitle>
                <CardDescription>
                  Tickets creados vs resueltos por día
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics && <TicketTrendsChart data={metrics.ticketsByDay} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Departamento</CardTitle>
                <CardDescription>
                  Tiempo de resolución y cumplimiento SLA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics && <DepartmentPerformanceChart data={metrics.ticketsByDepartment} />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Categoría</CardTitle>
                <CardDescription>
                  Volumen de tickets por tipo de solicitud
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {metrics && <CategoryDistributionChart data={metrics.ticketsByCategory} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Categorías</CardTitle>
                <CardDescription>
                  Categorías con mayor volumen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.ticketsByCategory.slice(0, 5).map((cat, i) => (
                    <div key={cat.categoria} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-muted">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium truncate">{cat.categoria}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {cat.count} tickets
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {metrics.totalTickets > 0 
                            ? Math.round((cat.count / metrics.totalTickets) * 100) 
                            : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Agentes</CardTitle>
              <CardDescription>
                Métricas individuales de cada agente de soporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics && <AgentPerformanceTable data={metrics.agentPerformance} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="load" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de Calor de Carga</CardTitle>
              <CardDescription>
                Distribución de tickets por día de la semana y hora del día
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics && <LoadHeatmap data={metrics.loadHeatmap} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TicketMetricsPage;
