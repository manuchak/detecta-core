
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Calendar, Map, MessageSquare, ArrowUp, ArrowDown, ChartBar, CircleDollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

// Sample data for the charts (to be replaced with Supabase data)
const monthlyGmvData = [
  { name: "Ene", value: 245000, previousYear: 220000 },
  { name: "Feb", value: 312000, previousYear: 280000 },
  { name: "Mar", value: 298000, previousYear: 310000 },
  { name: "Abr", value: 340000, previousYear: 290000 },
  { name: "May", value: 290000, previousYear: 260000 },
  { name: "Jun", value: 380000, previousYear: 310000 },
  { name: "Jul", value: 430000, previousYear: 340000 },
  { name: "Ago", value: 390000, previousYear: 370000 },
  { name: "Sep", value: 480000, previousYear: 380000 },
  { name: "Oct", value: 520000, previousYear: 410000 },
  { name: "Nov", value: 470000, previousYear: 430000 },
  { name: "Dic", value: 510000, previousYear: 460000 }
];

const serviceStatusData = [
  { name: "En Proceso", value: 35 },
  { name: "Completados", value: 45 },
  { name: "Cancelados", value: 10 },
  { name: "Retrasados", value: 10 }
];

const serviceTypesData = [
  { name: "Local", value: 65 },
  { name: "Foráneo", value: 35 }
];

const dailyServiceData = [
  { day: "Lun", count: 35 },
  { day: "Mar", count: 28 },
  { day: "Mié", count: 42 },
  { day: "Jue", count: 38 },
  { day: "Vie", count: 45 },
  { day: "Sáb", count: 24 },
  { day: "Dom", count: 18 }
];

const topClientsData = [
  { name: "Astra Zeneca", value: 28 },
  { name: "Puma", value: 22 },
  { name: "Siegfried Rhein", value: 18 },
  { name: "Bimbo", value: 12 },
  { name: "Otros", value: 20 }
];

export const Dashboard = () => {
  const [servicesData, setServicesData] = useState({
    totalServices: 142,
    completedServices: 89,
    ongoingServices: 38,
    cancelledServices: 15,
    totalGMV: 876183,
    averageServiceValue: 6170,
    activeClients: 62,
    yearlyGrowth: 12.5
  });
  
  const [timeframe, setTimeframe] = useState("month");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const { toast } = useToast();

  // Fetch data from Supabase (placeholder for now)
  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        // This would be replaced with actual Supabase queries
        // const { data, error } = await supabase
        //   .from('servicios_custodia')
        //   .select('*')
        
        // if (error) throw error;
        // Process data and update state...
        
      } catch (error) {
        console.error('Error fetching service data:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de servicios",
          variant: "destructive"
        });
      }
    };
    
    fetchServicesData();
  }, [toast, timeframe, serviceTypeFilter]);

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-0 animate-fade-in">
      <div className="py-6">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Rendimiento de Servicios
        </p>
      </div>
      
      {/* Timeframe and service type filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2 items-center">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 items-center">
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los servicios</SelectItem>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="foraneo">Foráneo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Key metrics cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Servicios</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{servicesData.totalServices}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">{servicesData.yearlyGrowth}%</span> desde el mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">GMV Total</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(servicesData.totalGMV)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">21%</span> desde el mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{servicesData.activeClients}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">3.3%</span> desde el mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(servicesData.averageServiceValue)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">5%</span> desde el mes anterior
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 card-apple">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Rendimiento de GMV</CardTitle>
            <CardDescription>Comparación mensual con año anterior</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyGmvData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => value >= 1000 ? `$${value/1000}K` : `$${value}`} 
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'GMV']}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  name="2025"
                  strokeWidth={2} 
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="previousYear" 
                  stroke="#94a3b8" 
                  name="2024"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
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
                    data={serviceStatusData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid horizontal strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Porcentaje" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="numbers">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-primary mr-2"></div>
                        <p className="text-sm">Completados</p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm font-medium">{servicesData.completedServices}</p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {Math.round((servicesData.completedServices / servicesData.totalServices) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{width: `${(servicesData.completedServices / servicesData.totalServices) * 100}%`}}
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
                        <p className="text-sm font-medium">{servicesData.ongoingServices}</p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {Math.round((servicesData.ongoingServices / servicesData.totalServices) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{width: `${(servicesData.ongoingServices / servicesData.totalServices) * 100}%`}}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                        <p className="text-sm">Retrasados</p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm font-medium">12</p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {Math.round((12 / servicesData.totalServices) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-amber-500" 
                        style={{width: `${(12 / servicesData.totalServices) * 100}%`}}
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
                        <p className="text-sm font-medium">{servicesData.cancelledServices}</p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {Math.round((servicesData.cancelledServices / servicesData.totalServices) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-destructive" 
                        style={{width: `${(servicesData.cancelledServices / servicesData.totalServices) * 100}%`}}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Secondary charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="card-apple">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Servicios Diarios</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dailyServiceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Servicios" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="card-apple">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Tipos de Servicios</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={serviceTypesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid horizontal strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Porcentaje" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="card-apple">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Clientes Principales</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={topClientsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid horizontal strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Servicios" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card className="card-apple mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Meta de GMV Anual</CardTitle>
          <CardDescription>
            Progreso actual: {formatCurrency(servicesData.totalGMV)} / {formatCurrency(1200000)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progreso</span>
              <span className="text-sm font-medium">{Math.round((servicesData.totalGMV / 1200000) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                style={{width: `${(servicesData.totalGMV / 1200000) * 100}%`}}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
