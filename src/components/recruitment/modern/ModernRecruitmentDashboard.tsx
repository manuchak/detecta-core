import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Activity
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
import { supabase } from '@/integrations/supabase/client';

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
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [chartType, setChartType] = useState<'combined' | 'separate'>('combined');
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  const { analysts, loading: analystsLoading } = useLeadAssignment();
  const { leads, isLoading: leadsLoading } = useLeadsStable();
  const { metrics: callMetrics } = useCallCenterMetrics({
    dateFrom: thirtyDaysAgo,
    dateTo: today,
    enabled: true
  });

  // Get daily activity data for chart
  const { data: dailyActivityData } = useAuthenticatedQuery(
    ['daily-activity-chart', selectedPeriod],
    async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
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

      // Create daily buckets for the last 30 days
      const dailyData = [];
      for (let i = 29; i >= 0; i--) {
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
  const { data: dashboardStats, isLoading: statsLoading } = useAuthenticatedQuery(
    ['modern-dashboard-stats', selectedPeriod],
    async () => {
      const [leadsData, callsData] = await Promise.all([
        supabase.from('leads').select('*').gte('created_at', thirtyDaysAgo),
        supabase.from('manual_call_logs').select('*').gte('created_at', thirtyDaysAgo)
      ]);

      const totalLeads = leadsData.data?.length || 0;
      const approvedLeads = leadsData.data?.filter(l => l.estado === 'aprobado').length || 0;
      const contactedLeads = leadsData.data?.filter(l => l.estado !== 'nuevo').length || 0;
      const totalCalls = callsData.data?.length || 0;
      const successfulCalls = callsData.data?.filter(c => c.call_outcome === 'successful').length || 0;

      return {
        totalLeads,
        contactRate: totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0,
        conversionRate: totalLeads > 0 ? Math.round((approvedLeads / totalLeads) * 100) : 0,
        activeAnalysts: analysts.length,
        avgResponseTime: 24, // hours - would need to calculate from actual data
        dailyActivity: Math.round(totalCalls / 30)
      } as DashboardStats;
    }
  );

  // Get analyst performance data
  const { data: analystPerformance } = useAuthenticatedQuery(
    ['analyst-performance-modern', analysts.length.toString()],
    async () => {
      if (analysts.length === 0) return [];

      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .not('asignado_a', 'is', null)
        .gte('created_at', thirtyDaysAgo);

      const performanceData: AnalystPerformance[] = analysts.map(analyst => {
        const analystLeads = leads?.filter(l => l.asignado_a === analyst.id) || [];
        const approvedLeads = analystLeads.filter(l => l.estado === 'aprobado');
        
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
    }
  );

  const loading = statsLoading || analystsLoading || leadsLoading;

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
      {/* Header */}
      <div className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Reclutamiento</h1>
              <p className="text-muted-foreground">Dashboard de performance y análisis</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Últimos 30 días
              </Button>
              <Button size="sm">
                <Activity className="h-4 w-4 mr-2" />
                En vivo
              </Button>
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
            subtitle="Últimos 30 días"
          />
          <StatCard
            title="Tasa de Contacto"
            value={`${dashboardStats?.contactRate || 0}%`}
            change="+3%"
            trend="up"
            icon={Phone}
            subtitle={`${callMetrics.contactosEfectivosDia}/día contactos`}
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
            subtitle="Promedio de respuesta"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="overview">Vista General</TabsTrigger>
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
                                      <div className="w-2 h-2 rounded-full bg-chart-2"></div>
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
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={3}
                        name="Llamadas"
                        dot={false}
                        activeDot={{ 
                          r: 4, 
                          stroke: 'hsl(var(--chart-2))', 
                          strokeWidth: 2, 
                          fill: 'hsl(var(--background))' 
                        }}
                      />
                      
                      <Legend 
                        content={({ payload }) => (
                          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                            {payload?.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                ></div>
                                <span className="text-muted-foreground">{entry.value}</span>
                              </div>
                            ))}
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
                    {leads?.filter(l => l.estado === 'nuevo').length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Leads sin contactar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">En Proceso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {leads?.filter(l => ['contactado', 'en_revision'].includes(l.estado)).length || 0}
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
                    {leads?.filter(l => l.estado === 'aprobado').length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Conversiones exitosas</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Embudo de Conversión</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { stage: 'Leads Generados', count: dashboardStats?.totalLeads || 0, percentage: 100 },
                    { stage: 'Contactados', count: Math.round((dashboardStats?.totalLeads || 0) * (dashboardStats?.contactRate || 0) / 100), percentage: dashboardStats?.contactRate || 0 },
                    { stage: 'En Proceso', count: leads?.filter(l => l.estado === 'en_revision').length || 0, percentage: Math.round(((leads?.filter(l => l.estado === 'en_revision').length || 0) / (dashboardStats?.totalLeads || 1)) * 100) },
                    { stage: 'Aprobados', count: Math.round((dashboardStats?.totalLeads || 0) * (dashboardStats?.conversionRate || 0) / 100), percentage: dashboardStats?.conversionRate || 0 }
                  ].map((stage, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium">{stage.stage}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">{stage.count} leads</span>
                          <span className="text-sm font-medium">{stage.percentage}%</span>
                        </div>
                        <Progress value={stage.percentage} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};