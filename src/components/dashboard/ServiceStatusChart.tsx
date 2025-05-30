
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceStatusData, DashboardMetrics } from "@/hooks/useDashboardData";

interface ServiceStatusChartProps {
  data: ServiceStatusData[];
  metrics: DashboardMetrics;
}

export const ServiceStatusChart = ({ data, metrics }: ServiceStatusChartProps) => {
  return (
    <Card className="lg:col-span-3 card-apple">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Estado de Servicios</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <Tabs defaultValue="chart">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Gráfico</TabsTrigger>
            <TabsTrigger value="numbers">Números</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid horizontal strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Cantidad" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="numbers">
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-sm">Completados</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium">{metrics.completedServices}</p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {metrics.totalServices > 0 ? Math.round((metrics.completedServices / metrics.totalServices) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{width: `${metrics.totalServices > 0 ? (metrics.completedServices / metrics.totalServices) * 100 : 0}%`}}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                    <p className="text-sm">En proceso</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium">{metrics.ongoingServices}</p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {metrics.totalServices > 0 ? Math.round((metrics.ongoingServices / metrics.totalServices) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{width: `${metrics.totalServices > 0 ? (metrics.ongoingServices / metrics.totalServices) * 100 : 0}%`}}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                    <p className="text-sm">Pendientes</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium">{metrics.pendingServices}</p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {metrics.totalServices > 0 ? Math.round((metrics.pendingServices / metrics.totalServices) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{width: `${metrics.totalServices > 0 ? (metrics.pendingServices / metrics.totalServices) * 100 : 0}%`}}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-destructive mr-2"></div>
                    <p className="text-sm">Cancelados</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium">{metrics.cancelledServices}</p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {metrics.totalServices > 0 ? Math.round((metrics.cancelledServices / metrics.totalServices) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-destructive" 
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
