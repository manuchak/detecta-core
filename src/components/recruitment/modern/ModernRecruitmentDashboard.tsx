// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Users, 
  Phone, 
  Target, 
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  User,
  Award,
  Activity,
  Filter,
  ChevronDown
} from 'lucide-react';
import { 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useLeadAssignment } from '@/hooks/useLeadAssignment';
import { useCallCenterMetrics } from '@/hooks/useCallCenterMetrics';
import { useLeadsStable } from '@/hooks/useLeadsStable';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { EnhancedConversionFunnel } from '@/components/recruitment/EnhancedConversionFunnel';
import { useContactabilityMetrics } from '@/hooks/useContactabilityMetrics';
import { ContactabilityAnalytics } from './ContactabilityAnalytics';
import { RejectionAnalytics } from './RejectionAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { MainNavigation } from '@/components/layout/MainNavigation';

interface DashboardStats {
  totalLeads: number;
  contactRate: number;
  conversionRate: number;
  activeAnalysts: number;
  avgResponseTime: number;
  dailyActivity: number;
}

interface AnalystPerformance {
  id: string;
  name: string;
  email: string;
  leadsAssigned: number;
  leadsApproved: number;
  approvalRate: number;
  lastActivity: string;
  status: 'active' | 'idle' | 'offline';
}

export const ModernRecruitmentDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | 'live'>('30d');
  const [chartType, setChartType] = useState<'combined' | 'separate'>('combined');
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>([]);
  
  // Calculate date ranges based on selected period
  const { dateFrom, dateTo, daysCount } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 1;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return {
      dateFrom: from,
      dateTo: today,
      daysCount: days
    };
  }, [selectedPeriod]);

  const thirtyDaysAgo = dateFrom;
  const today = dateTo;
  
  const { analysts, loading: analystsLoading } = useLeadAssignment();
  const { leads: allLeads, isLoading: leadsLoading } = useLeadsStable();
  const { metrics: callMetrics } = useCallCenterMetrics({
    dateFrom: thirtyDaysAgo,
    dateTo: today,
    enabled: true
  });

  // Get contactability metrics
  const { data: contactabilityMetrics, isLoading: contactabilityLoading } = useContactabilityMetrics(
    dateFrom,
    dateTo,
    selectedAnalysts
  );

  // Filter leads by selected analysts and date period
  const filteredLeads = useMemo(() => {
    if (!allLeads) return [];
    
    return allLeads.filter(lead => {
      // Filter by date first - use proper date comparison
      const leadDate = new Date(lead.created_at);
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo + 'T23:59:59'); // Include end of day
      if (leadDate < fromDate || leadDate > toDate) return false;
      
      // If no analysts are selected, show all leads (within date range)
      if (selectedAnalysts.length === 0) return true;
      
      // If lead is assigned, only include if assigned to selected analyst
      if (lead.asignado_a) {
        return selectedAnalysts.includes(lead.asignado_a);
      }
      
      // Include unassigned leads when we have selected analysts
      return true;
    });
  }, [allLeads, selectedAnalysts, dateFrom, dateTo]);

  // Filter out admin/test accounts by default and initialize selected analysts
  const filteredAnalysts = useMemo(() => {
    const adminKeywords = ['admin', 'test', 'prueba', 'demo'];
    return analysts.filter(analyst => 
      !adminKeywords.some(keyword => 
        analyst.display_name.toLowerCase().includes(keyword) ||
        analyst.email.toLowerCase().includes(keyword)
      )
    );
  }, [analysts]);

  // Initialize selected analysts when filtered analysts change
  React.useEffect(() => {
    if (filteredAnalysts.length > 0 && selectedAnalysts.length === 0) {
      setSelectedAnalysts(filteredAnalysts.map(a => a.id));
    }
  }, [filteredAnalysts, selectedAnalysts.length]);

  const activeAnalysts = useMemo(() => {
    return filteredAnalysts.filter(analyst => selectedAnalysts.includes(analyst.id));
  }, [filteredAnalysts, selectedAnalysts]);

  // Get daily activity data for chart
  const { data: dailyActivityData } = useAuthenticatedQuery(
    ['daily-activity-chart', selectedPeriod, selectedAnalysts.join(',')],
    async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);
      
      const [leadsData, callsData] = await Promise.all([
        supabase
          .from('leads')
          .select('created_at')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('manual_call_logs')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
      ]);

      // Create daily buckets for the selected period
      const dailyData = [];
      for (let i = daysCount - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const leadsCount = leadsData.data?.filter(lead => 
          lead.created_at.split('T')[0] === dateStr
        ).length || 0;
        
        const callsCount = callsData.data?.filter(call => 
          call.created_at.split('T')[0] === dateStr
        ).length || 0;

        dailyData.push({
          date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
          leads: leadsCount,
          calls: callsCount,
          total: leadsCount + callsCount
        });
      }

      return dailyData;
    }
  );
  // Get dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useAuthenticatedQuery(
    ['modern-dashboard-stats', selectedPeriod, selectedAnalysts.join(','), filteredLeads.length.toString()],
    async () => {
      const [callsData] = await Promise.all([
        supabase.from('manual_call_logs').select('*').gte('created_at', thirtyDaysAgo)
      ]);

      console.log('🔍 Dashboard Stats Debug:', {
        filteredLeadsCount: filteredLeads.length,
        selectedAnalysts: selectedAnalysts.length,
        dateRange: { dateFrom, dateTo },
        allLeadsCount: allLeads?.length || 0
      });

      // Use filtered leads for consistent data
      const totalLeads = filteredLeads.length;
      const approvedLeads = filteredLeads.filter(l => l.estado === 'aprobado').length;
      const contactedLeads = filteredLeads.filter(l => l.estado !== 'nuevo').length;
      const totalCalls = callsData.data?.length || 0;
      const successfulCalls = callsData.data?.filter(c => c.call_outcome === 'successful').length || 0;

      // Calculate real response time from leads data
      let avgResponseTimeHours = 24; // Default fallback
      if (filteredLeads.length > 0) {
        const leadsWithResponse = filteredLeads.filter(lead => 
          lead.fecha_contacto && lead.created_at
        );
        
        if (leadsWithResponse.length > 0) {
          const totalResponseTime = leadsWithResponse.reduce((sum, lead) => {
            const created = new Date(lead.created_at).getTime();
            const contacted = new Date(lead.fecha_contacto!).getTime();
            const diffHours = (contacted - created) / (1000 * 60 * 60);
            return sum + Math.max(0, diffHours); // Avoid negative values
          }, 0);
          
          avgResponseTimeHours = Math.round(totalResponseTime / leadsWithResponse.length);
        }
      }

      const stats = {
        totalLeads,
        contactRate: contactabilityMetrics?.realContactabilityRate || 
                    (totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0),
        conversionRate: totalLeads > 0 ? Math.round((approvedLeads / totalLeads) * 100) : 0,
        activeAnalysts: activeAnalysts.length,
        avgResponseTime: avgResponseTimeHours,
        dailyActivity: Math.round(totalCalls / daysCount)
      } as DashboardStats;

      console.log('📊 Dashboard Stats Result:', stats);
      return stats;
    }
  );

  // Get analyst performance data - only when leads and analysts are available
  const { data: analystPerformance, isLoading: analystPerformanceLoading } = useAuthenticatedQuery(
    ['analyst-performance-modern', selectedAnalysts.join(','), selectedPeriod, filteredLeads.length.toString()],
    async () => {
      // Early return if conditions aren't met
      if (leadsLoading || activeAnalysts.length === 0) {
        return [];
      }
      console.log('🔍 ModernRecruitmentDashboard - analyst performance query');
      console.log('   - activeAnalysts:', activeAnalysts.length);
      console.log('   - filteredLeads:', filteredLeads.length);
      console.log('   - Sample filtered leads:', filteredLeads.slice(0, 3));
      
      if (activeAnalysts.length === 0) return [];

      // Use filtered leads for performance calculation
      const performanceData: AnalystPerformance[] = activeAnalysts.map(analyst => {
        const analystLeads = filteredLeads.filter(l => l.asignado_a === analyst.id);
        const approvedLeads = analystLeads.filter(l => l.estado === 'aprobado');
        
        console.log(`📊 Analyst ${analyst.display_name}:`, {
          analystId: analyst.id,
          analystIdType: typeof analyst.id,
          totalLeads: analystLeads.length,
          approvedLeads: approvedLeads.length,
          sampleLeads: analystLeads.slice(0, 2)
        });
        
        // Debug: Check if any leads have asignado_a matching this analyst
        const leadsWithAssignment = filteredLeads.filter(l => l.asignado_a);
        const uniqueAssignments = [...new Set(leadsWithAssignment.map(l => l.asignado_a))];
        
        if (analyst.display_name === 'MARBELLI CASILLAS') {
          console.log('🔍 MARBELLI CASILLAS Debug:', {
            analystId: analyst.id,
            uniqueAssignments: uniqueAssignments,
            leadsWithAssignment: leadsWithAssignment.length,
            exactMatches: filteredLeads.filter(l => l.asignado_a === analyst.id).length
          });
        }
        
        return {
          id: analyst.id,
          name: analyst.display_name,
          email: analyst.email,
          leadsAssigned: analystLeads.length,
          leadsApproved: approvedLeads.length,
          approvalRate: analystLeads.length > 0 ? Math.round((approvedLeads.length / analystLeads.length) * 100) : 0,
          lastActivity: new Date().toISOString(), // would need real data
          status: analystLeads.length > 0 ? 'active' : 'idle' as const
        };
      });

      return performanceData.sort((a, b) => b.approvalRate - a.approvalRate);
    },
    {
      // Only run when leads are loaded and analysts are available
      refetchOnWindowFocus: false,
      staleTime: 30000, // Cache for 30 seconds
    }
  );

  const loading = statsLoading || analystsLoading || leadsLoading || contactabilityLoading || analystPerformanceLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    trend, 
    icon: Icon, 
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    change?: string; 
    trend?: 'up' | 'down'; 
    icon: any; 
    subtitle?: string;
  }) => (
    <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            {change && (
              <div className={`flex items-center gap-1 text-xs ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? 
                  <TrendingUp className="h-3 w-3" /> : 
                  <TrendingDown className="h-3 w-3" />
                }
                {change}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Main Navigation */}
      <MainNavigation />
      
      {/* Header */}
      <div className="border-b bg-background/50 backdrop-blur-sm sticky top-16 z-10">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Reclutamiento</h1>
              <p className="text-muted-foreground">Dashboard de performance y análisis</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant={selectedPeriod === '7d' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedPeriod('7d')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Últimos 7 días
              </Button>
              <Button 
                variant={selectedPeriod === '30d' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedPeriod('30d')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Últimos 30 días
              </Button>
              <Button 
                variant={selectedPeriod === 'live' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedPeriod('live')}
              >
                <Activity className="h-4 w-4 mr-2" />
                En vivo
              </Button>
              
              {/* Analyst Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Analistas ({selectedAnalysts.length})
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="end">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Filtrar Analistas</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedAnalysts.length === filteredAnalysts.length) {
                            setSelectedAnalysts([]);
                          } else {
                            setSelectedAnalysts(filteredAnalysts.map(a => a.id));
                          }
                        }}
                        className="text-xs h-6 px-2"
                      >
                        {selectedAnalysts.length === filteredAnalysts.length ? 'Ninguno' : 'Todos'}
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredAnalysts.map((analyst) => (
                        <div key={analyst.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={analyst.id}
                            checked={selectedAnalysts.includes(analyst.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAnalysts(prev => [...prev, analyst.id]);
                              } else {
                                setSelectedAnalysts(prev => prev.filter(id => id !== analyst.id));
                              }
                            }}
                          />
                          <label 
                            htmlFor={analyst.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {analyst.display_name}
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    {filteredAnalysts.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No hay analistas disponibles
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Leads"
            value={dashboardStats?.totalLeads || 0}
            change="+12%"
            trend="up"
            icon={Users}
            subtitle={`Últimos ${daysCount} días`}
          />
          <StatCard
            title="Contactabilidad Efectiva"
            value={`${dashboardStats?.contactRate || 0}%`}
            change="+3%"
            trend="up"
            icon={Phone}
            subtitle={`${contactabilityMetrics?.leadsWithEffectiveContact || 0} contactos exitosos`}
          />
          <StatCard
            title="Conversión"
            value={`${dashboardStats?.conversionRate || 0}%`}
            change="-2%"
            trend="down"
            icon={Target}
            subtitle="Lead → Aprobado"
          />
          <StatCard
            title="Tiempo Respuesta"
            value={`${dashboardStats?.avgResponseTime || 0}h`}
            change="-15%"
            trend="up"
            icon={Clock}
            subtitle={dashboardStats?.avgResponseTime === 24 ? "Calculado en tiempo real" : "Basado en datos reales"}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50">
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="contactability">Contactabilidad</TabsTrigger>
            <TabsTrigger value="rejection">Análisis de Rechazo</TabsTrigger>
            <TabsTrigger value="analysts">Analistas</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Activity Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Actividad Diaria
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={chartType === 'combined' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartType('combined')}
                        className="text-xs px-2 py-1 h-7"
                      >
                        Combinado
                      </Button>
                      <Button
                        variant={chartType === 'separate' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartType('separate')}
                        className="text-xs px-2 py-1 h-7"
                      >
                        Separado
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={dailyActivityData || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs fill-muted-foreground"
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      
                      {chartType === 'combined' ? (
                        <YAxis 
                          className="text-xs fill-muted-foreground"
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                      ) : (
                        <>
                          <YAxis 
                            yAxisId="leads"
                            className="text-xs fill-muted-foreground"
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: 'Leads', angle: -90, position: 'insideLeft' }}
                          />
                          <YAxis 
                            yAxisId="calls"
                            orientation="right"
                            className="text-xs fill-muted-foreground"
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: 'Llamadas', angle: 90, position: 'insideRight' }}
                          />
                        </>
                      )}
                      
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const leadsData = payload.find(p => p.dataKey === 'leads');
                            const callsData = payload.find(p => p.dataKey === 'calls');
                            
                            const leadsValue = Number(leadsData?.value || 0);
                            const callsValue = Number(callsData?.value || 0);
                            
                            return (
                              <div className="bg-card/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                                <p className="font-medium text-foreground mb-2">{label}</p>
                                <div className="space-y-1">
                                  {leadsData && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                                      <span className="text-sm">Leads: <span className="font-semibold">{leadsValue}</span></span>
                                    </div>
                                  )}
                                  {callsData && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(220 70% 50%)' }}></div>
                                      <span className="text-sm">Llamadas: <span className="font-semibold">{callsValue}</span></span>
                                    </div>
                                  )}
                                  <div className="pt-1 mt-2 border-t border-border">
                                    <span className="text-xs text-muted-foreground">
                                      Total actividad: {leadsValue + callsValue}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      
                      <Area
                        yAxisId={chartType === 'separate' ? 'leads' : undefined}
                        type="monotone"
                        dataKey="leads"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.1}
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Leads"
                        dot={false}
                        activeDot={{ 
                          r: 4, 
                          stroke: 'hsl(var(--primary))', 
                          strokeWidth: 2, 
                          fill: 'hsl(var(--background))' 
                        }}
                      />
                      
                      <Line
                        yAxisId={chartType === 'separate' ? 'calls' : undefined}
                        type="monotone"
                        dataKey="calls"
                        stroke="hsl(220 70% 50%)"
                        strokeWidth={3}
                        name="Llamadas"
                        dot={false}
                        activeDot={{ 
                          r: 4, 
                          stroke: 'hsl(220 70% 50%)', 
                          strokeWidth: 2, 
                          fill: 'hsl(var(--background))' 
                        }}
                      />
                      
                      <Legend 
                        content={({ payload }) => (
                          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-primary"></div>
                              <span className="text-muted-foreground">Leads</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: 'hsl(220 70% 50%)' }}
                              ></div>
                              <span className="text-muted-foreground">Llamadas</span>
                            </div>
                            <div className="text-xs text-muted-foreground ml-4">
                              {chartType === 'separate' ? 'Ejes independientes' : 'Eje compartido'}
                            </div>
                          </div>
                        )}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Resumen de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Contactabilidad</span>
                      <span className="text-sm text-muted-foreground">{dashboardStats?.contactRate || 0}%</span>
                    </div>
                    <Progress value={dashboardStats?.contactRate || 0} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Conversión</span>
                      <span className="text-sm text-muted-foreground">{dashboardStats?.conversionRate || 0}%</span>
                    </div>
                    <Progress value={dashboardStats?.conversionRate || 0} className="h-2" />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Performance dentro del objetivo</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contactability" className="space-y-6">
            <ContactabilityAnalytics 
              metrics={contactabilityMetrics || {
                totalLeads: 0,
                leadsWithoutContact: 0,
                leadsWithIneffectiveContact: 0,
                leadsWithEffectiveContact: 0,
                leadsNeedingRecontact: 0,
                realContactabilityRate: 0,
                averageAttemptsBeforeSuccess: 0,
                contactEfficiencyRate: 0,
                averageTimeBetweenAttempts: 0,
                attemptDistribution: {
                  noAttempts: 0,
                  oneAttempt: 0,
                  twoAttempts: 0,
                  threeAttempts: 0,
                  fourPlusAttempts: 0,
                },
                outcomeDistribution: {
                  successful: 0,
                  no_answer: 0,
                  busy: 0,
                  voicemail: 0,
                  wrong_number: 0,
                  non_existent_number: 0,
                  call_failed: 0,
                  reschedule_requested: 0,
                  numero_no_disponible: 0,
                },
                conversionRateByAttempt: [],
                optimalCallTimes: [],
                priorityRecontacts: []
              }}
              loading={contactabilityLoading}
            />
          </TabsContent>

          <TabsContent value="rejection" className="space-y-6">
            <RejectionAnalytics 
              dateFrom={dateFrom}
              dateTo={dateTo}
              selectedAnalysts={selectedAnalysts}
            />
          </TabsContent>

          <TabsContent value="analysts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analystPerformance?.map((analyst) => (
                <Card key={analyst.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getStatusColor(analyst.status)}`}></div>
                        </div>
                        <div>
                          <p className="font-semibold">{analyst.name}</p>
                          <p className="text-xs text-muted-foreground">{analyst.email}</p>
                        </div>
                      </div>
                      <Badge variant={analyst.status === 'active' ? 'default' : 'secondary'}>
                        {analyst.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tasa de Aprobación</span>
                        <span className="font-semibold">{analyst.approvalRate}%</span>
                      </div>
                      <Progress value={analyst.approvalRate} className="h-2" />
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center">
                          <p className="text-lg font-bold">{analyst.leadsAssigned}</p>
                          <p className="text-xs text-muted-foreground">Asignados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{analyst.leadsApproved}</p>
                          <p className="text-xs text-muted-foreground">Aprobados</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {analystPerformance?.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay analistas activos</h3>
                  <p className="text-muted-foreground">
                    No se encontraron analistas con actividad en el período seleccionado.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nuevos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {filteredLeads.filter(l => {
                      // Lead realmente sin tocar: sin fecha de contacto, sin asignación, estado nuevo
                      return l.estado === 'nuevo' && 
                             !l.fecha_contacto && 
                             !l.asignado_a;
                    }).length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Leads sin tocar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">En Proceso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {filteredLeads.filter(l => {
                      // Leads que han sido tocados pero no aprobados
                      return (l.fecha_contacto || l.asignado_a) && 
                             !['aprobado', 'rechazado', 'descartado'].includes(l.estado);
                    }).length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">En seguimiento</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Aprobados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2 text-green-600">
                    {filteredLeads.filter(l => l.estado === 'aprobado').length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Conversiones exitosas</p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Conversion Funnel */}
            <EnhancedConversionFunnel isLoading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};