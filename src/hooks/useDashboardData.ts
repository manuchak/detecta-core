
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Type definitions
export interface DashboardMetrics {
  totalServices: number;
  completedServices: number;
  ongoingServices: number;
  cancelledServices: number;
  totalGMV: number;
  averageServiceValue: number;
  activeClients: number;
  yearlyGrowth: number;
}

export interface ServiceStatusData {
  name: string;
  value: number;
}

export interface MonthlyGmvData {
  name: string;
  value: number;
  previousYear: number;
  month: number;
}

export interface ServiceTypesData {
  name: string;
  value: number;
}

export interface DailyServiceData {
  day: string;
  count: number;
}

export interface TopClientsData {
  name: string;
  value: number;
}

export type TimeframeOption = "day" | "week" | "month" | "quarter" | "year";
export type ServiceTypeOption = "all" | "local" | "foraneo";

export const useDashboardData = (
  timeframe: TimeframeOption = "month", 
  serviceTypeFilter: ServiceTypeOption = "all"
) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardMetrics>({
    totalServices: 0,
    completedServices: 0,
    ongoingServices: 0,
    cancelledServices: 0,
    totalGMV: 0,
    averageServiceValue: 0,
    activeClients: 0,
    yearlyGrowth: 0
  });
  
  const [monthlyGmvData, setMonthlyGmvData] = useState<MonthlyGmvData[]>([]);
  const [serviceStatusData, setServiceStatusData] = useState<ServiceStatusData[]>([]);
  const [serviceTypesData, setServiceTypesData] = useState<ServiceTypesData[]>([]);
  const [dailyServiceData, setDailyServiceData] = useState<DailyServiceData[]>([]);
  const [topClientsData, setTopClientsData] = useState<TopClientsData[]>([]);

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
      
      // Fetch all records and aggregate them manually
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
      
      // Fetch all records and aggregate them manually
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

  // Function to refresh all data
  const refreshAllData = () => {
    fetchDashboardData();
    fetchMonthlyGmvData();
    fetchServiceStatusData();
    fetchServiceTypesData();
    fetchDailyServiceData();
    fetchTopClientsData();
  };

  // Load all data when component mounts or filters change
  useEffect(() => {
    refreshAllData();
  }, [timeframe, serviceTypeFilter]);

  return {
    isLoading,
    dashboardData,
    monthlyGmvData,
    serviceStatusData,
    serviceTypesData,
    dailyServiceData,
    topClientsData,
    refreshAllData
  };
};
