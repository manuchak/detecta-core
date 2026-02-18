import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, differenceInDays, subDays } from 'date-fns';
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
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  AlertTriangle,
  Clock,
  Download
} from 'lucide-react';
import { useClientsData, useClientAnalytics, ClientSummary, useClientMetrics, useClientTableData } from '@/hooks/useClientAnalytics';
import { Button } from '@/components/ui/button';
import { exportClientAnalyticsPDF } from './pdf/ClientAnalyticsPDFExporter';
import { toast } from 'sonner';
import { format as dateFnsFormat } from 'date-fns';

type DateFilterType = 'current_month' | 'current_quarter' | 'current_year' | 'custom' | 'last_90d' | 'last_120d' | 'last_180d' | 'last_360d';

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
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000); // MTD -1 day
    
    switch (dateFilterType) {
      case 'current_month':
        return { from: startOfMonth(now), to: yesterday }; // MTD -1 day
      case 'current_quarter':
        return { from: startOfQuarter(now), to: yesterday };
      case 'current_year':
        return { from: startOfYear(now), to: yesterday };
      case 'last_90d':
        return { from: subDays(now, 90), to: yesterday };
      case 'last_120d':
        return { from: subDays(now, 120), to: yesterday };
      case 'last_180d':
        return { from: subDays(now, 180), to: yesterday };
      case 'last_360d':
        return { from: subDays(now, 360), to: yesterday };
      case 'custom':
        return customDateRange;
      default:
        return { from: startOfMonth(now), to: yesterday }; // MTD -1 day
    }
  }, [dateFilterType, customDateRange]);

  const { data: clients, isLoading } = useClientsData(dateRange);
  const { data: clientMetrics, isLoading: metricsLoading } = useClientMetrics(dateRange);
  const { data: tableData, isLoading: tableLoading } = useClientTableData(dateRange);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('gmv');
  const [filterByType, setFilterByType] = useState<string>('all');
  const { data: clientAnalytics, isLoading: analyticsLoading } = useClientAnalytics(selectedClient || '', dateRange);

  const handleDownloadPDF = async () => {
    const periodLabels: Record<string, string> = {
      current_month: 'MTD - Mes en Curso',
      current_quarter: 'QTD - Trimestre en Curso',
      current_year: 'YTD - Año en Curso',
      last_90d: 'Últimos 90 días',
      last_120d: 'Últimos 120 días',
      last_180d: 'Últimos 180 días',
      last_360d: 'Últimos 360 días',
      custom: `${dateFnsFormat(dateRange.from, 'dd/MM/yyyy')} – ${dateFnsFormat(dateRange.to, 'dd/MM/yyyy')}`,
    };
    const dateLabel = periodLabels[dateFilterType] || 'MTD';

    toast.promise(
      exportClientAnalyticsPDF(
        {
          dateRange,
          dateLabel,
          clientMetrics: clientMetrics ?? null,
          tableData: filteredAndSortedClients,
          clientAnalytics: clientAnalytics ?? null,
        },
        selectedClient || undefined
      ),
      {
        loading: 'Generando reporte PDF...',
        success: 'Reporte descargado exitosamente',
        error: 'Error al generar el reporte PDF',
      }
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filteredAndSortedClients = useMemo(() => {
    if (!tableData) return [];
    
    let filtered = tableData.filter(client => 
      client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort clients
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'gmv':
          return b.currentGMV - a.currentGMV;
        case 'services':
          return b.currentServices - a.currentServices;
        case 'completion':
          return b.completionRate - a.completionRate;
        case 'aov':
          return b.currentAOV - a.currentAOV;
        case 'growth':
          return b.gmvGrowth - a.gmvGrowth;
        case 'days_inactive':
          return a.daysSinceLastService - b.daysSinceLastService;
        default:
          return b.currentGMV - a.currentGMV;
      }
    });

    return filtered;
  }, [tableData, searchTerm, sortBy]);

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
      <div className="space-y-6" id="client-analytics-content">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedClient(null)}
              className="gap-2 pdf-ignore"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Clientes
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{clientAnalytics.clientName}</h2>
              <p className="text-muted-foreground">Análisis detallado de performance</p>
            </div>
          </div>
          <Button 
            onClick={handleDownloadPDF}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground pdf-ignore"
            size="sm"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
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
    <div className="space-y-6" id="client-analytics-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análisis de Performance de Clientes</h2>
          <p className="text-muted-foreground">
            Dashboard completo con métricas clave • MTD {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM/yyyy')} 
            {dateFilterType === 'current_month' && <span className="text-orange-600 ml-2">(datos con 1 día de retraso)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleDownloadPDF}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground pdf-ignore"
            size="sm"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="gap-2 pdf-ignore"
          >
            <TrendingUp className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
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
                <SelectItem value="current_month">MTD - Mes en Curso</SelectItem>
                <SelectItem value="current_quarter">QTD - Trimestre en Curso</SelectItem>
                <SelectItem value="current_year">YTD - Año en Curso</SelectItem>
                <SelectItem value="last_90d">Últimos 90 días</SelectItem>
                <SelectItem value="last_120d">Últimos 120 días</SelectItem>
                <SelectItem value="last_180d">Últimos 180 días</SelectItem>
                <SelectItem value="last_360d">Últimos 360 días</SelectItem>
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
                <SelectItem value="growth">Mayor Crecimiento</SelectItem>
                <SelectItem value="days_inactive">Días sin Actividad</SelectItem>
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

      {/* Enhanced Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Clientes - Análisis de Performance y Tendencias
          </CardTitle>
          <CardDescription>
            Tabla completa con métricas de crecimiento, tendencias y alertas • {filteredAndSortedClients.length} clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tableLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Cargando datos...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Cliente</TableHead>
                    <TableHead className="text-center">Servicios</TableHead>
                    <TableHead className="text-center">GMV Actual</TableHead>
                    <TableHead className="text-center">AOV</TableHead>
                    <TableHead className="text-center">Cumplimiento</TableHead>
                    <TableHead className="text-center">Crecimiento GMV</TableHead>
                    <TableHead className="text-center">Crecimiento Servicios</TableHead>
                    <TableHead className="text-center">Días sin Actividad</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedClients.map((client, index) => (
                    <TableRow 
                      key={client.clientName} 
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedClient(client.clientName)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {index < 3 && (
                              <Badge variant="secondary" className="bg-gold-50 text-gold-700 text-xs">
                                #{index + 1}
                              </Badge>
                            )}
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="line-clamp-2">{client.clientName}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">{client.currentServices}</span>
                          {client.servicesGrowth !== 0 && (
                            <div className="flex items-center gap-1">
                              {client.servicesGrowth > 0 ? (
                                <ArrowUpIcon className="h-3 w-3 text-green-600" />
                              ) : (
                                <ArrowDownIcon className="h-3 w-3 text-red-600" />
                              )}
                              <span className={`text-xs ${client.servicesGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(client.servicesGrowth)}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-green-700">
                            {formatCurrency(client.currentGMV)}
                          </span>
                          {client.gmvGrowth !== 0 && (
                            <div className="flex items-center gap-1">
                              {client.gmvGrowth > 0 ? (
                                <ArrowUpIcon className="h-3 w-3 text-green-600" />
                              ) : (
                                <ArrowDownIcon className="h-3 w-3 text-red-600" />
                              )}
                              <span className={`text-xs ${client.gmvGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {client.gmvGrowth > 0 ? '+' : ''}{client.gmvGrowth.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-purple-700">
                            {formatCurrency(client.currentAOV)}
                          </span>
                          {client.aovGrowth !== 0 && (
                            <div className="flex items-center gap-1">
                              {client.aovGrowth > 0 ? (
                                <ArrowUpIcon className="h-3 w-3 text-green-600" />
                              ) : (
                                <ArrowDownIcon className="h-3 w-3 text-red-600" />
                              )}
                              <span className={`text-xs ${client.aovGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {client.aovGrowth > 0 ? '+' : ''}{client.aovGrowth.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold">{client.completionRate.toFixed(1)}%</span>
                          <Progress 
                            value={client.completionRate} 
                            className="w-16 h-1"
                          />
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {client.gmvGrowth > 10 ? (
                            <Badge className="bg-green-100 text-green-800 gap-1">
                              <ArrowUpIcon className="h-3 w-3" />
                              Creciendo
                            </Badge>
                          ) : client.gmvGrowth < -10 ? (
                            <Badge className="bg-red-100 text-red-800 gap-1">
                              <ArrowDownIcon className="h-3 w-3" />
                              Decreciendo
                            </Badge>
                          ) : (
                            <Badge variant="outline">Estable</Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {client.servicesGrowth > 2 ? (
                            <Badge className="bg-blue-100 text-blue-800 gap-1">
                              <ArrowUpIcon className="h-3 w-3" />
                              +{client.servicesGrowth}
                            </Badge>
                          ) : client.servicesGrowth < -2 ? (
                            <Badge className="bg-orange-100 text-orange-800 gap-1">
                              <ArrowDownIcon className="h-3 w-3" />
                              {client.servicesGrowth}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Normal</Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-sm ${client.daysSinceLastService > 30 ? 'text-red-600 font-semibold' : client.daysSinceLastService > 14 ? 'text-orange-600' : 'text-green-600'}`}>
                            {client.daysSinceLastService} días
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {client.daysSinceLastService > 30 ? (
                            <Badge className="bg-red-100 text-red-800 gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Inactivo
                            </Badge>
                          ) : client.gmvGrowth > 15 ? (
                            <Badge className="bg-green-100 text-green-800 gap-1">
                              <Star className="h-3 w-3" />
                              Estrella
                            </Badge>
                          ) : client.completionRate < 70 ? (
                            <Badge className="bg-yellow-100 text-yellow-800 gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Atención
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800">Activo</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};