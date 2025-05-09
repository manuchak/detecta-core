
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MonthlyGmvData } from "@/hooks/useDashboardData";

interface GmvChartProps {
  data: MonthlyGmvData[];
}

export const GmvChart = ({ data }: GmvChartProps) => {
  return (
    <Card className="lg:col-span-4 card-apple">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Rendimiento de GMV</CardTitle>
        <CardDescription>Comparación mensual con año anterior</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
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
  );
};
