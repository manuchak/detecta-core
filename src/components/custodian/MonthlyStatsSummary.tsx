import { TrendingUp, TrendingDown, MapPin, DollarSign, Star, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlyStatsSummaryProps {
  serviciosEsteMes: number;
  serviciosMesAnterior?: number;
  kmRecorridos: number;
  ingresosTotales: number;
  ratingPromedio?: number;
  showRating?: boolean;
}

const MonthlyStatsSummary = ({
  serviciosEsteMes,
  serviciosMesAnterior = 0,
  kmRecorridos,
  ingresosTotales,
  ratingPromedio = 4.5,
  showRating = false,
}: MonthlyStatsSummaryProps) => {
  const serviciosDiff = serviciosMesAnterior > 0 
    ? Math.round(((serviciosEsteMes - serviciosMesAnterior) / serviciosMesAnterior) * 100) 
    : 0;
  const isPositive = serviciosDiff >= 0;

  const allStats = [
    {
      icon: Briefcase,
      value: serviciosEsteMes,
      label: "Servicios",
      sublabel: "este mes",
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      trend: serviciosDiff !== 0 ? { value: serviciosDiff, positive: isPositive } : null,
      id: 'servicios',
    },
    {
      icon: MapPin,
      value: kmRecorridos.toLocaleString(),
      label: "Kilómetros",
      sublabel: "recorridos",
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      id: 'km',
    },
    {
      icon: DollarSign,
      value: `$${(ingresosTotales / 1000).toFixed(1)}K`,
      label: "Ingresos",
      sublabel: "totales",
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      id: 'ingresos',
    },
    {
      icon: Star,
      value: ratingPromedio.toFixed(1),
      label: "Rating",
      sublabel: "promedio",
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      id: 'rating',
    },
  ];

  const stats = showRating ? allStats : allStats.filter(s => s.id !== 'rating');

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={cn(
            "rounded-2xl p-4 border transition-all",
            stat.bgColor,
            stat.borderColor
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={cn("w-5 h-5", stat.color)} />
            {stat.trend && (
              <span className={cn(
                "text-xs font-medium flex items-center gap-0.5",
                stat.trend.positive ? "text-green-600" : "text-red-600"
              )}>
                {stat.trend.positive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(stat.trend.value)}%
              </span>
            )}
          </div>
          <p className={cn("text-3xl font-bold mb-0.5", stat.color)}>
            {stat.value}
          </p>
          <p className="text-xs text-muted-foreground">
            {stat.label} <span className="opacity-70">{stat.sublabel}</span>
          </p>
        </div>
      ))}
    </div>
  );
};

export default MonthlyStatsSummary;
