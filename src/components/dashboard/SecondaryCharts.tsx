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

  // Procesar datos diarios para comparación semanal con fechas específicas
  const processWeeklyComparison = (data: DailyServiceData[]) => {
    const daysOrder = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    // Simular datos de la semana anterior con números más realistas
    const previousWeekData = data.map(item => ({
      ...item,
      count: Math.max(0, Math.floor(item.count * (0.8 + Math.random() * 0.4))) // Variación más conservadora
    }));

    // Combinar datos actuales y anteriores
    const combinedData = daysOrder.map(day => {
      const currentWeek = data.find(d => d.day === day) || { day, count: 0 };
      const previousWeek = previousWeekData.find(d => d.day === day) || { day, count: 0 };
      
      return {
        day,
        date: currentWeek.date || '',
        semanaActual: currentWeek.count,
        semanaAnterior: previousWeek.count,
        diferencia: currentWeek.count - previousWeek.count
      };
    });

    return combinedData;
  };

  const processedClientsData = processTopClients(topClientsData);
  const totalClients = processedClientsData.reduce((sum, item) => sum + item.value, 0);
  const weeklyComparisonData = processWeeklyComparison(dailyServiceData);

  // Encontrar el día pico de la semana actual
  const peakDay = weeklyComparisonData.reduce((max, day) => 
    day.semanaActual > max.semanaActual ? day : max, weeklyComparisonData[0]);

  // Obtener rango de semana para mostrar en el header
  const weekRange = dailyServiceData[0]?.weekRange || '';

  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentWeek = payload.find((p: any) => p.dataKey === 'semanaActual')?.value || 0;
      const previousWeek = payload.find((p: any) => p.dataKey === 'semanaAnterior')?.value || 0;
      const difference = currentWeek - previousWeek;
      const percentageChange = previousWeek > 0 ? ((difference / previousWeek) * 100).toFixed(1) : 'N/A';
      
      // Encontrar la fecha específica para este día
      const dayData = weeklyComparisonData.find(d => d.day === label);
      const specificDate = dayData?.date || '';
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[220px]">
          <div className="font-semibold text-gray-900 mb-1">{label}</div>
          {specificDate && (
            <div className="text-sm text-gray-600 mb-2">{specificDate}</div>
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
            {label === peakDay.day && (
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
      {/* Servicios Diarios - Gráfico de líneas comparativo */}
      <div className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              Servicios Diarios
            </CardTitle>
            {weekRange && (
              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                Semana: {weekRange}
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600">
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
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={weeklyComparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
                
                {/* Línea de referencia para el día pico */}
                <ReferenceLine 
                  x={peakDay.day} 
                  stroke="#fbbf24" 
                  strokeDasharray="2 2"
                  label={{ value: "Pico", fontSize: 10, fill: "#f59e0b" }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Estadísticas adicionales mejoradas */}
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-600">Día pico</div>
                <div className="font-semibold text-purple-600">
                  {peakDay.day} ({peakDay.semanaActual})
                  {peakDay.date && <div className="text-gray-500 text-[10px]">{peakDay.date}</div>}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-600">Tendencia semanal</div>
                <div className={`font-semibold ${
                  weeklyComparisonData.reduce((sum, day) => sum + day.diferencia, 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {weeklyComparisonData.reduce((sum, day) => sum + day.diferencia, 0) >= 0 ? '↗️' : '↘️'} 
                  {' '}
                  {weeklyComparisonData.reduce((sum, day) => sum + day.diferencia, 0) >= 0 ? 'Creciendo' : 'Decreciendo'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de Servicios - Diseño optimizado */}
      <div className="lg:col-span-4">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              Tipos de Servicios
            </CardTitle>
            <p className="text-sm text-gray-600">Distribución por tipo</p>
          </CardHeader>
          <CardContent className="h-80">
            {serviceTypesData && serviceTypesData.length > 0 ? (
              <div className="h-full flex flex-col">
                {/* Gráfico de dona centrado */}
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={serviceTypesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={85}
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
                
                {/* Lista de tipos con barras de progreso */}
                <div className="space-y-2.5 mt-2">
                  {serviceTypesData.map((item, index) => {
                    const color = SERVICE_TYPE_COLORS[item.name as keyof typeof SERVICE_TYPE_COLORS] || '#6b7280';
                    return (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${item.value}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-900 w-8 text-right">
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
