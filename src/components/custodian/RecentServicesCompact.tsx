import { ChevronRight, Package } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Service {
  id_servicio: string;
  nombre_cliente: string;
  fecha_hora_cita: string;
  cobro_cliente?: number;
  estado: string;
}

interface RecentServicesCompactProps {
  services: Service[];
  onViewAll: () => void;
  onSelectService?: (service: Service) => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  completado: { bg: 'bg-green-500/10', text: 'text-green-600' },
  finalizado: { bg: 'bg-green-500/10', text: 'text-green-600' },
  Completado: { bg: 'bg-green-500/10', text: 'text-green-600' },
  Finalizado: { bg: 'bg-green-500/10', text: 'text-green-600' },
  pendiente: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  Pendiente: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  cancelado: { bg: 'bg-red-500/10', text: 'text-red-600' },
  Cancelado: { bg: 'bg-red-500/10', text: 'text-red-600' },
};

const RecentServicesCompact = ({ services, onViewAll, onSelectService }: RecentServicesCompactProps) => {
  if (services.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">Sin servicios recientes</p>
        <p className="text-sm text-muted-foreground/70">Los servicios aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-muted/30">
        <span className="font-semibold text-foreground">Servicios Recientes</span>
        <button 
          onClick={onViewAll}
          className="text-sm text-primary font-medium flex items-center gap-1"
        >
          Ver historial
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Services list */}
      <div className="divide-y divide-border">
        {services.slice(0, 5).map((service) => {
          const serviceDate = new Date(service.fecha_hora_cita);
          const colors = statusColors[service.estado] || { bg: 'bg-muted', text: 'text-muted-foreground' };
          
          return (
            <button
              key={service.id_servicio}
              onClick={() => onSelectService?.(service)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
            >
              {/* Date badge */}
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-muted text-center">
                <span className="text-lg font-bold text-foreground leading-none">
                  {format(serviceDate, 'd')}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground">
                  {format(serviceDate, 'MMM', { locale: es })}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">
                  {service.nombre_cliente}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(serviceDate, { addSuffix: true, locale: es })}
                </p>
              </div>

              {/* Amount & Status */}
              <div className="text-right">
                {service.cobro_cliente && (
                  <p className="font-semibold text-green-600 text-sm">
                    ${service.cobro_cliente.toLocaleString()}
                  </p>
                )}
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-medium",
                  colors.bg, colors.text
                )}>
                  {service.estado}
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RecentServicesCompact;
