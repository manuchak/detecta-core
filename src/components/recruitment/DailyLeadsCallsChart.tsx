
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { useDailyLeadsCallsData } from '@/hooks/useDailyLeadsCallsData';
import { TrendingUp, Phone, Users } from 'lucide-react';

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--chart-1))",
  },
  llamadas: {
    label: "Llamadas",
    color: "hsl(var(--chart-2))",
  },
};

export const DailyLeadsCallsChart = () => {
  const { data, loading } = useDailyLeadsCallsData();

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Actividad Diaria - Últimos 28 días
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalLeads = data.reduce((sum, day) => sum + day.leads, 0);
  const totalCalls = data.reduce((sum, day) => sum + day.llamadas, 0);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Actividad Diaria - Últimos 28 días
        </CardTitle>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Total Leads: {totalLeads}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Total Llamadas: {totalCalls}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="dayLabel"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="rect"
              />
              <Bar 
                dataKey="leads" 
                name="Leads"
                fill="var(--color-leads)"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
              <Bar 
                dataKey="llamadas" 
                name="Llamadas"
                fill="var(--color-llamadas)"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
