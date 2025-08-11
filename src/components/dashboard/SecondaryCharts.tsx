import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ReferenceLine } from "recharts";
import { ServiceTypesData, TopClientsData } from "@/hooks/useDashboardData";
import { DailyServiceData } from "@/types/serviciosMonitoreo";

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
  // Procesar datos de clientes principales - TOP 5 por GMV + Otros
  const processTopClientsForDisplay = (data: TopClientsData[]) => {
    // Los datos ya vienen procesados correctamente desde el hook
    // Solo necesitamos asegurar que sean máximo 6 elementos (TOP 5 + Otros)
    return data.slice(0, 6);
  };

  // Procesar datos diarios para mostrar solo servicios finalizados hasta hoy
  const processWeeklyComparison = (data: DailyServiceData[]) => {
    console.log('🔄 Procesando datos diarios para mostrar en tarjeta:', data);
    
    // Los datos ya vienen con la comparación de semana anterior desde dashboardCalculations
    const result = data.map(item => ({
      day: item.day,
      date: item.date,
      semanaActual: item.count,
      semanaAnterior: item.previousWeekCount || 0,
      diferencia: item.count - (item.previousWeekCount || 0)
    }));

    console.log('🔄 Datos procesados para tarjeta:', result);
    return result;
  };

  const processedClientsData = processTopClientsForDisplay(topClientsData);
  const totalClients = processedClientsData.reduce((sum, item) => sum + item.value, 0);
  const weeklyComparisonData = processWeeklyComparison(dailyServiceData);

  // Encontrar el día pico de la semana actual
  const validDays = weeklyComparisonData.filter(day => day.semanaActual > 0);
  const peakDay = validDays.length > 0 
    ? validDays.reduce((max, day) => day.semanaActual > max.semanaActual ? day : max, validDays[0])
    : weeklyComparisonData[0];

  // Obtener rango de semana para mostrar en el header
  const today = new Date();
  const weekStart = new Date(today);
  const daysFromMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
  weekStart.setDate(today.getDate() - daysFromMonday);
  
  const weekRange = `${weekStart.toLocaleDateString('es-ES')} - ${today.toLocaleDateString('es-ES')}`;

  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = weeklyComparisonData.find(d => d.day === label);
      
      const currentWeek = payload.find((p: any) => p.dataKey === 'semanaActual')?.value || 0;
      const previousWeek = payload.find((p: any) => p.dataKey === 'semanaAnterior')?.value || 0;
      const difference = currentWeek - previousWeek;
      const percentageChange = previousWeek > 0 ? ((difference / previousWeek) * 100).toFixed(1) : 'N/A';
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[220px]">
          <div className="font-semibold text-gray-900 mb-1">{label}</div>
          {dataPoint?.date && (
            <div className="text-sm text-gray-600 mb-2">{dataPoint.date}</div>
          )}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                <span className="text-sm text-gray-700">Semana actual:</span>
              </div>
              <span className="font-semibold text-purple-600">{currentWeek}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-300"></div>
                <span className="text-sm text-gray-700">Semana anterior:</span>
              </div>
              <span className="font-semibold text-purple-300">{previousWeek}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cambio:</span>
                <span className={`font-semibold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {difference >= 0 ? '+' : ''}{difference} ({percentageChange}%)
                </span>
              </div>
            </div>
            {label === peakDay?.day && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                <span className="text-xs text-yellow-800 font-medium">🏆 Día pico de la semana</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Tooltip personalizado mejorado para clientes con mejor información
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = totalClients > 0 ? ((payload[0].value / totalClients) * 100).toFixed(1) : '0.0';
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[180px]">
          <p className="font-semibold text-gray-900 mb-1">{payload[0].name}</p>
          <div className="space-y-1">
            <p className="text-blue-600 text-sm">
              <span className="font-medium">{payload[0].value}</span> servicios
            </p>
            <p className="text-gray-600 text-sm">
              <span className="font-bold">{percentage}%</span> del total
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Función para renderizar etiquetas en el gráfico circular
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, index
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
        className="drop-shadow-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
      {/* Servicios Diarios - Optimizado para mejor uso del espacio */}
      <div className="lg:col-span-4">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              Servicios Diarios
            </CardTitle>
            <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
              Semana: {weekRange}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                <span>Semana actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-300"></div>
                <span>Semana anterior</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-4 min-h-0">
            <div className="flex-1 min-h-0 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={weeklyComparisonData} // Ahora solo contiene días válidos
                  margin={{ top: 20, right: 25, left: 15, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    fontSize={12}
                    stroke="#64748b"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    fontSize={12} 
                    stroke="#64748b"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomLineTooltip />} />
                  
                  {/* Línea de la semana anterior */}
                  <Line 
                    type="monotone"
                    dataKey="semanaAnterior" 
                    stroke="#c4b5fd"
                    strokeWidth={2}
                    dot={(props) => {
                      // Solo mostrar punto si hay datos
                      if (props.payload?.semanaAnterior > 0) {
                        return <circle cx={props.cx} cy={props.cy} r={4} fill="#c4b5fd" strokeWidth={2} />;
                      }
                      return null;
                    }}
                    activeDot={{ r: 6, fill: '#c4b5fd' }}
                    name="Semana anterior"
                    connectNulls={false}
                  />
                  
                  {/* Línea de la semana actual */}
                  <Line 
                    type="monotone"
                    dataKey="semanaActual"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={(props) => {
                      // Solo mostrar punto si hay datos reales en la semana actual
                      if (props.payload?.semanaActual !== null && props.payload?.semanaActual !== undefined) {
                        return <circle cx={props.cx} cy={props.cy} r={5} fill="#8b5cf6" strokeWidth={2} />;
                      }
                      return null;
                    }}
                    activeDot={{ r: 7, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                    name="Semana actual"
                    connectNulls={false}
                  />
                  
                  {/* Línea de referencia para el día pico */}
                  {peakDay && (
                    <ReferenceLine 
                      x={peakDay.day} 
                      stroke="#fbbf24" 
                      strokeDasharray="2 2"
                      label={{ value: "Pico", fontSize: 10, fill: "#f59e0b" }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Estadísticas compactas en la parte inferior */}
            <div className="grid grid-cols-2 gap-3 text-sm flex-shrink-0">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-600 text-xs mb-1">Día pico</div>
                <div className="font-semibold text-purple-600">
                  {peakDay ? `${peakDay.day} (${peakDay.semanaActual})` : 'N/A'}
                  {peakDay?.date && <div className="text-gray-500 text-xs mt-1">{peakDay.date}</div>}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-600 text-xs mb-1">Tendencia semanal</div>
                <div className={`font-semibold ${
                  (() => {
                    // Solo comparar días transcurridos (que tienen datos reales)
                    const daysWithData = weeklyComparisonData.filter(day => day.semanaActual !== null);
                    const totalCurrentWeek = daysWithData.reduce((sum, day) => sum + (day.semanaActual || 0), 0);
                    const totalPreviousWeek = daysWithData.reduce((sum, day) => sum + day.semanaAnterior, 0);
                    const difference = totalCurrentWeek - totalPreviousWeek;
                    const percentageChange = totalPreviousWeek > 0 ? ((difference / totalPreviousWeek) * 100) : 0;
                    
                    return difference >= 0 ? 'text-green-600' : 'text-red-600';
                  })()
                }`}>
                  {(() => {
                    // Calcular tendencia solo para días transcurridos
                    const daysWithData = weeklyComparisonData.filter(day => day.semanaActual !== null);
                    const totalCurrentWeek = daysWithData.reduce((sum, day) => sum + (day.semanaActual || 0), 0);
                    const totalPreviousWeek = daysWithData.reduce((sum, day) => sum + day.semanaAnterior, 0);
                    const difference = totalCurrentWeek - totalPreviousWeek;
                    const percentageChange = totalPreviousWeek > 0 ? ((difference / totalPreviousWeek) * 100) : 0;
                    
                    const trend = difference >= 0 ? '↗️ Creciendo' : '↘️ Decreciendo';
                    const percentage = `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(1)}%`;
                    
                    return `${trend} ${percentage}`;
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de Servicios - Altura optimizada */}
      <div className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              Tipos de Servicios
            </CardTitle>
            <p className="text-sm text-gray-600">Distribución por tipo</p>
          </CardHeader>
          <CardContent className="h-80">
            {serviceTypesData && serviceTypesData.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={serviceTypesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={75}
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
                
                <div className="space-y-2 mt-1">
                  {serviceTypesData.map((item, index) => {
                    const color = SERVICE_TYPE_COLORS[item.name as keyof typeof SERVICE_TYPE_COLORS] || '#6b7280';
                    return (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-14 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${item.value}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-900 w-7 text-right">
                            {item.value}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clientes Principales - DISEÑO MEJORADO */}
      <div className="lg:col-span-4">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              Clientes Principales
            </CardTitle>
            <p className="text-sm text-gray-600">Top 5 clientes por GMV del mes</p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
            {/* Gráfico circular - altura controlada */}
            <div className="flex-1 min-h-[200px] max-h-[220px] mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedClientsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={70}
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
            </div>
            
            {/* Leyenda mejorada con scroll si es necesario */}
            <div className="flex-shrink-0 space-y-2 overflow-y-auto max-h-32">
              {processedClientsData.map((entry, index) => {
                const percentage = totalClients > 0 ? ((entry.value / totalClients) * 100).toFixed(1) : '0.0';
                return (
                  <div key={entry.name} className="flex items-center justify-between gap-2 min-h-[20px]">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span 
                        className="text-sm font-medium text-gray-700 truncate leading-tight max-w-[120px]" 
                        title={entry.name}
                      >
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
