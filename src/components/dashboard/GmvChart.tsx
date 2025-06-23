
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useGmvChartDataIndependent } from "@/hooks/useGmvChartDataIndependent";
import { Loader2, Bug } from "lucide-react";
import { GmvDiagnosticPanel } from "./GmvDiagnosticPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

export const GmvChart = () => {
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const { gmvData, clientsList, isLoading, totalRecordsProcessed } = useGmvChartDataIndependent();

  // Filtrar datos por cliente seleccionado si no es "all"
  const filteredGmvData = selectedClient === "all" ? gmvData : gmvData.map(item => {
    // Para el filtro de cliente, necesitaríamos re-procesar los datos
    // Por ahora mantenemos los datos completos ya que el análisis forense es anual
    return item;
  });

  // Calcular totales para ambos años
  const totalGmv2025 = filteredGmvData.reduce((sum, item) => sum + item.value, 0);
  const totalGmv2024 = filteredGmvData.reduce((sum, item) => sum + (item.previousYear || 0), 0);
  const yearOverYearGrowth = totalGmv2024 > 0 ? ((totalGmv2025 - totalGmv2024) / totalGmv2024) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card className="h-full bg-white border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Análisis de Rendimiento Anual
              </CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                Comparación completa 2025 vs 2024 - Dataset: {totalRecordsProcessed.toLocaleString()} registros
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-slate-600 font-medium">2025: ${totalGmv2025.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-slate-400 rounded-full mr-2"></div>
                <span className="text-slate-600 font-medium">2024: ${totalGmv2024.toLocaleString()}</span>
              </div>
              <div className="text-xs px-2 py-1 rounded-full bg-slate-100">
                Crecimiento: {yearOverYearGrowth >= 0 ? '+' : ''}{yearOverYearGrowth.toFixed(1)}%
              </div>
            </div>
            <Collapsible open={showDiagnostic} onOpenChange={setShowDiagnostic}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  {showDiagnostic ? 'Ocultar' : 'Diagnóstico'}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Cargando análisis completo...</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredGmvData}
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
                  tickFormatter={(value) => value >= 1000000 ? `$${(value/1000000).toFixed(1)}M` : value >= 1000 ? `$${(value/1000).toFixed(0)}K` : `$${value}`} 
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`, 
                    name === 'value' ? '2025' : '2024'
                  ]}
                  labelFormatter={(label) => `${label}`}
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

      {/* Panel de Diagnóstico */}
      <Collapsible open={showDiagnostic} onOpenChange={setShowDiagnostic}>
        <CollapsibleContent>
          <GmvDiagnosticPanel />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
