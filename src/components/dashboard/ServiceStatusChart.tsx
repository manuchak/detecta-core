
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceStatusData, DashboardMetrics } from "@/hooks/useDashboardData";

interface ServiceStatusChartProps {
  data: ServiceStatusData[];
  metrics: DashboardMetrics;
}

// Configuración de colores y estilos para cada estado
const STATUS_CONFIG = {
  'Completado': { 
    color: '#10b981', 
    bgGradient: 'from-emerald-50 to-emerald-100',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    icon: '✅'
  },
  'En Proceso': { 
    color: '#3b82f6', 
    bgGradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: '🔄'
  },
  'Pendiente': { 
    color: '#f59e0b', 
    bgGradient: 'from-amber-50 to-amber-100',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    icon: '⏳'
  },
  'Cancelado': { 
    color: '#ef4444', 
    bgGradient: 'from-red-50 to-red-100',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    icon: '❌'
  }
};

export const ServiceStatusChart = ({ data, metrics }: ServiceStatusChartProps) => {
  // Mapear los datos con la configuración correcta
  const statusItems = [
    { name: 'Completado', value: metrics.completedServices, key: 'Completado' },
    { name: 'En Proceso', value: metrics.ongoingServices, key: 'En Proceso' },
    { name: 'Pendiente', value: metrics.pendingServices, key: 'Pendiente' },
    { name: 'Cancelado', value: metrics.cancelledServices, key: 'Cancelado' }
  ];

  const getConfig = (key: string) => {
    return STATUS_CONFIG[key as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['Completado'];
  };

  const totalServices = metrics.totalServices || 1; // Evitar división por cero

  return (
    <Card className="lg:col-span-1 h-[500px] bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-6 border-b border-gray-100">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
          Estado de Servicios
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 h-[420px]">
        {/* Grid principal con las tarjetas de estado */}
        <div className="grid grid-cols-2 gap-4 h-full">
          {statusItems.map((item, index) => {
            const config = getConfig(item.key);
            const percentage = Math.round((item.value / totalServices) * 100) || 0;
            
            return (
              <div 
                key={index} 
                className={`relative overflow-hidden rounded-2xl border-2 ${config.borderColor} bg-gradient-to-br ${config.bgGradient} p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group`}
              >
                {/* Fondo decorativo */}
                <div 
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20 transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: config.color }}
                ></div>
                
                {/* Contenido de la tarjeta */}
                <div className="relative z-10 h-full flex flex-col justify-between">
                  {/* Header con icono */}
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transform transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: config.color }}
                    >
                      <span className="text-xl">{config.icon}</span>
                    </div>
                    <div className={`text-right ${config.textColor}`}>
                      <p className="text-sm font-medium opacity-80">Estado</p>
                    </div>
                  </div>
                  
                  {/* Nombre del estado */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-800 leading-tight">
                      {item.name}
                    </h3>
                  </div>
                  
                  {/* Número principal */}
                  <div className="mb-4">
                    <p 
                      className="text-4xl font-black mb-1 transition-colors duration-300"
                      style={{ color: config.color }}
                    >
                      {item.value}
                    </p>
                    <p className="text-sm font-semibold text-gray-500">
                      {percentage}% del total
                    </p>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>0</span>
                      <span>{totalServices}</span>
                    </div>
                    <div className="h-2 bg-white/80 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full transition-all duration-1000 ease-out rounded-full relative"
                        style={{ 
                          backgroundColor: config.color,
                          width: `${percentage}%`,
                          boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.3)`
                        }}
                      >
                        {/* Efecto de brillo */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Resumen total en la parte inferior */}
        <div className="mt-6 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-xl border border-slate-200 p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1 font-medium">Total de Servicios</p>
            <p className="text-2xl font-bold text-gray-900">{totalServices}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
