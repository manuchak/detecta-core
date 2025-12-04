import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Building2, Clock, DollarSign, TrendingUp, Target, BarChart3, Lightbulb } from 'lucide-react';
import { useProveedoresExternosBIMetrics } from '../hooks/useProveedoresExternosBIMetrics';
import { TimeRangeSelector } from './bi/TimeRangeSelector';
import { KPICardWithTrend } from './bi/KPICardWithTrend';
import { MonthlyEvolutionChart } from './bi/MonthlyEvolutionChart';
import { ProviderRadarChart } from './bi/ProviderRadarChart';
import { ClientConcentrationChart } from './bi/ClientConcentrationChart';
import { DecisionTable } from './bi/DecisionTable';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProveedoresExternosBIDashboard() {
  const { 
    metrics, 
    isLoading, 
    filter, 
    setFilter, 
    availableYears, 
    availableMonths, 
    availableQuarters 
  } = useProveedoresExternosBIMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No se encontraron datos para el período seleccionado</p>
      </Card>
    );
  }

  const { periodoActual, periodoComparacion, delta, evolucionMensual, insights } = metrics;

  return (
    <div className="space-y-6">
      {/* Header with time selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-corporate-blue" />
            Dashboard BI - Proveedores Externos
          </h2>
          <p className="text-muted-foreground">
            Análisis estratégico para optimización de costos y decisiones tácticas
          </p>
        </div>
        <TimeRangeSelector
          filter={filter}
          onFilterChange={setFilter}
          availableYears={availableYears}
          availableMonths={availableMonths}
          availableQuarters={availableQuarters}
        />
      </div>

      {/* Insights alerts */}
      {insights.length > 0 && (
        <Card className="bg-gradient-to-r from-corporate-blue/5 to-corporate-gold/5 border-corporate-blue/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-corporate-gold mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Insights Automáticos</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {insights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="estrategico" className="space-y-6">
        <TabsList className="bg-background/95 backdrop-blur-sm border">
          <TabsTrigger value="estrategico" className="data-[state=active]:bg-corporate-blue data-[state=active]:text-white">
            <Target className="h-4 w-4 mr-2" />
            Estratégico
          </TabsTrigger>
          <TabsTrigger value="tactico" className="data-[state=active]:bg-corporate-blue data-[state=active]:text-white">
            <TrendingUp className="h-4 w-4 mr-2" />
            Táctico
          </TabsTrigger>
          <TabsTrigger value="operativo" className="data-[state=active]:bg-corporate-blue data-[state=active]:text-white">
            <Building2 className="h-4 w-4 mr-2" />
            Operativo
          </TabsTrigger>
        </TabsList>

        {/* STRATEGIC VIEW */}
        <TabsContent value="estrategico" className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICardWithTrend
              title="Gasto Total"
              value={periodoActual.costoTotal}
              previousValue={periodoComparacion?.costoTotal}
              delta={delta?.costoTotal}
              deltaLabel={periodoComparacion?.periodo}
              format="currency"
              icon={DollarSign}
              trendIsGood={false}
              target={periodoActual.costoTotal * 0.8}
              targetLabel="Óptimo"
            />
            <KPICardWithTrend
              title="Aprovechamiento"
              value={periodoActual.aprovechamiento}
              previousValue={periodoComparacion?.aprovechamiento}
              delta={delta?.aprovechamiento}
              deltaLabel={periodoComparacion?.periodo}
              format="percentage"
              icon={TrendingUp}
              trendIsGood={true}
              target={50}
              targetLabel="Meta"
            />
            <KPICardWithTrend
              title="Revenue Leakage"
              value={periodoActual.revenueLoss}
              previousValue={periodoComparacion?.revenueLoss}
              delta={delta?.revenueLoss}
              deltaLabel={periodoComparacion?.periodo}
              format="currency"
              icon={AlertCircle}
              trendIsGood={false}
            />
            <KPICardWithTrend
              title="Servicios"
              value={periodoActual.serviciosTotales}
              previousValue={periodoComparacion?.serviciosTotales}
              delta={delta?.servicios}
              deltaLabel={periodoComparacion?.periodo}
              format="number"
              icon={Clock}
              trendIsGood={true}
            />
          </div>

          {/* Evolution chart */}
          <MonthlyEvolutionChart data={evolucionMensual} targetAprovechamiento={50} />

          {/* Two column layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ProviderRadarChart providers={periodoActual.porProveedor} />
            <ClientConcentrationChart clients={periodoActual.porCliente} />
          </div>
        </TabsContent>

        {/* TACTICAL VIEW */}
        <TabsContent value="tactico" className="space-y-6">
          <DecisionTable 
            providers={periodoActual.porProveedor}
            previousProviders={periodoComparacion?.porProveedor}
          />

          {/* Provider detail cards */}
          <div className="grid lg:grid-cols-2 gap-6">
            {periodoActual.porProveedor.map((prov) => {
              const prevProv = periodoComparacion?.porProveedor.find(p => p.proveedor === prov.proveedor);
              return (
                <Card key={prov.proveedor} className="bg-background/80 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{prov.proveedor}</CardTitle>
                      <Badge variant={prov.aprovechamiento < 20 ? "destructive" : prov.aprovechamiento < 40 ? "secondary" : "default"}>
                        {prov.aprovechamiento.toFixed(1)}% aprovech.
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Servicios</p>
                        <p className="text-xl font-bold">{prov.servicios}</p>
                        {prevProv && (
                          <p className="text-xs text-muted-foreground">
                            Anterior: {prevProv.servicios}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground">Horas Promedio</p>
                        <p className="text-xl font-bold">{prov.horasPromedio.toFixed(1)}h</p>
                        <p className="text-xs text-muted-foreground">de 12h contratadas</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Costo Estimado</p>
                        <p className="text-lg font-semibold">
                          ${(prov.costoEstimado / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue Loss</p>
                        <p className="text-lg font-semibold text-red-600">
                          ${(prov.revenueLoss / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>
                    
                    {/* Utilization bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Horas utilizadas vs contratadas</span>
                        <span>{prov.horasTotales.toFixed(0)}h / {prov.horasContratadas.toFixed(0)}h</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-corporate-blue rounded-full transition-all"
                          style={{ width: `${Math.min(prov.aprovechamiento, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* OPERATIVE VIEW */}
        <TabsContent value="operativo" className="space-y-6">
          {/* Period summary */}
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Período: {periodoActual.periodo}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Servicios</p>
                  <p className="text-3xl font-bold">{periodoActual.serviciosTotales}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Totales</p>
                  <p className="text-3xl font-bold">{periodoActual.horasTotales.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Contratadas</p>
                  <p className="text-3xl font-bold">{periodoActual.horasContratadas.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clientes Únicos</p>
                  <p className="text-3xl font-bold">{periodoActual.porCliente.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top clients table */}
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Top 10 Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {periodoActual.porCliente.map((client, i) => (
                  <div key={client.cliente} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-6 text-muted-foreground">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium truncate max-w-[200px]">{client.cliente}</span>
                        <span className="text-sm">{client.servicios} servicios ({client.porcentaje.toFixed(1)}%)</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-corporate-blue rounded-full"
                          style={{ width: `${client.porcentaje}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Day of week distribution */}
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Distribución por Día de Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {periodoActual.porDiaSemana.map((day) => {
                  const maxServicios = Math.max(...periodoActual.porDiaSemana.map(d => d.servicios), 1);
                  const height = (day.servicios / maxServicios) * 100;
                  return (
                    <div key={day.dia} className="flex flex-col items-center">
                      <div className="h-24 w-full flex items-end justify-center">
                        <div 
                          className="w-8 bg-corporate-blue/80 rounded-t transition-all hover:bg-corporate-blue"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-xs mt-1 text-muted-foreground">{day.dia.slice(0, 3)}</span>
                      <span className="text-xs font-medium">{day.servicios}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
