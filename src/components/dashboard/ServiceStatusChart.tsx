
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceStatusData, DashboardMetrics } from "@/hooks/useDashboardData";

interface ServiceStatusChartProps {
  data: ServiceStatusData[];
  metrics: DashboardMetrics;
}

// Colores más vibrantes y diferenciados
const STATUS_COLORS = {
  'Completado': '#10b981',
  'En Proceso': '#3b82f6', 
  'Pendiente': '#f59e0b',
  'Cancelado': '#ef4444',
  'Otros': '#8b5cf6'
};

// Configuración de estado con iconos y descripciones
const STATUS_CONFIG = {
  'Completados': { color: '#10b981', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: '✅' },
  'En proceso': { color: '#3b82f6', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: '🔄' },
  'Pendientes': { color: '#f59e0b', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: '⏳' },
  'Cancelados': { color: '#ef4444', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: '❌' }
};

// Componente personalizado para etiquetas en las barras
const CustomLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (value === 0) return null;
  
  return (
    <text 
      x={x + width + 12} 
      y={y + height / 2} 
      fill="#374151" 
      textAnchor="start" 
      dominantBaseline="middle"
      className="text-base font-bold"
    >
      {value}
    </text>
  );
};

// Tooltip personalizado para el gráfico
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-4 rounded-xl border shadow-xl border-gray-200">
        <p className="font-bold text-gray-900 text-base">{label}</p>
        <p className="text-sm text-gray-600 mt-1">
          <span className="inline-block w-4 h-4 rounded-full mr-2" 
                style={{ backgroundColor: data.color }}></span>
          {data.value} servicios
        </p>
      </div>
    );
  }
  return null;
};

export const ServiceStatusChart = ({ data, metrics }: ServiceStatusChartProps) => {
  // Procesar datos para el gráfico con mejor estructura
  const chartData = data.map(item => ({
    ...item,
    color: STATUS_COLORS[item.name as keyof typeof STATUS_COLORS] || '#8b5cf6'
  }));

  const statusItems = [
    { name: 'Completados', value: metrics.completedServices },
    { name: 'En proceso', value: metrics.ongoingServices },
    { name: 'Pendientes', value: metrics.pendingServices },
    { name: 'Cancelados', value: metrics.cancelledServices }
  ];

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['Completados'];
  };

  return (
    <Card className="lg:col-span-1 h-[500px] bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4 border-b border-gray-100">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
          Estado de Servicios
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[440px] p-6">
        <Tabs defaultValue="chart" className="h-full">
          <TabsList className="mb-6 h-12 bg-gray-50 rounded-xl p-1 w-full">
            <TabsTrigger value="chart" className="text-sm px-6 py-3 rounded-lg font-semibold flex-1">
              📊 Gráfico
            </TabsTrigger>
            <TabsTrigger value="numbers" className="text-sm px-6 py-3 rounded-lg font-semibold flex-1">
              📈 Números
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 100, left: 100, bottom: 10 }}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  className="text-sm"
                  tick={{ fontSize: 13, fill: '#6b7280', fontWeight: 500 }}
                  axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  className="text-sm"
                  tick={{ fontSize: 13, fill: '#374151', fontWeight: 600 }}
                  width={90}
                  axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  name="Cantidad"
                  label={<CustomLabel />}
                  radius={[0, 8, 8, 0]}
                  maxBarSize={40}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="numbers" className="h-[360px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {statusItems.map((item, index) => {
                const config = getStatusConfig(item.name);
                const percentage = metrics.totalServices > 0 ? Math.round((item.value / metrics.totalServices) * 100) : 0;
                
                return (
                  <div key={index} className={`p-5 rounded-2xl border-2 ${config.bgColor} ${config.borderColor} transition-all duration-300 hover:shadow-lg hover:scale-105`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" 
                             style={{ backgroundColor: config.color }}>
                          {config.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">Servicios</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: config.color }}>
                          {item.value}
                        </p>
                        <p className="text-sm text-gray-500 font-semibold">
                          {percentage}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="h-2 rounded-full bg-white border overflow-hidden shadow-inner">
                        <div 
                          className="h-full transition-all duration-700 ease-out rounded-full" 
                          style={{ 
                            backgroundColor: config.color,
                            width: `${percentage}%`,
                            boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.4)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-gray-400 font-medium">0</span>
                        <span className="text-xs text-gray-400 font-medium">{metrics.totalServices}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Resumen total mejorado */}
            <div className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border-2 border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2 font-medium">Total de Servicios</p>
                <p className="text-4xl font-bold text-gray-900 mb-4">{metrics.totalServices}</p>
                <div className="flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-emerald-600 font-semibold">
                      {Math.round((metrics.completedServices / metrics.totalServices) * 100)}% Completados
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-blue-600 font-semibold">
                      {Math.round((metrics.ongoingServices / metrics.totalServices) * 100)}% En Proceso
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
