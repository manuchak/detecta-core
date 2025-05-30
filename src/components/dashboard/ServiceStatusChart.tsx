
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceStatusData, DashboardMetrics } from "@/hooks/useDashboardData";

interface ServiceStatusChartProps {
  data: ServiceStatusData[];
  metrics: DashboardMetrics;
}

// Colores consistentes para cada estado
const STATUS_COLORS = {
  'Completado': '#10b981',
  'En Proceso': '#3b82f6', 
  'Pendiente': '#f59e0b',
  'Cancelado': '#ef4444',
  'Otros': '#8b5cf6'
};

// Componente personalizado para mostrar etiquetas en las barras
const CustomLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (value === 0) return null;
  
  return (
    <text 
      x={x + width + 5} 
      y={y + 10} 
      fill="#374151" 
      textAnchor="start" 
      className="text-xs font-medium"
    >
      {value}
    </text>
  );
};

export const ServiceStatusChart = ({ data, metrics }: ServiceStatusChartProps) => {
  // Procesar datos para el gráfico con colores consistentes
  const chartData = data.map(item => ({
    ...item,
    color: STATUS_COLORS[item.name as keyof typeof STATUS_COLORS] || '#8b5cf6'
  }));

  return (
    <Card className="lg:col-span-3 card-apple h-[400px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Estado de Servicios</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <Tabs defaultValue="chart" className="h-full">
          <TabsList className="mb-3">
            <TabsTrigger value="chart" className="text-xs">Gráfico</TabsTrigger>
            <TabsTrigger value="numbers" className="text-xs">Números</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 40, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number" 
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                  width={75}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  name="Cantidad"
                  label={<CustomLabel />}
                  radius={[0, 4, 4, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="numbers" className="h-[280px] overflow-y-auto">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-sm font-medium">Completados</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-bold">{metrics.completedServices}</p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {metrics.totalServices > 0 ? Math.round((metrics.completedServices / metrics.totalServices) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300" 
                    style={{width: `${metrics.totalServices > 0 ? (metrics.completedServices / metrics.totalServices) * 100 : 0}%`}}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                    <p className="text-sm font-medium">En proceso</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-bold">{metrics.ongoingServices}</p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {metrics.totalServices > 0 ? Math.round((metrics.ongoingServices / metrics.totalServices) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300" 
                    style={{width: `${metrics.totalServices > 0 ? (metrics.ongoingServices / metrics.totalServices) * 100 : 0}%`}}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                    <p className="text-sm font-medium">Pendientes</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-bold">{metrics.pendingServices}</p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {metrics.totalServices > 0 ? Math.round((metrics.pendingServices / metrics.totalServices) * 100 : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-300" 
                    style={{width: `${metrics.totalServices > 0 ? (metrics.pendingServices / metrics.totalServices) * 100 : 0}%`}}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                    <p className="text-sm font-medium">Cancelados</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-bold">{metrics.cancelledServices}</p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {metrics.totalServices > 0 ? Math.round((metrics.cancelledServices / metrics.totalServices) * 100 : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-300" 
                    style={{width: `${metrics.totalServices > 0 ? (metrics.cancelledServices / metrics.totalServices) * 100 : 0}%`}}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
