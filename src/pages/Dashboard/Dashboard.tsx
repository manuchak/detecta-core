
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Calendar, Map, MessageSquare, ArrowUp, ArrowDown, ChartBar, CircleDollarSign, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const Dashboard = () => {
  const [timeframe, setTimeframe] = useState("month");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalServices: 0,
    completedServices: 0,
    ongoingServices: 0,
    cancelledServices: 0,
    totalGMV: 0,
    averageServiceValue: 0,
    activeClients: 0,
    yearlyGrowth: 0
  });
  
  const [monthlyGmvData, setMonthlyGmvData] = useState<any[]>([]);
  const [serviceStatusData, setServiceStatusData] = useState<any[]>([]);
  const [serviceTypesData, setServiceTypesData] = useState<any[]>([]);
  const [dailyServiceData, setDailyServiceData] = useState<any[]>([]);
  const [topClientsData, setTopClientsData] = useState<any[]>([]);

  // Function to calculate date ranges based on selected timeframe
  const getDateRanges = () => {
    const now = new Date();
    const startOfCurrentYear = new Date(now.getFullYear(), 0, 1);
    
    let startDate, endDate;
    
    switch(timeframe) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = startOfCurrentYear;
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    return { startDate, endDate, startOfCurrentYear };
  };

  // Fetch main dashboard metrics from Supabase
  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    try {
      const { startDate, endDate, startOfCurrentYear } = getDateRanges();

      // Apply service type filter condition
      let serviceTypeCondition = {};
      if (serviceTypeFilter !== 'all') {
        serviceTypeCondition = {
          [serviceTypeFilter === 'local' ? 'local_foraneo' : 'tipo_servicio']: serviceTypeFilter
        };
      }

      // Fetch total services count
      const { count: totalCount, error: countError } = await supabase
        .from('servicios_custodia')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_hora_cita', startDate.toISOString())
        .lte('fecha_hora_cita', endDate.toISOString())
        .match(serviceTypeCondition);

      if (countError) throw countError;

      // Fetch services with completed status
      const { count: completedCount, error: completedError } = await supabase
        .from('servicios_custodia')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Completado')
        .gte('fecha_hora_cita', startDate.toISOString())
        .lte('fecha_hora_cita', endDate.toISOString())
        .match(serviceTypeCondition);

      if (completedError) throw completedError;

      // Fetch services with ongoing status
      const { count: ongoingCount, error: ongoingError } = await supabase
        .from('servicios_custodia')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'En Proceso')
        .gte('fecha_hora_cita', startDate.toISOString())
        .lte('fecha_hora_cita', endDate.toISOString())
        .match(serviceTypeCondition);

      if (ongoingError) throw ongoingError;

      // Fetch services with cancelled status
      const { count: cancelledCount, error: cancelledError } = await supabase
        .from('servicios_custodia')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Cancelado')
        .gte('fecha_hora_cita', startDate.toISOString())
        .lte('fecha_hora_cita', endDate.toISOString())
        .match(serviceTypeCondition);

      if (cancelledError) throw cancelledError;
      
      // Calculate GMV and average service value
      const { data: gmvData, error: gmvError } = await supabase
        .from('servicios_custodia')
        .select('cobro_cliente')
        .gte('fecha_hora_cita', startDate.toISOString())
        .lte('fecha_hora_cita', endDate.toISOString())
        .not('cobro_cliente', 'is', null)
        .match(serviceTypeCondition);
        
      if (gmvError) throw gmvError;
        
      const totalGMV = gmvData.reduce((sum, service) => sum + (parseFloat(service.cobro_cliente.toString()) || 0), 0);
      const averageServiceValue = gmvData.length > 0 ? totalGMV / gmvData.length : 0;
      
      // Fetch unique active clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('servicios_custodia')
        .select('nombre_cliente')
        .gte('fecha_hora_cita', startDate.toISOString())
        .lte('fecha_hora_cita', endDate.toISOString())
        .not('nombre_cliente', 'is', null)
        .match(serviceTypeCondition);
        
      if (clientsError) throw clientsError;
      
      const uniqueClients = new Set(clientsData.map(client => client.nombre_cliente));
      
      // Calculate year-over-year growth
      const previousYearStart = new Date(startDate);
      previousYearStart.setFullYear(previousYearStart.getFullYear() - 1);
      const previousYearEnd = new Date(endDate);
      previousYearEnd.setFullYear(previousYearEnd.getFullYear() - 1);
      
      const { count: previousYearCount, error: prevYearError } = await supabase
        .from('servicios_custodia')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_hora_cita', previousYearStart.toISOString())
        .lte('fecha_hora_cita', previousYearEnd.toISOString())
        .match(serviceTypeCondition);
        
      if (prevYearError) throw prevYearError;
      
      const yearlyGrowth = previousYearCount > 0 ? ((totalCount - previousYearCount) / previousYearCount) * 100 : 0;
      
      setDashboardData({
        totalServices: totalCount || 0,
        completedServices: completedCount || 0,
        ongoingServices: ongoingCount || 0,
        cancelledServices: cancelledCount || 0,
        totalGMV,
        averageServiceValue,
        activeClients: uniqueClients.size,
        yearlyGrowth: parseFloat(yearlyGrowth.toFixed(1))
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch monthly GMV data for chart
  const fetchMonthlyGmvData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      
      // Get months in Spanish
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      // Prepare data structure
      let monthlySummary = monthNames.map((name, index) => ({
        name,
        value: 0,
        previousYear: 0,
        month: index
      }));
      
      // Fetch current year data
      const { data: currentYearData, error: currentYearError } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita, cobro_cliente')
        .gte('fecha_hora_cita', `${currentYear}-01-01`)
        .lte('fecha_hora_cita', `${currentYear}-12-31`)
        .not('cobro_cliente', 'is', null);
        
      if (currentYearError) throw currentYearError;
      
      // Aggregate current year data
      currentYearData.forEach(service => {
        if (service.fecha_hora_cita && service.cobro_cliente) {
          const serviceDate = new Date(service.fecha_hora_cita);
          const month = serviceDate.getMonth();
          monthlySummary[month].value += parseFloat(service.cobro_cliente.toString()) || 0;
        }
      });
      
      // Fetch previous year data
      const { data: previousYearData, error: previousYearError } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita, cobro_cliente')
        .gte('fecha_hora_cita', `${previousYear}-01-01`)
        .lte('fecha_hora_cita', `${previousYear}-12-31`)
        .not('cobro_cliente', 'is', null);
        
      if (previousYearError) throw previousYearError;
      
      // Aggregate previous year data
      previousYearData.forEach(service => {
        if (service.fecha_hora_cita && service.cobro_cliente) {
          const serviceDate = new Date(service.fecha_hora_cita);
          const month = serviceDate.getMonth();
          monthlySummary[month].previousYear += parseFloat(service.cobro_cliente.toString()) || 0;
        }
      });
      
      setMonthlyGmvData(monthlySummary);
      
    } catch (error) {
      console.error('Error fetching monthly GMV data:', error);
    }
  };

  // Fetch service status data for chart
  const fetchServiceStatusData = async () => {
    try {
      const { startDate, endDate } = getDateRanges();
      
      // Instead of using groupBy, we'll fetch all records and aggregate them manually
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('estado')
        .gte('fecha_hora_cita', startDate.toISOString())
        .lte('fecha_hora_cita', endDate.toISOString())
        .not('estado', 'is', null);
        
      if (error) throw error;
      
      // Calculate counts manually
      const statusCounts: Record<string, number> = {
        'En Proceso': 0,
        'Completados': 0,
        'Cancelados': 0,
        'Retrasados': 0
      };
      
      // Count records by status
      data.forEach(item => {
        if (item.estado === 'En Proceso') {
          statusCounts['En Proceso']++;
        } else if (item.estado === 'Completado') {
          statusCounts['Completados']++;
        } else if (item.estado === 'Cancelado') {
          statusCounts['Cancelados']++;
        } else if (item.estado === 'Retrasado') {
          statusCounts['Retrasados']++;
        }
      });
      
      // Calculate total for percentage
      let total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
      
      // Convert to percentage
      const chartData = Object.entries(statusCounts).map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0
      }));
      
      setServiceStatusData(chartData);
      
    } catch (error) {
      console.error('Error fetching service status data:', error);
    }
  };

  // Fetch service types data for chart
  const fetchServiceTypesData = async () => {
    try {
      const { startDate, endDate } = getDateRanges();
      
      // Instead of using groupBy, we'll fetch all records and aggregate them manually
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('local_foraneo')
        .gte('fecha_hora_cita', startDate.toISOString())
        .lte('fecha_hora_cita', endDate.toISOString())
        .not('local_foraneo', 'is', null);
        
      if (error) throw error;
      
      // Count by local_foraneo
      const typeCounts: Record<string, number> = {};
      
      data.forEach(item => {
        const type = item.local_foraneo || 'No Especificado';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      // Calculate total for percentage
      const total = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
      
      // Convert to chart data with percentages
      const chartData = Object.entries(typeCounts).map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0
      }));
      
      setServiceTypesData(chartData);
      
    } catch (error) {
      console.error('Error fetching service types data:', error);
    }
  };

  // Fetch daily service data for chart
  const fetchDailyServiceData = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(now);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      // Prepare days data structure
      const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const dailyCounts = days.map(day => ({ day, count: 0 }));
      
      // Fetch services within current week
      const { data: weekData, error: weekError } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita')
        .gte('fecha_hora_cita', startOfWeek.toISOString())
        .lte('fecha_hora_cita', endOfWeek.toISOString());
        
      if (weekError) throw weekError;
      
      // Aggregate by day of week
      weekData.forEach(service => {
        if (service.fecha_hora_cita) {
          const serviceDate = new Date(service.fecha_hora_cita);
          const dayIndex = (serviceDate.getDay() + 6) % 7; // Adjust for Monday-based week (0 = Monday)
          dailyCounts[dayIndex].count += 1;
        }
      });
      
      setDailyServiceData(dailyCounts);
      
    } catch (error) {
      console.error('Error fetching daily service data:', error);
    }
  };

  // Fetch top clients data for chart
  const fetchTopClientsData = async () => {
    try {
      const { startDate, endDate } = getDateRanges();
      
      // Use a SQL query to group and count by client
      const { data: clientsData, error: clientsError } = await supabase
        .from('servicios_custodia')
        .select('nombre_cliente')
        .gte('fecha_hora_cita', startDate.toISOString())
        .lte('fecha_hora_cita', endDate.toISOString())
        .not('nombre_cliente', 'is', null);
        
      if (clientsError) throw clientsError;

      // Count clients manually
      const clientCounts: Record<string, number> = {};
      clientsData.forEach(item => {
        if (!clientCounts[item.nombre_cliente]) {
          clientCounts[item.nombre_cliente] = 0;
        }
        clientCounts[item.nombre_cliente] += 1;
      });

      // Convert to array and sort
      const sortedClients = Object.entries(clientCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Calculate total for percentage
      const totalServices = clientsData.length;
      
      // Map to chart data structure with percentages
      const topClients = sortedClients.map(client => ({
        name: client.name,
        value: totalServices > 0 ? Math.round((client.count / totalServices) * 100) : 0
      }));
      
      // Add "Otros" category if needed
      const topClientsSum = topClients.reduce((sum, client) => sum + client.value, 0);
      if (topClientsSum < 100) {
        topClients.push({
          name: "Otros",
          value: 100 - topClientsSum
        });
      }
      
      setTopClientsData(topClients);
      
    } catch (error) {
      console.error('Error fetching top clients data:', error);
    }
  };

  // Load all data when component mounts or filters change
  useEffect(() => {
    fetchDashboardData();
    fetchMonthlyGmvData();
    fetchServiceStatusData();
    fetchServiceTypesData();
    fetchDailyServiceData();
    fetchTopClientsData();
  }, [timeframe, serviceTypeFilter]);

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-0 animate-fade-in">
      <div className="py-6">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Rendimiento de Servicios
        </p>
      </div>
      
      {/* Timeframe and service type filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2 items-center">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 items-center">
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los servicios</SelectItem>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="foraneo">Foráneo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => {
            fetchDashboardData();
            fetchMonthlyGmvData();
            fetchServiceStatusData();
            fetchServiceTypesData();
            fetchDailyServiceData();
            fetchTopClientsData();
          }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Key metrics cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Servicios</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{isLoading ? '...' : dashboardData.totalServices}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {dashboardData.yearlyGrowth >= 0 ? (
                <>
                  <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">{dashboardData.yearlyGrowth}%</span>
                </>
              ) : (
                <>
                  <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
                  <span className="text-red-500">{Math.abs(dashboardData.yearlyGrowth)}%</span>
                </>
              )}
              {' desde el mes anterior'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">GMV Total</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{isLoading ? '...' : formatCurrency(dashboardData.totalGMV)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">21%</span> desde el mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{isLoading ? '...' : dashboardData.activeClients}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">3.3%</span> desde el mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{isLoading ? '...' : formatCurrency(dashboardData.averageServiceValue)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">5%</span> desde el mes anterior
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 card-apple">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Rendimiento de GMV</CardTitle>
            <CardDescription>Comparación mensual con año anterior</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyGmvData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => value >= 1000 ? `$${value/1000}K` : `$${value}`} 
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'GMV']}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  name="2025"
                  strokeWidth={2} 
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="previousYear" 
                  stroke="#94a3b8" 
                  name="2024"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 card-apple">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Estado de Servicios</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <Tabs defaultValue="chart">
              <TabsList className="mb-4">
                <TabsTrigger value="chart">Gráfico</TabsTrigger>
                <TabsTrigger value="numbers">Números</TabsTrigger>
              </TabsList>
              <TabsContent value="chart" className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={serviceStatusData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid horizontal strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Porcentaje" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="numbers">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-primary mr-2"></div>
                        <p className="text-sm">Completados</p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm font-medium">{dashboardData.completedServices}</p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {dashboardData.totalServices > 0 ? Math.round((dashboardData.completedServices / dashboardData.totalServices) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{width: `${dashboardData.totalServices > 0 ? (dashboardData.completedServices / dashboardData.totalServices) * 100 : 0}%`}}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                        <p className="text-sm">En proceso</p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm font-medium">{dashboardData.ongoingServices}</p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {dashboardData.totalServices > 0 ? Math.round((dashboardData.ongoingServices / dashboardData.totalServices) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{width: `${dashboardData.totalServices > 0 ? (dashboardData.ongoingServices / dashboardData.totalServices) * 100 : 0}%`}}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                        <p className="text-sm">Retrasados</p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm font-medium">12</p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {dashboardData.totalServices > 0 ? Math.round((12 / dashboardData.totalServices) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-amber-500" 
                        style={{width: `${dashboardData.totalServices > 0 ? (12 / dashboardData.totalServices) * 100 : 0}%`}}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-destructive mr-2"></div>
                        <p className="text-sm">Cancelados</p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm font-medium">{dashboardData.cancelledServices}</p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {dashboardData.totalServices > 0 ? Math.round((dashboardData.cancelledServices / dashboardData.totalServices) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-destructive" 
                        style={{width: `${dashboardData.totalServices > 0 ? (dashboardData.cancelledServices / dashboardData.totalServices) * 100 : 0}%`}}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Secondary charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="card-apple">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Servicios Diarios</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dailyServiceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Servicios" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="card-apple">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Tipos de Servicios</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={serviceTypesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid horizontal strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Porcentaje" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="card-apple">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Clientes Principales</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={topClientsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid horizontal strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Servicios" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card className="card-apple mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Meta de GMV Anual</CardTitle>
          <CardDescription>
            Progreso actual: {formatCurrency(dashboardData.totalGMV)} / {formatCurrency(1200000)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progreso</span>
              <span className="text-sm font-medium">{Math.round((dashboardData.totalGMV / 1200000) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                style={{width: `${(dashboardData.totalGMV / 1200000) * 100}%`}}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
