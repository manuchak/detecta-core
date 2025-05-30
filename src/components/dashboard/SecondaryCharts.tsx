
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ServiceTypesData, DailyServiceData, TopClientsData } from "@/hooks/useDashboardData";

interface SecondaryChartsProps {
  dailyServiceData: DailyServiceData[];
  serviceTypesData: ServiceTypesData[];
  topClientsData: TopClientsData[];
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#f43f5e', '#8b5cf6', '#059669', '#dc2626'
];

// Colores específicos para tipos de servicios
const SERVICE_TYPE_COLORS = {
  'Foráneo': '#3b82f6',
  'Local': '#10b981', 
  'Foráneo CORTO': '#f59e0b',
  'REPARTO': '#ef4444',
  'Sin especificar': '#6b7280'
};

export const SecondaryCharts = ({ dailyServiceData, serviceTypesData, topClientsData }: SecondaryChartsProps) => {
  // Procesar datos de clientes principales para mostrar top 15 + "Otros"
  const processTopClients = (data: TopClientsData[]) => {
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const top15 = sortedData.slice(0, 15);
    const others = sortedData.slice(15);
    
    if (others.length > 0) {
      const othersSum = others.reduce((sum, client) => sum + client.value, 0);
      top15.push({ name: 'Otros', value: othersSum });
    }
    
    return top15;
  };

  const processedClientsData = processTopClients(topClientsData);
  const totalClients = processedClientsData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600">
            {`Servicios: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = ((payload[0].value / totalClients) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-blue-600">
            {`Servicios: ${payload[0].value} (${percentage}%)`}
          </p>
        </div>
      );
    }
    return null;
  };

  const ServiceTypeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600">
            {`${payload[0].value}% del total`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Servicios Diarios - Gráfico de barras mejorado */}
      <div className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              Servicios Diarios
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dailyServiceData}
                margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={12}
                  stroke="#64748b"
                />
                <YAxis fontSize={12} stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  name="Servicios" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                  stroke="#7c3aed"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de Servicios - Rediseñado con mejor layout */}
      <div className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              Tipos de Servicios
            </CardTitle>
            <p className="text-sm text-gray-600">Distribución por tipo</p>
          </CardHeader>
          <CardContent className="h-80 flex flex-col">
            {/* Contenedor principal con layout mejorado */}
            <div className="flex-1 flex items-center">
              {serviceTypesData && serviceTypesData.length > 0 ? (
                <div className="w-full grid grid-cols-2 gap-4">
                  {/* Lado izquierdo: Barras de progreso visuales */}
                  <div className="space-y-3">
                    {serviceTypesData.map((item, index) => {
                      const color = SERVICE_TYPE_COLORS[item.name as keyof typeof SERVICE_TYPE_COLORS] || '#6b7280';
                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {item.name}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {item.value}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="h-2.5 rounded-full transition-all duration-300"
                              style={{
                                width: `${item.value}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Lado derecho: Gráfico de dona compacto */}
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={serviceTypesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          {serviceTypesData.map((entry, index) => {
                            const color = SERVICE_TYPE_COLORS[entry.name as keyof typeof SERVICE_TYPE_COLORS] || '#6b7280';
                            return (
                              <Cell key={`cell-${index}`} fill={color} />
                            );
                          })}
                        </Pie>
                        <Tooltip content={<ServiceTypeTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="w-full flex items-center justify-center text-gray-500">
                  <p>No hay datos disponibles</p>
                </div>
              )}
            </div>
            
            {/* Resumen total en la parte inferior */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>Total de tipos:</span>
                <span className="font-semibold">{serviceTypesData.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clientes Principales - Gráfico de dona rediseñado */}
      <div className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              Clientes Principales
            </CardTitle>
            <p className="text-sm text-gray-600">Top 15 clientes + otros</p>
          </CardHeader>
          <CardContent className="h-96 flex flex-col">
            {/* Contenedor del gráfico */}
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={processedClientsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={75}
                    paddingAngle={1}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {processedClientsData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Leyenda mejorada con scroll */}
            <div className="mt-2 bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="space-y-1.5">
                {processedClientsData.map((entry, index) => {
                  const percentage = ((entry.value / totalClients) * 100).toFixed(1);
                  return (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span 
                          className="truncate text-gray-700 font-medium" 
                          title={entry.name}
                        >
                          {entry.name}
                        </span>
                      </div>
                      <span className="text-gray-600 font-semibold ml-2 flex-shrink-0">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
