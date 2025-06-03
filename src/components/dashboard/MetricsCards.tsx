
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
  PauseCircle
} from "lucide-react";
import { DashboardMetrics } from "@/hooks/useDashboardDataCorrected";
import { useFormatters } from "@/hooks/useFormatters";

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  isLoading: boolean;
}

export const MetricsCards = ({ metrics, isLoading }: MetricsCardsProps) => {
  const { formatCurrency } = useFormatters();
  
  const formatTrend = (growth: number, type: 'percentage' | 'growth' = 'growth') => {
    if (type === 'percentage') {
      return `${growth}% del total`;
    }
    
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth}% vs período anterior`;
  };
  
  const cards = [
    {
      title: "Total de Servicios",
      value: metrics.totalServices,
      icon: Truck,
      color: "bg-blue-500",
      description: "Servicios totales registrados",
      trend: formatTrend(metrics.totalServicesGrowth)
    },
    {
      title: "Ingresos Totales",
      value: formatCurrency(metrics.totalGMV),
      icon: DollarSign,
      color: "bg-green-500", 
      description: "Facturación acumulada",
      trend: formatTrend(metrics.totalGMVGrowth)
    },
    {
      title: "Clientes Activos",
      value: metrics.activeClients,
      icon: Users,
      color: "bg-purple-500",
      description: "Clientes con servicios",
      trend: formatTrend(metrics.activeClientsGrowth)
    },
    {
      title: "Valor Promedio",
      value: formatCurrency(metrics.averageServiceValue),
      icon: TrendingUp,
      color: "bg-orange-500",
      description: "Por servicio realizado",
      trend: formatTrend(metrics.averageServiceValueGrowth)
    },
    {
      title: "Finalizados",
      value: metrics.completedServices,
      icon: CheckCircle,
      color: "bg-emerald-500",
      description: "Servicios completados exitosamente",
      trend: formatTrend(metrics.completedServicesPercentage, 'percentage')
    },
    {
      title: "En Ruta/Destino",
      value: metrics.ongoingServices,
      icon: MapPin,
      color: "bg-blue-600",
      description: "En ruta, destino o punto origen",
      trend: formatTrend(metrics.ongoingServicesPercentage, 'percentage')
    },
    {
      title: "Programados",
      value: metrics.pendingServices,
      icon: Calendar,
      color: "bg-amber-500",
      description: "Servicios programados y en espera",
      trend: formatTrend(metrics.pendingServicesPercentage, 'percentage')
    },
    {
      title: "Cancelados",
      value: metrics.cancelledServices,
      icon: XCircle,
      color: "bg-red-500",
      description: "Servicios cancelados",
      trend: formatTrend(metrics.cancelledServicesPercentage, 'percentage')
    }
  ];
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute top-0 left-0 w-full h-1 ${card.color}`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 leading-tight">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.color} bg-opacity-10`}>
                <Icon className={`h-5 w-5 text-white ${card.color.replace('bg-', 'text-')}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-slate-900">
                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div>
                ) : (
                  card.value
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 leading-tight">
                  {card.description}
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {card.trend}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
