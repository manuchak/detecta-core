
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Truck, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MapPin,
  RefreshCw,
  Calendar,
  PauseCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { DashboardMetrics } from "@/hooks/useDashboardDataCorrected";
import { useFormatters } from "@/hooks/useFormatters";

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  isLoading: boolean;
}

export const MetricsCards = ({ metrics, isLoading }: MetricsCardsProps) => {
  const { formatCurrency } = useFormatters();
  
  // Función para determinar el color y ícono basado en el tipo de métrica y crecimiento
  const getTrendIndicator = (growth: number, metricType: 'revenue' | 'services' | 'clients' | 'percentage') => {
    const isPositive = growth > 0;
    const isNegative = growth < 0;
    const isNeutral = growth === 0;
    
    // Para métricas donde el aumento es bueno (ingresos, servicios, clientes)
    const isGoodMetric = ['revenue', 'services', 'clients'].includes(metricType);
    
    // Para porcentajes, depende del contexto
    let colorClass = '';
    let bgColorClass = '';
    let icon = Minus;
    
    if (isNeutral) {
      colorClass = 'text-gray-600';
      bgColorClass = 'bg-gray-100';
      icon = Minus;
    } else if (metricType === 'percentage') {
      // Para porcentajes, usar colores neutrales informativos
      colorClass = isPositive ? 'text-blue-600' : 'text-orange-600';
      bgColorClass = isPositive ? 'bg-blue-50' : 'bg-orange-50';
      icon = isPositive ? ArrowUp : ArrowDown;
    } else {
      // Para métricas de negocio
      const isGoodChange = isGoodMetric ? isPositive : isNegative;
      
      if (isGoodChange) {
        colorClass = 'text-green-600';
        bgColorClass = 'bg-green-50';
        icon = isPositive ? ArrowUp : ArrowDown;
      } else {
        colorClass = 'text-red-600';
        bgColorClass = 'bg-red-50';
        icon = isPositive ? ArrowUp : ArrowDown;
      }
    }
    
    return { colorClass, bgColorClass, icon };
  };
  
  const formatTrend = (growth: number, type: 'percentage' | 'growth' = 'growth', metricType: 'revenue' | 'services' | 'clients' | 'percentage' = 'percentage') => {
    if (type === 'percentage') {
      return `${growth}% del total`;
    }
    
    const { colorClass, bgColorClass, icon: Icon } = getTrendIndicator(growth, metricType);
    const absGrowth = Math.abs(growth);
    const sign = growth >= 0 ? '+' : '';
    
    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${bgColorClass}`}>
        <Icon className={`h-3 w-3 ${colorClass}`} />
        <span className={`text-sm font-medium ${colorClass}`}>
          {sign}{absGrowth}%
        </span>
        <span className="text-xs text-gray-500">vs anterior</span>
      </div>
    );
  };
  
  const cards = [
    {
      title: "Total de Servicios",
      value: metrics.totalServices.toLocaleString(),
      icon: Truck,
      color: "bg-blue-500",
      description: "Servicios totales registrados",
      trend: formatTrend(metrics.totalServicesGrowth, 'growth', 'services'),
      metricType: 'services' as const
    },
    {
      title: "Ingresos Totales",
      value: formatCurrency(metrics.totalGMV),
      icon: DollarSign,
      color: "bg-green-500", 
      description: "GMV de servicios finalizados",
      trend: formatTrend(metrics.totalGMVGrowth, 'growth', 'revenue'),
      metricType: 'revenue' as const
    },
    {
      title: "Clientes Activos",
      value: metrics.activeClients.toLocaleString(),
      icon: Users,
      color: "bg-purple-500",
      description: "Clientes con servicios finalizados",
      trend: formatTrend(metrics.activeClientsGrowth, 'growth', 'clients'),
      metricType: 'clients' as const
    },
    {
      title: "Valor Promedio",
      value: formatCurrency(metrics.averageServiceValue),
      icon: TrendingUp,
      color: "bg-orange-500",
      description: "Por servicio finalizado",
      trend: formatTrend(metrics.averageServiceValueGrowth, 'growth', 'revenue'),
      metricType: 'revenue' as const
    },
    {
      title: "Finalizados",
      value: metrics.completedServices.toLocaleString(),
      icon: CheckCircle,
      color: "bg-emerald-500",
      description: "Servicios completados exitosamente",
      trend: formatTrend(metrics.completedServicesPercentage, 'percentage'),
      metricType: 'percentage' as const
    },
    {
      title: "En Ruta/Destino",
      value: metrics.ongoingServices.toLocaleString(),
      icon: MapPin,
      color: "bg-blue-600",
      description: "En ruta, destino o punto origen",
      trend: formatTrend(metrics.ongoingServicesPercentage, 'percentage'),
      metricType: 'percentage' as const
    },
    {
      title: "Programados",
      value: metrics.pendingServices.toLocaleString(),
      icon: Calendar,
      color: "bg-amber-500",
      description: "Servicios programados y en espera",
      trend: formatTrend(metrics.pendingServicesPercentage, 'percentage'),
      metricType: 'percentage' as const
    },
    {
      title: "Cancelados",
      value: metrics.cancelledServices.toLocaleString(),
      icon: XCircle,
      color: "bg-red-500",
      description: "Servicios cancelados",
      trend: formatTrend(metrics.cancelledServicesPercentage, 'percentage'),
      metricType: 'percentage' as const
    }
  ];
  
  return (
    <div className="w-full">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[200px]">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${card.color}`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-6 pt-6">
                <CardTitle className="text-sm font-medium text-slate-600 leading-tight">
                  {card.title}
                </CardTitle>
                <div className={`p-3 rounded-lg ${card.color} bg-opacity-10 flex-shrink-0`}>
                  <Icon className={`h-6 w-6 text-white ${card.color.replace('bg-', 'text-')}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <div className="text-3xl font-bold text-slate-900">
                  {isLoading ? (
                    <div className="h-10 w-20 bg-slate-200 animate-pulse rounded"></div>
                  ) : (
                    <div className="break-words">{card.value}</div>
                  )}
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {card.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {typeof card.trend === 'string' ? (
                      <p className="text-sm font-medium text-slate-700">
                        {card.trend}
                      </p>
                    ) : (
                      card.trend
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
