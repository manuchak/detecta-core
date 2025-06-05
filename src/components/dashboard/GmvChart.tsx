
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useGmvChartData } from "@/hooks/useGmvChartData";
import { Loader2, Info, Database, Bug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GmvDiagnosticPanel } from "./GmvDiagnosticPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

export const GmvChart = () => {
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const { gmvData, clientsList, isLoading } = useGmvChartData();

  // Filtrar datos por cliente seleccionado si no es "all"
  const filteredGmvData = selectedClient === "all" ? gmvData : gmvData.map(item => {
    // Para el filtro de cliente, necesitaríamos re-procesar los datos
    // Por ahora mantenemos los datos completos ya que el análisis forense es anual
    return item;
  });

  // Contar meses con datos para el diagnóstico
  const mesesConDatos = filteredGmvData.filter(item => item.value > 0).length;
  const totalGmv = filteredGmvData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      <Card className="h-full bg-white border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-xl font-bold text-slate-900">
                  Evolución de Ingresos (Análisis Forense)
                </CardTitle>
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Database className="h-3 w-3" />
                  Metodología forense exacta
                </Badge>
                <Badge 
                  variant={mesesConDatos > 0 ? "default" : "destructive"} 
                  className="text-xs"
                >
                  {mesesConDatos} meses con datos
                </Badge>
              </div>
              <CardDescription className="text-slate-600 mt-1">
                Datos históricos completos usando auditoría forense - Total GMV: ${totalGmv.toLocaleString()}
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
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-slate-600">2025</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-slate-400 rounded-full mr-2"></div>
                <span className="text-slate-600">2024</span>
              </div>
              <div className="flex items-center">
                <Info className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-xs text-slate-500">Solo servicios "Finalizado" con cobro válido</span>
              </div>
            </div>
            <Collapsible open={showDiagnostic} onOpenChange={setShowDiagnostic}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  {showDiagnostic ? 'Ocultar' : 'Mostrar'} Diagnóstico
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
                <p className="text-sm text-slate-600">Procesando análisis forense...</p>
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

      {/* Panel de Diagnóstico */}
      <Collapsible open={showDiagnostic} onOpenChange={setShowDiagnostic}>
        <CollapsibleContent>
          <GmvDiagnosticPanel />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
