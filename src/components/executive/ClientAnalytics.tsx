import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Route,
  Users,
  CheckCircle,
  BarChart3,
  FileText,
  ArrowLeft,
  Trophy,
  Target,
  MapPin,
  Filter,
  Star,
  Percent,
  CalendarIcon
} from 'lucide-react';
import { useClientsData, useClientAnalytics, ClientSummary, useClientMetrics } from '@/hooks/useClientAnalytics';
import { Button } from '@/components/ui/button';

type DateFilterType = 'current_month' | 'current_quarter' | 'current_year' | 'custom';

interface DateRange {
  from: Date;
  to: Date;
}

export const ClientAnalytics = () => {
  // Date filtering state
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('current_month');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // Get actual date range based on filter type
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (dateFilterType) {
      case 'current_month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'current_quarter':
        return { from: startOfQuarter(now), to: endOfQuarter(now) };
      case 'current_year':
        return { from: startOfYear(now), to: endOfYear(now) };
      case 'custom':
        return customDateRange;
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  }, [dateFilterType, customDateRange]);

  const { data: clients, isLoading } = useClientsData(dateRange);
  const { data: clientMetrics, isLoading: metricsLoading } = useClientMetrics(dateRange);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('gmv');
  const [filterByType, setFilterByType] = useState<string>('all');
  const { data: clientAnalytics, isLoading: analyticsLoading } = useClientAnalytics(selectedClient || '', dateRange);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filteredAndSortedClients = useMemo(() => {
    if (!clients) return [];
    
    let filtered = clients.filter(client => 
      client.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply service type filter
    if (filterByType !== 'all') {
      filtered = filtered.filter(client => {
        // This would need additional data to filter by service type
        return true; // For now, show all
      });
    }

    // Sort clients
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'gmv':
          return b.totalGMV - a.totalGMV;
        case 'services':
          return b.totalServices - a.totalServices;
        case 'completion':
          return b.completionRate - a.completionRate;
        case 'aov':
          return (b.totalGMV / b.totalServices) - (a.totalGMV / a.totalServices);
        default:
          return b.totalGMV - a.totalGMV;
      }
    });

    return filtered;
  }, [clients, searchTerm, filterByType, sortBy]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedClient && clientAnalytics) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedClient(null)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Clientes
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{clientAnalytics.clientName}</h2>
              <p className="text-muted-foreground">Análisis detallado de performance</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Totales</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientAnalytics.totalServices}</div>
              <p className="text-xs text-muted-foreground">
                {clientAnalytics.servicesPerMonth.toFixed(1)}/mes promedio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GMV Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(clientAnalytics.totalGMV)}</div>
              <p className="text-xs text-muted-foreground">
                AOV: {formatCurrency(clientAnalytics.averageAOV)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cumplimiento</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientAnalytics.completionRate}%</div>
              <Progress value={clientAnalytics.completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">KM Promedio</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientAnalytics.averageKm}</div>
              <p className="text-xs text-muted-foreground">
                Total: {clientAnalytics.totalKm.toLocaleString()} km
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Actividad Temporal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Primer Servicio</span>
                <span className="text-sm">{clientAnalytics.firstService}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Último Servicio</span>
                <span className="text-sm">{clientAnalytics.lastService}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Servicios Completados</span>
                <Badge variant="outline">{clientAnalytics.completedServices}</Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium">Servicios Cancelados</span>
                <Badge variant="destructive">{clientAnalytics.cancelledServices}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tipos de Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clientAnalytics.serviceTypes.map((type, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{type.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{type.count}</span>
                      <Badge variant="outline">{type.percentage}%</Badge>
                    </div>
                  </div>
                  <Progress value={type.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia Mensual (Últimos 12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {clientAnalytics.monthlyTrend.map((month, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-2">
                  <div className="text-sm font-medium">{month.month}</div>
                  <div className="text-lg font-bold">{month.services} servicios</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(month.gmv)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custodian Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Performance por Custodio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientAnalytics.custodianPerformance.map((custodian, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{custodian.custodian}</div>
                    <div className="text-sm text-muted-foreground">
                      {custodian.services} servicios • {custodian.averageKm.toFixed(0)} km promedio
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{custodian.completionRate.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Cumplimiento</div>
                    </div>
                    <div className="w-20">
                      <Progress value={custodian.completionRate} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análisis de Performance de Clientes</h2>
          <p className="text-muted-foreground">
            Dashboard completo con métricas clave • {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
          </p>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Date Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período de Análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={dateFilterType} onValueChange={(value: DateFilterType) => setDateFilterType(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar período..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Mes Actual</SelectItem>
                <SelectItem value="current_quarter">Trimestre Actual</SelectItem>
                <SelectItem value="current_year">Año Actual</SelectItem>
                <SelectItem value="custom">Rango Personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            {dateFilterType === 'custom' && (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !customDateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.from ? format(customDateRange.from, "dd/MM/yyyy") : "Desde"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customDateRange.from}
                      onSelect={(date) => date && setCustomDateRange(prev => ({ ...prev, from: date }))}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !customDateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.to ? format(customDateRange.to, "dd/MM/yyyy") : "Hasta"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customDateRange.to}
                      onSelect={(date) => date && setCustomDateRange(prev => ({ ...prev, to: date }))}
                      disabled={(date) => date > new Date() || date < customDateRange.from}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      {!metricsLoading && clientMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Top AOV Client */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Mejor AOV</CardTitle>
              <Trophy className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(clientMetrics.topAOV.aov)}</div>
              <p className="text-xs text-green-700 font-medium">{clientMetrics.topAOV.clientName}</p>
              <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                {clientMetrics.topAOV.services} servicios
              </Badge>
            </CardContent>
          </Card>

          {/* Most Services Client */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Más Servicios</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{clientMetrics.mostServices.services}</div>
              <p className="text-xs text-blue-700 font-medium">{clientMetrics.mostServices.clientName}</p>
              <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-800">
                {formatCurrency(clientMetrics.mostServices.gmv)} GMV
              </Badge>
            </CardContent>
          </Card>

          {/* Highest GMV Client */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Mayor GMV</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(clientMetrics.highestGMV.gmv)}</div>
              <p className="text-xs text-purple-700 font-medium">{clientMetrics.highestGMV.clientName}</p>
              <Badge variant="secondary" className="mt-1 bg-purple-100 text-purple-800">
                {clientMetrics.highestGMV.services} servicios
              </Badge>
            </CardContent>
          </Card>

          {/* Best Completion Rate */}
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">Mejor Cumplimiento</CardTitle>
              <Star className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">{clientMetrics.bestCompletion.completionRate}%</div>
              <p className="text-xs text-amber-700 font-medium">{clientMetrics.bestCompletion.clientName}</p>
              <Badge variant="secondary" className="mt-1 bg-amber-100 text-amber-800">
                {clientMetrics.bestCompletion.services} servicios
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Service Type Analysis */}
      {!metricsLoading && clientMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Análisis de Rutas: Foráneos vs Locales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{clientMetrics.serviceTypeAnalysis.foraneo.count}</div>
                  <div className="text-sm text-blue-700">Servicios Foráneos</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(clientMetrics.serviceTypeAnalysis.foraneo.avgValue)} prom.</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{clientMetrics.serviceTypeAnalysis.local.count}</div>
                  <div className="text-sm text-green-700">Servicios Locales</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(clientMetrics.serviceTypeAnalysis.local.avgValue)} prom.</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>% Foráneos</span>
                  <span>{clientMetrics.serviceTypeAnalysis.foraneoPercentage}%</span>
                </div>
                <Progress value={clientMetrics.serviceTypeAnalysis.foraneoPercentage} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Promedio de KM por Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{clientMetrics.avgKmPerClient.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">KM promedio por cliente</div>
              </div>
              <div className="space-y-3">
                {clientMetrics.topKmClients.slice(0, 3).map((client, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{client.clientName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{client.avgKm} km</span>
                      <Badge variant="outline" className={index === 0 ? "bg-gold-50 text-gold-700" : ""}>
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda Avanzada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gmv">Mayor GMV</SelectItem>
                <SelectItem value="services">Más Servicios</SelectItem>
                <SelectItem value="completion">Mejor Cumplimiento</SelectItem>
                <SelectItem value="aov">Mejor AOV</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterByType} onValueChange={setFilterByType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de servicio..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="local">Solo Locales</SelectItem>
                <SelectItem value="foraneo">Solo Foráneos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedClients.map((client, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => setSelectedClient(client.nombre_cliente)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium line-clamp-2">
                {client.nombre_cliente}
              </CardTitle>
              <div className="flex items-center gap-1">
                {index < 3 && (
                  <Badge variant="secondary" className="bg-gold-50 text-gold-700 text-xs">
                    TOP {index + 1}
                  </Badge>
                )}
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-xs text-muted-foreground">Servicios</div>
                  <div className="font-bold">{client.totalServices}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-xs text-muted-foreground">GMV</div>
                  <div className="font-bold text-green-700">{formatCurrency(client.totalGMV)}</div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-2 rounded">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-xs text-muted-foreground">AOV</span>
                  <span className="font-medium text-purple-700">
                    {formatCurrency(client.totalGMV / client.totalServices)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Cumplimiento</span>
                  <span className="font-medium">{client.completionRate}%</span>
                </div>
                <Progress 
                  value={client.completionRate} 
                  className={`h-2 ${client.completionRate >= 95 ? 'bg-green-200' : client.completionRate >= 85 ? 'bg-yellow-200' : 'bg-red-200'}`}
                />
              </div>

              <div className="text-xs text-muted-foreground bg-slate-50 p-2 rounded">
                Último servicio: {client.lastService}
              </div>
              
              <Button variant="outline" size="sm" className="w-full mt-3 hover:bg-primary hover:text-primary-foreground">
                Ver Análisis Completo
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedClients.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No se encontraron clientes</h3>
          <p className="text-muted-foreground">Intenta ajustar los filtros o el término de búsqueda</p>
        </div>
      )}
    </div>
  );
};