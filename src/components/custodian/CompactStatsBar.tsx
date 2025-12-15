import { Briefcase, MapPin, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactStatsBarProps {
  serviciosEsteMes: number;
  kmRecorridos: number;
  ingresosTotales: number;
}

const formatCompactNumber = (value: number): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 10_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString('es-MX');
};

const CompactStatsBar = ({ serviciosEsteMes, kmRecorridos, ingresosTotales }: CompactStatsBarProps) => {
  const stats = [
    {
      icon: Briefcase,
      value: formatCompactNumber(serviciosEsteMes),
      label: "Servicios",
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: MapPin,
      value: formatCompactNumber(kmRecorridos),
      label: "Km",
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: DollarSign,
      value: formatCompactNumber(ingresosTotales),
      label: "Ingresos",
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="flex gap-2">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={cn(
            "flex-1 rounded-xl p-3 text-center",
            stat.bgColor
          )}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <stat.icon className={cn("w-4 h-4", stat.color)} />
            <span className={cn("text-xl font-bold truncate max-w-full", stat.color)}>
              {stat.value}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default CompactStatsBar;
