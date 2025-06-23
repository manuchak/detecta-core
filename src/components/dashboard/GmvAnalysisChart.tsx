
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useGmvAnalysis } from "@/hooks/useGmvAnalysis";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export const GmvAnalysisChart = () => {
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const { 
    monthlyData, 
    totalGmv2025, 
    totalGmv2024, 
    overallGrowth, 
    clients, 
    isLoading, 
    totalRecords 
  } = useGmvAnalysis(selectedClient);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">
                {entry.dataKey === 'year2025' ? '2025' : '2024'}: {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          {payload[0] && payload[1] && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Crecimiento: {payload[0].payload.growth >= 0 ? '+' : ''}{payload[0].payload.growth}%
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const hasData = totalGmv2025 > 0 || totalGmv2024 > 0;

  return (
    <Card className="h-full bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Evolución de Ingresos (Análisis Forense)
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Datos históricos completos usando auditoría forense - {formatCurrency(totalGmv2025 + totalGmv2024)} total
            </p>
          </div>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos los clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Metrics Summary */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              2025: {formatCurrency(totalGmv2025)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              2024: {formatCurrency(totalGmv2024)}
            </span>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            overallGrowth >= 0 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {overallGrowth >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {overallGrowth >= 0 ? '+' : ''}{overallGrowth}%
          </div>
          <div className="text-xs text-gray-500">
            {totalRecords.toLocaleString()} registros procesados
          </div>
        </div>
        
        <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-100 rounded-full"></div>
          Solo servicios "Finalizado" con cobro válido
        </div>

        {!hasData && !isLoading && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-700">
              No se encontraron datos de GMV válidos. Verificar servicios finalizados con cobro.
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="h-80">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Procesando datos completos...</p>
            </div>
          </div>
        ) : !hasData ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay datos de GMV disponibles</p>
              <p className="text-sm text-gray-500">
                Verifica que existan servicios finalizados con cobro válido
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="month" 
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
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="year2025" 
                stroke="#3b82f6" 
                name="2025"
                strokeWidth={3} 
                activeDot={{ r: 6, fill: '#3b82f6' }}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="year2024" 
                stroke="#9ca3af" 
                name="2024"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#9ca3af', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
