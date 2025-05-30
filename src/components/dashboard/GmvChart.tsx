
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MonthlyGmvData } from "@/hooks/useDashboardData";

interface GmvChartProps {
  data: MonthlyGmvData[];
}

export const GmvChart = ({ data }: GmvChartProps) => {
  return (
    <Card className="h-full bg-white border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">
              Evolución de Ingresos
            </CardTitle>
            <CardDescription className="text-slate-600 mt-1">
              Comparación mensual con período anterior
            </CardDescription>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-slate-600">2025</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-slate-400 rounded-full mr-2"></div>
              <span className="text-slate-600">2024</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value >= 1000 ? `$${value/1000}K` : `$${value}`} 
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => [`$${value.toLocaleString()}`, 'Ingresos']}
              labelFormatter={(label) => `Mes: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              name="2025"
              strokeWidth={3} 
              activeDot={{ r: 6, fill: '#3b82f6' }}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="previousYear" 
              stroke="#94a3b8" 
              name="2024"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#94a3b8', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
