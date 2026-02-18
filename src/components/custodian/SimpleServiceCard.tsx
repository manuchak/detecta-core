import { MapPin, Clock, ChevronRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CustodianService {
  id_servicio: string;
  nombre_cliente: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  estado: string;
  tipo_servicio: string;
  costo_custodio?: number;
}

interface SimpleServiceCardProps {
  service: CustodianService;
  onClick?: () => void;
}

const statusConfig: Record<string, { label: string; emoji: string; bgColor: string }> = {
  completado: { label: "Completado", emoji: "✅", bgColor: "bg-green-500/10" },
  finalizado: { label: "Completado", emoji: "✅", bgColor: "bg-green-500/10" },
  Completado: { label: "Completado", emoji: "✅", bgColor: "bg-green-500/10" },
  Finalizado: { label: "Completado", emoji: "✅", bgColor: "bg-green-500/10" },
  pendiente: { label: "Pendiente", emoji: "🟡", bgColor: "bg-amber-500/10" },
  programado: { label: "Programado", emoji: "📅", bgColor: "bg-blue-500/10" },
  Pendiente: { label: "Pendiente", emoji: "🟡", bgColor: "bg-amber-500/10" },
  Programado: { label: "Programado", emoji: "📅", bgColor: "bg-blue-500/10" },
  en_proceso: { label: "En camino", emoji: "🚗", bgColor: "bg-purple-500/10" },
  cancelado: { label: "Cancelado", emoji: "❌", bgColor: "bg-red-500/10" },
};

const SimpleServiceCard = ({ service, onClick }: SimpleServiceCardProps) => {
  const config = statusConfig[service.estado] || { 
    label: service.estado, 
    emoji: "📋", 
    bgColor: "bg-muted" 
  };

  const serviceDate = new Date(service.fecha_hora_cita);
  const isUpcoming = serviceDate > new Date();

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]",
        config.bgColor,
        "border border-border/50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status emoji */}
        <div className="text-2xl pt-1">{config.emoji}</div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Client name and time */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-foreground text-base line-clamp-1">
              {service.nombre_cliente}
            </h4>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {isUpcoming 
                ? format(serviceDate, "d MMM, h:mm a", { locale: es })
                : formatDistanceToNow(serviceDate, { addSuffix: true, locale: es })
              }
            </span>
          </div>
          
          {/* Route summary */}
          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
            {service.origen || "Origen"} → {service.destino || "Destino"}
          </p>
          
          {/* Bottom row: type + amount */}
          <div className="flex items-center justify-between">
            <span className="text-xs bg-background/50 px-2 py-1 rounded-full text-muted-foreground">
              {service.tipo_servicio || "Custodia"}
            </span>
            {service.costo_custodio && (
              <span className="text-sm font-semibold text-green-600">
                ${service.costo_custodio.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground mt-2" />
      </div>
    </button>
  );
};

export default SimpleServiceCard;
