import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { SLAProgressBar } from "./SLAProgressBar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface TicketCardMobileProps {
  ticket: {
    id: string;
    ticket_number: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
    customer_name?: string;
    custodio?: { nombre: string } | null;
    sla: {
      estadoGeneral: 'en_tiempo' | 'proximo_vencer' | 'vencido' | 'cumplido' | 'sin_sla';
      porcentajeConsumidoResolucion: number;
      tiempoRestanteResolucion: number;
    };
    categoria_custodio?: {
      nombre: string;
      departamento_responsable: string;
    } | null;
  };
  onClick: () => void;
}

const priorityConfig = {
  baja: { label: 'Baja', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  media: { label: 'Media', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
};

const statusConfig = {
  abierto: { label: 'Abierto', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
  en_progreso: { label: 'En progreso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  resuelto: { label: 'Resuelto', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
  cerrado: { label: 'Cerrado', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
};

const departmentColors: Record<string, string> = {
  finanzas: 'border-l-emerald-500',
  planeacion: 'border-l-blue-500',
  instaladores: 'border-l-purple-500',
  supply: 'border-l-amber-500',
  soporte: 'border-l-gray-500',
};

export const TicketCardMobile = ({ ticket, onClick }: TicketCardMobileProps) => {
  const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.media;
  const status = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.abierto;
  const dept = ticket.categoria_custodio?.departamento_responsable || 'soporte';
  const borderColor = departmentColors[dept] || 'border-l-gray-300';
  
  const isUrgent = ticket.sla.estadoGeneral === 'vencido' || ticket.sla.estadoGeneral === 'proximo_vencer';

  return (
    <Card 
      className={cn(
        "border-l-4 transition-all duration-200 cursor-pointer hover:shadow-md active:scale-[0.99]",
        borderColor,
        isUrgent && ticket.sla.estadoGeneral === 'vencido' && "bg-red-50/50 dark:bg-red-950/20",
        isUrgent && ticket.sla.estadoGeneral === 'proximo_vencer' && "bg-yellow-50/50 dark:bg-yellow-950/20"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Top Row: SLA + Ticket Number */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {ticket.ticket_number}
            </span>
            <SLAProgressBar
              status={ticket.sla.estadoGeneral}
              percentage={ticket.sla.porcentajeConsumidoResolucion}
              remainingMinutes={ticket.sla.tiempoRestanteResolucion}
              compact
            />
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Subject */}
        <h3 className="font-medium text-sm line-clamp-2 mb-3">
          {ticket.subject}
        </h3>

        {/* Customer + Category */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <User className="h-3.5 w-3.5" />
          <span className="truncate">
            {ticket.custodio?.nombre || ticket.customer_name || 'Sin nombre'}
          </span>
          {ticket.categoria_custodio?.nombre && (
            <>
              <span>•</span>
              <span className="truncate">{ticket.categoria_custodio.nombre}</span>
            </>
          )}
        </div>

        {/* Bottom Row: Badges + Time */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", status.color)}>
              {status.label}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", priority.color)}>
              {priority.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketCardMobile;
