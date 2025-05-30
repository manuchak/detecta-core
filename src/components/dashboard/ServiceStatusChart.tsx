
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceStatusData, DashboardMetrics } from "@/hooks/useDashboardData";

interface ServiceStatusChartProps {
  data: ServiceStatusData[];
  metrics: DashboardMetrics;
}

// Colores más suaves y modernos para cada estado
const STATUS_COLORS = {
  'Completado': '#22c55e',
  'En Proceso': '#3b82f6', 
  'Pendiente': '#f59e0b',
  'Cancelado': '#ef4444',
  'Otros': '#8b5cf6'
};

// Configuración de estado con iconos y descripciones
const STATUS_CONFIG = {
  'Completado': { color: '#22c55e', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: '✓' },
  'En Proceso': { color: '#3b82f6', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: '⏳' },
  'Pendiente': { color: '#f59e0b', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: '⏸️' },
  'Cancelado': { color: '#ef4444', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: '✕' }
};

// Componente personalizado para etiquetas en las barras
const CustomLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (value === 0) return null;
  
  return (
    <text 
      x={x + width + 8} 
      y={y + height / 2} 
      fill="#6b7280" 
      textAnchor="start" 
      dominantBaseline="middle"
      className="text-sm font-semibold"
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
      <div className="bg-white p-3 rounded-lg border shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">
          <span className="inline-block w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: data.color }}></span>
          {data.value} servicios
        </p>
      </div>
    );
  }
  return null;
};

export const ServiceStatusChart = ({ data, metrics }: ServiceStatusChartProps) => {
  // Procesar datos para el gráfico
  const chartData = data.map(item => ({
    ...item,
    color: STATUS_COLORS[item.name as keyof typeof STATUS_COLORS] || '#8b5cf6'
  }));

  // Calcular totales para porcentajes
  const getStatusValue = (status: string) => {
    switch (status) {
      case 'Completados': return metrics.completedServices;
      case 'En proceso': return metrics.ongoingServices;
      case 'Pendientes': return metrics.pendingServices;
      case 'Cancelados': return metrics.cancelledServices;
      default: return 0;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Completados': return STATUS_CONFIG['Completado'];
      case 'En proceso': return STATUS_CONFIG['En Proceso'];
      case 'Pendientes': return STATUS_CONFIG['Pendiente'];
      case 'Cancelados': return STATUS_CONFIG['Cancelado'];
      default: return STATUS_CONFIG['Completado'];
    }
  };

  const statusItems = [
    { name: 'Completados', value: metrics.completedServices },
    { name: 'En proceso', value: metrics.ongoingServices },
    { name: 'Pendientes', value: metrics.pendingServices },
    { name: 'Cancelados', value: metrics.cancelledServices }
  ];

  return (
    <Card className="lg:col-span-1 card-apple h-[500px] hover-lift">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
          Estado de Servicios
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[440px] p-6">
        <Tabs defaultValue="chart" className="h-full">
          <TabsList className="mb-4 h-10 bg-gray-50 rounded-lg p-1">
            <TabsTrigger value="chart" className="text-sm px-4 py-2 rounded-md font-medium">
              📊 Gráfico
            </TabsTrigger>
            <TabsTrigger value="numbers" className="text-sm px-4 py-2 rounded-md font-medium">
              📈 Números
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="h-[370px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 80, left: 80, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  className="text-sm"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  className="text-sm"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  width={75}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  name="Cantidad"
                  label={<CustomLabel />}
                  radius={[0, 6, 6, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      style={{
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="numbers" className="h-[370px] overflow-y-auto">
            <div className="space-y-4">
              {statusItems.map((item, index) => {
                const config = getStatusConfig(item.name);
                const percentage = metrics.totalServices > 0 ? Math.round((item.value / metrics.totalServices) * 100) : 0;
                
                return (
                  <div key={index} className={`p-4 rounded-xl border-2 ${config.bgColor} ${config.borderColor} transition-all duration-200 hover:shadow-md`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" 
                             style={{ backgroundColor: config.color }}>
                          {config.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">Estado del servicio</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: config.color }}>
                          {item.value}
                        </p>
                        <p className="text-sm text-gray-500 font-medium">
                          {percentage}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="h-3 rounded-full bg-white border overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500 ease-out rounded-full" 
                          style={{ 
                            backgroundColor: config.color,
                            width: `${percentage}%`,
                            boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.3)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">0</span>
                        <span className="text-xs text-gray-400">{metrics.totalServices}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Resumen total */}
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total de Servicios</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.totalServices}</p>
                  <div className="flex justify-center gap-4 mt-3 text-xs">
                    <span className="text-green-600 font-medium">
                      ✓ {Math.round((metrics.completedServices / metrics.totalServices) * 100)}% Completados
                    </span>
                    <span className="text-blue-600 font-medium">
                      ⏳ {Math.round((metrics.ongoingServices / metrics.totalServices) * 100)}% En Proceso
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
