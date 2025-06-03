
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useGmvChartData } from "@/hooks/useGmvChartData";
import { Loader2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const GmvChart = () => {
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const { gmvData, clientsList, isLoading } = useGmvChartData(selectedClient);

  return (
    <Card className="h-full bg-white border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl font-bold text-slate-900">
                Evolución de Ingresos
              </CardTitle>
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Info className="h-3 w-3" />
                Datos históricos completos
              </Badge>
            </div>
            <CardDescription className="text-slate-600 mt-1">
              Comparación mensual histórica completa (MoM) - No afectado por filtros
            </CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clientsList.map((client) => (
                  <SelectItem key={client} value={client}>
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm mt-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-slate-600">2025</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-slate-400 rounded-full mr-2"></div>
            <span className="text-slate-600">2024</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-80">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={gmvData}
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
        )}
      </CardContent>
    </Card>
  );
};
