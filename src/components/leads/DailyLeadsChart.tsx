
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, Phone, TrendingUp } from "lucide-react";

interface DailyLeadsChartProps {
  data: Array<{
    date: string;
    leads_received: number;
    calls_made: number;
  }>;
  loading: boolean;
}

export const DailyLeadsChart = ({ data, loading }: DailyLeadsChartProps) => {
  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Actividad Diaria</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format dates for better display
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short' 
    })
  }));

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Actividad Diaria - Leads vs Llamadas</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value, name) => [
                  value,
                  name === 'leads_received' ? 'Leads Recibidos' : 'Llamadas Realizadas'
                ]}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Legend 
                formatter={(value) => 
                  value === 'leads_received' ? 'Leads Recibidos' : 'Llamadas Realizadas'
                }
              />
              <Bar 
                dataKey="leads_received" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                name="leads_received"
              />
              <Bar 
                dataKey="calls_made" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
                name="calls_made"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Total Leads</p>
              <p className="text-lg font-bold text-blue-600">
                {data.reduce((sum, item) => sum + item.leads_received, 0)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium">Total Llamadas</p>
              <p className="text-lg font-bold text-green-600">
                {data.reduce((sum, item) => sum + item.calls_made, 0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
