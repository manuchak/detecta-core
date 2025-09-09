import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Clock, 
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users
} from 'lucide-react';
import { ContactabilityMetrics } from '@/hooks/useContactabilityMetrics';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface ContactabilityAnalyticsProps {
  metrics: ContactabilityMetrics;
  loading?: boolean;
}

export const ContactabilityAnalytics: React.FC<ContactabilityAnalyticsProps> = ({
  metrics,
  loading
}) => {
  if (loading) {
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

  const contactStatusData = [
    {
      name: 'Sin Contactar',
      value: metrics.leadsWithoutContact,
      color: '#ef4444',
      icon: PhoneOff
    },
    {
      name: 'Contacto No Efectivo',
      value: metrics.leadsWithIneffectiveContact,
      color: '#f59e0b',
      icon: Phone
    },
    {
      name: 'Contacto Efectivo',
      value: metrics.leadsWithEffectiveContact,
      color: '#10b981',
      icon: CheckCircle
    },
    {
      name: 'Necesita Re-contacto',
      value: metrics.leadsNeedingRecontact,
      color: '#8b5cf6',
      icon: AlertCircle
    }
  ];

  const attemptDistributionData = [
    { name: '0 intentos', value: metrics.attemptDistribution.noAttempts, color: '#ef4444' },
    { name: '1 intento', value: metrics.attemptDistribution.oneAttempt, color: '#f59e0b' },
    { name: '2 intentos', value: metrics.attemptDistribution.twoAttempts, color: '#eab308' },
    { name: '3 intentos', value: metrics.attemptDistribution.threeAttempts, color: '#22c55e' },
    { name: '4+ intentos', value: metrics.attemptDistribution.fourPlusAttempts, color: '#3b82f6' },
  ];

  const conversionData = metrics.conversionRateByAttempt.map(item => ({
    attempt: `Intento ${item.attempt}`,
    rate: item.successRate,
    total: item.totalCalls
  }));

  const getContactabilityLevel = (rate: number) => {
    if (rate >= 70) return { level: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (rate >= 50) return { level: 'Bueno', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (rate >= 30) return { level: 'Regular', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { level: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const contactabilityLevel = getContactabilityLevel(metrics.realContactabilityRate);

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Real Contactability Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Contactabilidad Real</p>
                <p className="text-3xl font-bold">{metrics.realContactabilityRate}%</p>
                <Badge 
                  variant="secondary" 
                  className={`${contactabilityLevel.color} ${contactabilityLevel.bgColor} border-0`}
                >
                  {contactabilityLevel.level}
                </Badge>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress value={metrics.realContactabilityRate} className="mt-3" />
          </CardContent>
        </Card>

        {/* Contact Efficiency */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Eficiencia de Contacto</p>
                <p className="text-3xl font-bold">{metrics.contactEfficiencyRate}%</p>
                <p className="text-xs text-muted-foreground">Éxito por intento</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Average Attempts */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Intentos Promedio</p>
                <p className="text-3xl font-bold">{metrics.averageAttemptsBeforeSuccess}</p>
                <p className="text-xs text-muted-foreground">Antes del éxito</p>
              </div>
              <PhoneCall className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Time Between Attempts */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tiempo Entre Intentos</p>
                <p className="text-3xl font-bold">{metrics.averageTimeBetweenAttempts}h</p>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Status Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clasificación de Estados de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contactStatusData.map((status, index) => {
                const percentage = metrics.totalLeads > 0 
                  ? Math.round((status.value / metrics.totalLeads) * 100)
                  : 0;
                const IconComponent = status.icon;

                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <IconComponent 
                        className="h-5 w-5" 
                        style={{ color: status.color }}
                      />
                      <div>
                        <p className="font-medium">{status.name}</p>
                        <p className="text-sm text-muted-foreground">{status.value} leads</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Attempt Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Número de Intentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attemptDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {attemptDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Leads']}
                    labelStyle={{ color: '#374151' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {attemptDistributionData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate by Attempt */}
        <Card>
          <CardHeader>
            <CardTitle>Tasa de Conversión por Intento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attempt" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value}%`, 
                      name === 'rate' ? 'Tasa de Éxito' : name
                    ]}
                  />
                  <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Recontacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Leads Prioritarios para Re-contacto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {metrics.priorityRecontacts.slice(0, 10).map((lead) => {
                const priorityColors = {
                  high: 'bg-red-100 text-red-700 border-red-200',
                  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                  low: 'bg-blue-100 text-blue-700 border-blue-200'
                };

                return (
                  <div key={lead.leadId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{lead.leadName}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.attempts} intentos • Último: {lead.lastOutcome}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={priorityColors[lead.priority]}
                    >
                      {lead.priority.toUpperCase()}
                    </Badge>
                  </div>
                );
              })}
              {metrics.priorityRecontacts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No hay leads pendientes de re-contacto
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};