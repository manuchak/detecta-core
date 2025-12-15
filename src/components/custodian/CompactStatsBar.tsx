import { Briefcase, MapPin, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactStatsBarProps {
  serviciosEsteMes: number;
  kmRecorridos: number;
  ingresosTotales: number;
}

const CompactStatsBar = ({ serviciosEsteMes, kmRecorridos, ingresosTotales }: CompactStatsBarProps) => {
  const stats = [
    {
      icon: Briefcase,
      value: serviciosEsteMes,
      label: "Servicios",
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: MapPin,
      value: kmRecorridos >= 1000 ? `${(kmRecorridos / 1000).toFixed(1)}K` : kmRecorridos,
      label: "Km",
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: DollarSign,
      value: ingresosTotales >= 1000 ? `${(ingresosTotales / 1000).toFixed(1)}K` : ingresosTotales,
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
            <span className={cn("text-xl font-bold", stat.color)}>
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
