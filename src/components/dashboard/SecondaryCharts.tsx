
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

      {/* Tipos de Servicios - Gráfico horizontal mejorado */}
      <div className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              Tipos de Servicios
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={serviceTypesData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 80, bottom: 20 }}
              >
                <CartesianGrid horizontal strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  fontSize={12} 
                  stroke="#64748b"
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={70}
                  fontSize={11}
                  stroke="#64748b"
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Porcentaje']}
                  labelStyle={{ color: '#1f2937' }}
                />
                <Bar 
                  dataKey="value" 
                  name="Porcentaje" 
                  fill="#0ea5e9" 
                  radius={[0, 4, 4, 0]}
                  stroke="#0284c7"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Clientes Principales - Gráfico de dona */}
      <div className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              Clientes Principales
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Top 15 clientes + otros</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedClientsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
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
            
            {/* Leyenda personalizada */}
            <div className="mt-4 max-h-32 overflow-y-auto">
              <div className="grid grid-cols-1 gap-1 text-xs">
                {processedClientsData.slice(0, 8).map((entry, index) => {
                  const percentage = ((entry.value / totalClients) * 100).toFixed(1);
                  return (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate text-gray-700" title={entry.name}>
                          {entry.name}
                        </span>
                      </div>
                      <span className="text-gray-600 font-medium">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
                {processedClientsData.length > 8 && (
                  <div className="text-gray-500 text-center mt-1">
                    +{processedClientsData.length - 8} más...
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
