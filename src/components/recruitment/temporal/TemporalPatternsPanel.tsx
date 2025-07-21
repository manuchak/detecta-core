import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useTemporalPatternAnalysis } from "@/hooks/useTemporalPatternAnalysis";
import { Calendar, TrendingUp, Clock, Target, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export const TemporalPatternsPanel = () => {
  const { temporalAnalysis, seasonalForecast, recruitmentTiming, isLoading } = useTemporalPatternAnalysis();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Análisis Temporal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Cargando análisis temporal...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!temporalAnalysis || !seasonalForecast || !recruitmentTiming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Análisis Temporal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No hay datos suficientes para el análisis temporal.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Análisis de Patrones Temporales
          </CardTitle>
          <CardDescription>
            Predicciones basadas en análisis histórico y tendencias estacionales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="forecasts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="forecasts">Pronósticos</TabsTrigger>
              <TabsTrigger value="patterns">Patrones</TabsTrigger>
              <TabsTrigger value="timing">Timing Óptimo</TabsTrigger>
            </TabsList>

            <TabsContent value="forecasts" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {seasonalForecast.map((forecast) => (
                  <Card key={forecast.zona_id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        {forecast.zona_nombre}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Próximo mes</span>
                        <Badge variant="secondary">
                          {forecast.next_month_demand} servicios
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Próximo trimestre</span>
                        <Badge variant="outline">
                          {forecast.next_quarter_demand} servicios
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Confianza</span>
                          <span>{Math.round(forecast.confidence_level * 100)}%</span>
                        </div>
                        <Progress value={forecast.confidence_level * 100} className="h-2" />
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Factor estacional: {forecast.seasonal_multiplier.toFixed(2)}x
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              {temporalAnalysis.map((pattern) => (
                <Card key={pattern.zona_id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{pattern.zona_nombre}</CardTitle>
                    <CardDescription>
                      Crecimiento anual: {pattern.yearly_growth > 0 ? '+' : ''}{pattern.yearly_growth.toFixed(1)}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium mb-3">Tendencias Estacionales</h4>
                        <div className="space-y-2">
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={[
                              { quarter: 'Q1', value: pattern.seasonal_trends.Q1 },
                              { quarter: 'Q2', value: pattern.seasonal_trends.Q2 },
                              { quarter: 'Q3', value: pattern.seasonal_trends.Q3 },
                              { quarter: 'Q4', value: pattern.seasonal_trends.Q4 },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="quarter" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="hsl(var(--primary))" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-3">Análisis Mensual</h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-muted-foreground">Meses Pico:</span>
                            <div className="flex gap-1 mt-1">
                              {pattern.peak_months.map((month) => (
                                <Badge key={month} variant="default" className="text-xs">
                                  {getMonthName(month)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-sm text-muted-foreground">Meses Bajos:</span>
                            <div className="flex gap-1 mt-1">
                              {pattern.low_months.map((month) => (
                                <Badge key={month} variant="secondary" className="text-xs">
                                  {getMonthName(month)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {pattern.monthly_patterns.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-3">Evolución Histórica</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={pattern.monthly_patterns.slice(-12)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey={(item) => `${getMonthName(item.month)} ${item.year}`}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis />
                            <Tooltip 
                              labelFormatter={(label, payload) => {
                                if (payload && payload[0]) {
                                  const data = payload[0].payload;
                                  return `${getMonthName(data.month)} ${data.year}`;
                                }
                                return label;
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="services_count" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              name="Servicios"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="timing" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recruitmentTiming.map((timing) => (
                  <Card key={timing.zona_id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        {temporalAnalysis.find(p => p.zona_id === timing.zona_id)?.zona_nombre}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Iniciar en {timing.optimal_start_weeks} semanas</div>
                          <div className="text-xs text-muted-foreground">
                            Tiempo de ejecución: {timing.estimated_lead_time} semanas
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            Intensidad: 
                            <Badge 
                              variant={timing.recruitment_intensity === 'high' ? 'destructive' : 
                                     timing.recruitment_intensity === 'medium' ? 'default' : 'secondary'}
                              className="ml-2"
                            >
                              {timing.recruitment_intensity === 'high' ? 'Alta' :
                               timing.recruitment_intensity === 'medium' ? 'Media' : 'Baja'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Demanda pico</div>
                          <div className="text-xs text-muted-foreground">
                            {timing.peak_demand_period}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const getMonthName = (month: number): string => {
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  return months[month - 1] || month.toString();
};