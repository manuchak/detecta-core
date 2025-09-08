
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Filter, RefreshCw, TrendingUp, Phone, UserPlus, BarChart3 } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';
import { useDailyLeadsCallsData } from '@/hooks/useDailyLeadsCallsData';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  leads: {
    label: "Leads Ingresados",
    color: "hsl(var(--primary))",
  },
  llamadas: {
    label: "Llamadas Realizadas", 
    color: "hsl(var(--chart-2))",
  },
} as const;

export function DailyLeadsCallsChart() {
  // Filter states - Power BI style
  const [dateRange, setDateRange] = useState<{from: Date; to: Date}>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [leadSource, setLeadSource] = useState<string>('all');
  const [callOutcome, setCallOutcome] = useState<string>('all');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Quick period filters
  const quickPeriods = [
    { value: '7d', label: 'Últimos 7 días', days: 7 },
    { value: '15d', label: 'Últimos 15 días', days: 15 },
    { value: '30d', label: 'Últimos 30 días', days: 30 },
    { value: 'week', label: 'Esta semana', custom: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: new Date() }) },
    { value: 'month', label: 'Este mes', custom: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
    { value: 'custom', label: 'Personalizado' }
  ];

  // Lead sources and call outcomes
  const leadSources = [
    { value: 'all', label: 'Todas las fuentes' },
    { value: 'directo', label: 'Directo' },
    { value: 'referido', label: 'Referido' },
    { value: 'social_media', label: 'Redes Sociales' },
    { value: 'website', label: 'Sitio Web' }
  ];

  const callOutcomes = [
    { value: 'all', label: 'Todos los resultados' },
    { value: 'successful', label: 'Exitosa' },
    { value: 'no_answer', label: 'No contestó' },
    { value: 'busy', label: 'Ocupado' },
    { value: 'reschedule_requested', label: 'Reagendar' }
  ];

  // Data fetching
  const filters = useMemo(() => ({
    dateRange,
    leadSource: leadSource === 'all' ? undefined : leadSource,
    callOutcome: callOutcome === 'all' ? undefined : callOutcome
  }), [dateRange, leadSource, callOutcome]);

  const { data, isLoading, refetch } = useDailyLeadsCallsData(filters);

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    
    const periodConfig = quickPeriods.find(p => p.value === period);
    if (periodConfig) {
      if (periodConfig.custom) {
        setDateRange(periodConfig.custom());
      } else if (periodConfig.days) {
        setDateRange({
          from: subDays(new Date(), periodConfig.days),
          to: new Date()
        });
      }
    }
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalLeads: 0, totalCalls: 0, avgLeadsPerDay: 0, avgCallsPerDay: 0 };
    }

    const totalLeads = data.reduce((sum, item) => sum + item.leads, 0);
    const totalCalls = data.reduce((sum, item) => sum + item.llamadas, 0);
    
    return {
      totalLeads,
      totalCalls,
      avgLeadsPerDay: Math.round(totalLeads / data.length * 10) / 10,
      avgCallsPerDay: Math.round(totalCalls / data.length * 10) / 10
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Power BI Style Filter Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-base">Filtros</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Period Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Período</label>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quickPeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {selectedPeriod === 'custom' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Rango de Fechas</label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yy", { locale: es })} -{" "}
                            {format(dateRange.to, "dd/MM/yy", { locale: es })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yy", { locale: es })
                        )
                      ) : (
                        "Seleccionar fechas"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setDateRange({ from: range.from, to: range.to });
                          setIsCalendarOpen(false);
                        }
                      }}
                      numberOfMonths={2}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Lead Source Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Fuente de Leads</label>
              <Select value={leadSource} onValueChange={setLeadSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leadSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Call Outcome Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Resultado de Llamadas</label>
              <Select value={callOutcome} onValueChange={setCallOutcome}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {callOutcomes.map((outcome) => (
                    <SelectItem key={outcome.value} value={outcome.value}>
                      {outcome.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-xs text-muted-foreground">Filtros activos:</span>
            <Badge variant="secondary" className="gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(dateRange.from, "dd/MM", { locale: es })} - {format(dateRange.to, "dd/MM", { locale: es })}
            </Badge>
            {leadSource !== 'all' && (
              <Badge variant="outline" className="gap-1">
                <UserPlus className="h-3 w-3" />
                {leadSources.find(s => s.value === leadSource)?.label}
              </Badge>
            )}
            {callOutcome !== 'all' && (
              <Badge variant="outline" className="gap-1">
                <Phone className="h-3 w-3" />
                {callOutcomes.find(o => o.value === callOutcome)?.label}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{summaryMetrics.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Llamadas</p>
                <p className="text-2xl font-bold">{summaryMetrics.totalCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Promedio Leads/día</p>
                <p className="text-2xl font-bold">{summaryMetrics.avgLeadsPerDay}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Promedio Llamadas/día</p>
                <p className="text-2xl font-bold">{summaryMetrics.avgCallsPerDay}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Evolución Diaria - Leads y Llamadas
          </CardTitle>
          <CardDescription>
            Comparativa diaria de leads ingresados vs llamadas realizadas • {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="fecha" 
                  className="text-sm fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis className="text-sm fill-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{`Fecha: ${label}`}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {`${entry.name}: ${entry.value}`}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                />
                <Bar 
                  dataKey="leads" 
                  name={chartConfig.leads.label}
                  fill={chartConfig.leads.color}
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="llamadas" 
                  name={chartConfig.llamadas.label}
                  fill={chartConfig.llamadas.color}
                  radius={[2, 2, 0, 0]}
                />
                <ReferenceLine y={summaryMetrics.avgLeadsPerDay} stroke="#8884d8" strokeDasharray="5 5" label="Promedio Leads" />
                <ReferenceLine y={summaryMetrics.avgCallsPerDay} stroke="#82ca9d" strokeDasharray="5 5" label="Promedio Llamadas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
