import { useState } from "react";
import { ChevronDown, ChevronRight, Package } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Service {
  id_servicio: string;
  nombre_cliente: string;
  fecha_hora_cita: string;
  cobro_cliente?: number;
  estado: string;
}

interface RecentServicesCollapsibleProps {
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

const RecentServicesCollapsible = ({ services, onViewAll, onSelectService }: RecentServicesCollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (services.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 text-center">
        <Package className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Sin servicios recientes</p>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold text-foreground">
              Historial de Servicios
            </span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {services.length}
            </span>
          </div>
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
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
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-muted text-center">
                    <span className="text-sm font-bold text-foreground leading-none">
                      {format(serviceDate, 'd')}
                    </span>
                    <span className="text-[9px] uppercase text-muted-foreground">
                      {format(serviceDate, 'MMM', { locale: es })}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {service.nombre_cliente}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(serviceDate, { addSuffix: true, locale: es })}
                    </p>
                  </div>

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
                </button>
              );
            })}
          </div>

          <button 
            onClick={onViewAll}
            className="w-full px-4 py-3 text-sm text-primary font-medium flex items-center justify-center gap-1 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            Ver todo el historial
            <ChevronRight className="w-4 h-4" />
          </button>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default RecentServicesCollapsible;
