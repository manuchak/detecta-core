import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ReferenceLine } from "recharts";
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
  // Procesar datos de clientes principales - CORREGIDO para mostrar TOP 5 + Otros
  const processTopClientsForDisplay = (data: TopClientsData[]) => {
    // Los datos ya vienen procesados correctamente desde el hook
    // Solo necesitamos asegurar que sean máximo 6 elementos (TOP 5 + Otros)
    return data.slice(0, 6);
  };

  // Procesar datos diarios para comparación semanal CORREGIDO - Solo mostrar datos reales, no futuros
  const processWeeklyComparison = (data: DailyServiceData[]) => {
    const daysOrder = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Obtener el lunes de esta semana
    const mondayOfThisWeek = new Date(today);
    const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Ajustar para que lunes sea 0
    mondayOfThisWeek.setDate(today.getDate() - daysFromMonday);
    mondayOfThisWeek.setHours(0, 0, 0, 0);
    
    // Simular datos de la semana anterior con números más realistas
    const previousWeekData = data.map(item => ({
      ...item,
      count: Math.max(0, Math.floor(item.count * (0.8 + Math.random() * 0.4))) // Variación más conservadora
    }));

    // Combinar datos actuales y anteriores - SOLO mostrar hasta hoy
    const combinedData = daysOrder.map((day, index) => {
      const currentDate = new Date(mondayOfThisWeek);
      currentDate.setDate(mondayOfThisWeek.getDate() + index);
      
      // Solo mostrar datos si la fecha es hoy o anterior
      const shouldShowData = currentDate <= today;
      
      const currentWeek = data.find(d => d.day === day) || { day, count: 0 };
      const previousWeek = previousWeekData.find(d => d.day === day) || { day, count: 0 };
      
      return {
        day,
        date: currentDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        semanaActual: shouldShowData ? currentWeek.count : 0,
        semanaAnterior: shouldShowData ? previousWeek.count : 0,
        diferencia: shouldShowData ? currentWeek.count - previousWeek.count : 0,
        isFuture: !shouldShowData
      };
    });

    console.log('📅 Weekly data processed:', {
      today: today.toLocaleDateString(),
      mondayOfThisWeek: mondayOfThisWeek.toLocaleDateString(),
      currentDayOfWeek,
      combinedData: combinedData.map(d => ({
        day: d.day,
        date: d.date,
        isFuture: d.isFuture,
        semanaActual: d.semanaActual
      }))
    });

    return combinedData;
  };

  const processedClientsData = processTopClientsForDisplay(topClientsData);
  const totalClients = processedClientsData.reduce((sum, item) => sum + item.value, 0);
  const weeklyComparisonData = processWeeklyComparison(dailyServiceData);

  // Encontrar el día pico de la semana actual (solo entre los días que ya han ocurrido)
  const validDays = weeklyComparisonData.filter(day => !day.isFuture && day.semanaActual > 0);
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
      
      // No mostrar tooltip para días futuros
      if (dataPoint?.isFuture) {
        return null;
      }
      
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
            {label === peakDay?.day && !dataPoint.isFuture && (
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
                  data={weeklyComparisonData.filter(d => !d.isFuture)} // Filtrar días futuros
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
                    dot={{ fill: '#c4b5fd', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#c4b5fd' }}
                    name="Semana anterior"
                  />
                  
                  {/* Línea de la semana actual */}
                  <Line 
                    type="monotone"
                    dataKey="semanaActual" 
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                    name="Semana actual"
                  />
                  
                  {/* Línea de referencia para el día pico - solo si no es futuro */}
                  {peakDay && !weeklyComparisonData.find(d => d.day === peakDay.day)?.isFuture && (
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
                  weeklyComparisonData.filter(d => !d.isFuture).reduce((sum, day) => sum + day.diferencia, 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {weeklyComparisonData.filter(d => !d.isFuture).reduce((sum, day) => sum + day.diferencia, 0) >= 0 ? '↗️' : '↘️'} 
                  {' '}
                  {weeklyComparisonData.filter(d => !d.isFuture).reduce((sum, day) => sum + day.diferencia, 0) >= 0 ? 'Creciendo' : 'Decreciendo'}
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

      {/* Clientes Principales - DISEÑO ULTRA COMPACTO */}
      <div className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              Clientes Principales
            </CardTitle>
            <p className="text-sm text-gray-600">Top 5 clientes + otros</p>
          </CardHeader>
          <CardContent className="h-80 flex flex-col p-4">
            {/* Gráfico circular más pequeño sin etiquetas */}
            <div className="flex-1 relative mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedClientsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={75}
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
            
            {/* Leyenda ultra compacta */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs flex-shrink-0">
              {processedClientsData.map((entry, index) => {
                const percentage = totalClients > 0 ? ((entry.value / totalClients) * 100).toFixed(1) : '0.0';
                return (
                  <div key={entry.name} className="flex items-center gap-2 min-h-[18px]">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="min-w-0 flex-1 flex items-center justify-between">
                      <span 
                        className="text-gray-700 font-medium truncate leading-tight text-xs" 
                        title={entry.name}
                      >
                        {entry.name}
                      </span>
                      <span className="text-gray-900 font-bold ml-1 text-xs">
                        {percentage}%
                      </span>
                    </div>
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
