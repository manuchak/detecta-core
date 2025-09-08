import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  UserPlus,
  PhoneCall,
  UserCheck,
  BarChart3
} from 'lucide-react';
import { useAcquisitionMetrics } from '@/hooks/useAcquisitionMetrics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AcquisitionOverview = () => {
  const { data: metrics, isLoading } = useAcquisitionMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const acquisitionKPIs = [
    {
      title: 'CPA Real',
      value: formatCurrency(metrics.cpaReal),
      description: 'Costo por Adquisición',
      icon: DollarSign,
      trend: -12.5,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Tasa Conversión',
      value: `${metrics.conversionRate}%`,
      description: 'Leads → Custodios',
      icon: Target,
      trend: 8.2,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Leads',
      value: metrics.totalLeads.toLocaleString(),
      description: 'Leads generados',
      icon: Users,
      trend: 15.7,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Inversión Total',
      value: formatCurrency(metrics.totalExpenses),
      description: 'Gasto en adquisición',
      icon: TrendingUp,
      trend: 5.3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Acquisition KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {acquisitionKPIs.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend > 0;
          
          return (
            <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mb-2">
                  {kpi.description}
                </p>
                <div className="flex items-center gap-1">
                  <Badge 
                    variant={isPositive ? "default" : "destructive"}
                    className="text-xs px-2 py-0"
                  >
                    {isPositive ? '+' : ''}{kpi.trend}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">vs mes anterior</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolución de Leads
            </CardTitle>
            <CardDescription>
              Leads y conversiones por mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.leadsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'leads' ? 'Leads' : 'Conversiones']}
                />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expenses by Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Gastos por Canal
            </CardTitle>
            <CardDescription>
              Distribución de inversión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.expensesByChannel}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ channel, percentage }) => `${channel}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {metrics.expensesByChannel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Inversión']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel and ROI by Channel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Embudo de Conversión
            </CardTitle>
            <CardDescription>
              Proceso completo de adquisición
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Leads', value: metrics.conversionFunnel.leads, icon: Users, percentage: 100 },
              { label: 'Contactados', value: metrics.conversionFunnel.contacted, icon: PhoneCall, percentage: (metrics.conversionFunnel.contacted / metrics.conversionFunnel.leads) * 100 },
              { label: 'Entrevistas', value: metrics.conversionFunnel.interviews, icon: UserPlus, percentage: (metrics.conversionFunnel.interviews / metrics.conversionFunnel.leads) * 100 },
              { label: 'Aprobados', value: metrics.conversionFunnel.approved, icon: UserCheck, percentage: (metrics.conversionFunnel.approved / metrics.conversionFunnel.leads) * 100 },
              { label: 'Activos', value: metrics.conversionFunnel.active, icon: TrendingUp, percentage: (metrics.conversionFunnel.active / metrics.conversionFunnel.leads) * 100 }
            ].map((stage, index) => {
              const Icon = stage.icon;
              
              return (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{stage.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {stage.value.toLocaleString()} ({stage.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={stage.percentage} className="h-2" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ROI by Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ROI por Canal
            </CardTitle>
            <CardDescription>
              Retorno de inversión por canal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.roiByChannel.map((channel, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{channel.channel}</span>
                    <Badge 
                      variant={channel.roi > 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {channel.roi > 0 ? '+' : ''}{channel.roi}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span>Inversión: </span>
                      <span className="font-medium">{formatCurrency(channel.investment)}</span>
                    </div>
                    <div>
                      <span>Ingresos: </span>
                      <span className="font-medium">{formatCurrency(channel.revenue)}</span>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(Math.abs(channel.roi), 100)} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};