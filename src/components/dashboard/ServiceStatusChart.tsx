
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceStatusData, DashboardMetrics } from "@/hooks/useDashboardData";
import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";

interface ServiceStatusChartProps {
  data: ServiceStatusData[];
  metrics: DashboardMetrics;
}

// Configuración limpia para cada estado
const STATUS_CONFIG = {
  'Completado': { 
    color: '#10b981', 
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    icon: CheckCircle
  },
  'En Proceso': { 
    color: '#3b82f6', 
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: Clock
  },
  'Pendiente': { 
    color: '#f59e0b', 
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    icon: AlertCircle
  },
  'Cancelado': { 
    color: '#ef4444', 
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    icon: XCircle
  }
};

export const ServiceStatusChart = ({ data, metrics }: ServiceStatusChartProps) => {
  const statusItems = [
    { name: 'Completado', value: metrics.completedServices, key: 'Completado' },
    { name: 'En Proceso', value: metrics.ongoingServices, key: 'En Proceso' },
    { name: 'Pendiente', value: metrics.pendingServices, key: 'Pendiente' },
    { name: 'Cancelado', value: metrics.cancelledServices, key: 'Cancelado' }
  ];

  const getConfig = (key: string) => {
    return STATUS_CONFIG[key as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['Completado'];
  };

  const totalServices = metrics.totalServices || 1;

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          Estado de Servicios
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-2 gap-4">
          {statusItems.map((item) => {
            const config = getConfig(item.key);
            const percentage = Math.round((item.value / totalServices) * 100) || 0;
            const IconComponent = config.icon;
            
            return (
              <div 
                key={item.key}
                className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 transition-all duration-200 hover:shadow-md`}
              >
                {/* Header con icono y título */}
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: config.color + '20' }}
                  >
                    <IconComponent 
                      size={20} 
                      style={{ color: config.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {percentage}%
                  </span>
                </div>
                
                {/* Título del estado */}
                <h3 className="text-sm font-medium text-gray-800 mb-2">
                  {item.name}
                </h3>
                
                {/* Número principal */}
                <div className="mb-3">
                  <span 
                    className="text-2xl font-bold"
                    style={{ color: config.color }}
                  >
                    {item.value}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    servicios
                  </span>
                </div>
                
                {/* Barra de progreso */}
                <div className="w-full bg-white/80 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      backgroundColor: config.color,
                      width: `${percentage}%`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Resumen total */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Total de Servicios</p>
          <p className="text-xl font-bold text-gray-900">{totalServices}</p>
        </div>
      </CardContent>
    </Card>
  );
};
