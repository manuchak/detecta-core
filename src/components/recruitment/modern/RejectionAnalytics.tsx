import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  MapPin,
  Clock,
  FileX,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface RejectionAnalyticsProps {
  dateFrom: string;
  dateTo: string;
  selectedAnalysts: string[];
}

export const RejectionAnalytics: React.FC<RejectionAnalyticsProps> = ({
  dateFrom,
  dateTo,
  selectedAnalysts
}) => {
  const { data: rejectionData, isLoading } = useAuthenticatedQuery(
    ['rejection-analytics', dateFrom, dateTo, selectedAnalysts.join(',')],
    async () => {
      // Get rejected leads with reasons
      const { data: rejectedLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('estado', 'rechazado')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59.999Z');

      // Get all leads for rejection rate calculation
      const { data: allLeads } = await supabase
        .from('leads')
        .select('id, estado, fuente, asignado_a, created_at')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59.999Z');

      const filteredLeads = selectedAnalysts.length > 0 
        ? allLeads?.filter(lead => !lead.asignado_a || selectedAnalysts.includes(lead.asignado_a))
        : allLeads;

      const filteredRejected = selectedAnalysts.length > 0
        ? rejectedLeads?.filter(lead => !lead.asignado_a || selectedAnalysts.includes(lead.asignado_a))
        : rejectedLeads;

      // Calculate rejection statistics
      const totalLeads = filteredLeads?.length || 0;
      const totalRejected = filteredRejected?.length || 0;
      const rejectionRate = totalLeads > 0 ? Math.round((totalRejected / totalLeads) * 100) : 0;

      // Process rejection reasons
      const reasonCounts: Record<string, number> = {};
      const categoryCounts: Record<string, number> = {
        'Requisitos Básicos': 0,
        'Ubicación/Movilidad': 0,
        'Disponibilidad': 0,
        'Aspectos Económicos': 0,
        'Otros': 0
      };

      filteredRejected?.forEach(lead => {
        // For now, use motivo_rechazo field or create generic reasons
        const reasons = lead.motivo_rechazo ? [lead.motivo_rechazo] : ['Sin razón especificada'];
        reasons.forEach((reason: string) => {
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
          
          // Categorize reasons
          if (reason.includes('experiencia') || reason.includes('edad') || reason.includes('documentos')) {
            categoryCounts['Requisitos Básicos']++;
          } else if (reason.includes('ubicacion') || reason.includes('movilidad') || reason.includes('zona')) {
            categoryCounts['Ubicación/Movilidad']++;
          } else if (reason.includes('horario') || reason.includes('disponibilidad')) {
            categoryCounts['Disponibilidad']++;
          } else if (reason.includes('inversion') || reason.includes('economico') || reason.includes('salario')) {
            categoryCounts['Aspectos Económicos']++;
          } else {
            categoryCounts['Otros']++;
          }
        });
      });

      // Calculate rejection by source
      const rejectionBySource: Record<string, { total: number; rejected: number; rate: number }> = {};
      filteredLeads?.forEach(lead => {
        const source = lead.fuente || 'Sin fuente';
        if (!rejectionBySource[source]) {
          rejectionBySource[source] = { total: 0, rejected: 0, rate: 0 };
        }
        rejectionBySource[source].total++;
        if (lead.estado === 'rechazado') {
          rejectionBySource[source].rejected++;
        }
      });

      Object.keys(rejectionBySource).forEach(source => {
        const data = rejectionBySource[source];
        data.rate = data.total > 0 ? Math.round((data.rejected / data.total) * 100) : 0;
      });

      // Calculate time to rejection
      const timeToRejection = filteredRejected?.map(lead => {
        const created = new Date(lead.created_at);
        const updated = new Date(lead.updated_at);
        const diffHours = Math.round((updated.getTime() - created.getTime()) / (1000 * 60 * 60));
        return diffHours;
      }) || [];

      const avgTimeToRejection = timeToRejection.length > 0
        ? Math.round(timeToRejection.reduce((sum, time) => sum + time, 0) / timeToRejection.length)
        : 0;

      return {
        totalLeads,
        totalRejected,
        rejectionRate,
        reasonCounts,
        categoryCounts,
        rejectionBySource,
        avgTimeToRejection,
        timeToRejection
      };
    },
    {
      staleTime: 5 * 60 * 1000
    }
  );

  if (isLoading || !rejectionData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Prepare chart data
  const categoryData = Object.entries(rejectionData.categoryCounts)
    .map(([category, count]) => ({
      name: category,
      value: count,
      percentage: rejectionData.totalRejected > 0 
        ? Math.round((count / rejectionData.totalRejected) * 100)
        : 0
    }))
    .filter(item => item.value > 0);

  const sourceData = Object.entries(rejectionData.rejectionBySource)
    .map(([source, data]) => ({
      source,
      total: data.total,
      rejected: data.rejected,
      rate: data.rate
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 8);

  const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  const getRejectionLevel = (rate: number) => {
    if (rate <= 15) return { level: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (rate <= 25) return { level: 'Bueno', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (rate <= 40) return { level: 'Regular', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { level: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const rejectionLevel = getRejectionLevel(rejectionData.rejectionRate);

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rejection Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tasa de Rechazo</p>
                <p className="text-3xl font-bold">{rejectionData.rejectionRate}%</p>
                <Badge 
                  variant="secondary" 
                  className={`${rejectionLevel.color} ${rejectionLevel.bgColor} border-0`}
                >
                  {rejectionLevel.level}
                </Badge>
              </div>
              <TrendingDown className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress value={rejectionData.rejectionRate} className="mt-3" />
          </CardContent>
        </Card>

        {/* Total Rejected */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Rechazados</p>
                <p className="text-3xl font-bold">{rejectionData.totalRejected}</p>
                <p className="text-xs text-muted-foreground">De {rejectionData.totalLeads} leads</p>
              </div>
              <X className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Time to Rejection */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tiempo a Rechazo</p>
                <p className="text-3xl font-bold">{rejectionData.avgTimeToRejection}h</p>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Cost Impact */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Impacto en Costo</p>
                <p className="text-3xl font-bold">Alto</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((rejectionData.totalRejected * 1500) / 1000)}k MXN
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rejection by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Razones de Rechazo por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value} (${props.payload.percentage}%)`,
                      'Rechazos'
                    ]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-4">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value} ({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rejection by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tasa de Rechazo por Fuente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="source" type="category" width={80} />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Tasa de Rechazo']}
                    labelFormatter={(label: string) => `Fuente: ${label}`}
                  />
                  <Bar dataKey="rate" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Rejection Reasons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileX className="h-5 w-5" />
              Principales Razones de Rechazo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(rejectionData.reasonCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([reason, count], index) => {
                  const percentage = rejectionData.totalRejected > 0 
                    ? Math.round((count / rejectionData.totalRejected) * 100)
                    : 0;

                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{reason}</p>
                        <Progress value={percentage} className="mt-2" />
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Source Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Performance por Fuente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sourceData.map((source, index) => {
                const successRate = 100 - source.rate;
                const getSourceLevel = (rate: number) => {
                  if (rate >= 85) return 'Excelente';
                  if (rate >= 70) return 'Bueno';
                  if (rate >= 60) return 'Regular';
                  return 'Crítico';
                };

                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{source.source}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={successRate} className="flex-1" />
                        <Badge variant="outline" className="text-xs">
                          {getSourceLevel(successRate)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {source.rejected}/{source.total} rechazados
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-lg">{source.rate}%</p>
                      <p className="text-xs text-muted-foreground">Rechazo</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};