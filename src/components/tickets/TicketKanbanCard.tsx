import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { type TicketEnhanced } from "@/hooks/useTicketsEnhanced";
import { SLAProgressBar } from "./SLAProgressBar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageCircle, Clock, AlertTriangle, User } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TicketKanbanCardProps {
  ticket: TicketEnhanced;
  onClick: () => void;
}

const priorityConfig = {
  alta: { label: "Alta", className: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400" },
  urgente: { label: "Urgente", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400" },
};

export const TicketKanbanCard = ({ ticket, onClick }: TicketKanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket.id,
    data: { ticket },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const custodianName = ticket.custodio?.nombre || ticket.customer_name || ticket.custodio_telefono || "Sin nombre";
  const lastActivity = ticket.updated_at
    ? formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: es })
    : null;

  const isNeedsReply = ticket.needsReply === "needs_agent_reply";
  const isAwaitingCustodian = ticket.needsReply === "awaiting_custodian";
  const showPriority = ticket.priority === "alta" || ticket.priority === "urgente";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group rounded-lg border bg-card p-3 cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        isDragging && "opacity-50 shadow-lg rotate-2 z-50",
        isNeedsReply && "border-l-[3px] border-l-orange-500",
        ticket.sla.estadoGeneral === "vencido" && "border-l-[3px] border-l-destructive"
      )}
    >
      {/* SLA Bar */}
      <div className="mb-2">
        <SLAProgressBar
          status={ticket.sla.estadoGeneral as any}
          percentage={ticket.sla.porcentajeConsumidoResolucion}
          remainingMinutes={ticket.sla.tiempoRestanteResolucion}
          compact
        />
      </div>

      {/* Ticket number + Priority */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
        {showPriority && (
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", priorityConfig[ticket.priority]?.className)}>
            {priorityConfig[ticket.priority]?.label}
          </Badge>
        )}
      </div>

      {/* Subject */}
      <p className="text-sm font-medium leading-tight line-clamp-2 mb-2">{ticket.subject}</p>

      {/* Needs reply indicator */}
      {isNeedsReply && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
          <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">
            Esperando tu respuesta
          </span>
        </div>
      )}
      {isAwaitingCustodian && !["resuelto", "cerrado"].includes(ticket.status) && (
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            Esperando respuesta del custodio
          </span>
        </div>
      )}

      {/* Footer: Custodian + time */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-[11px] text-muted-foreground truncate">{custodianName}</span>
        </div>
        {lastActivity && (
          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
            {lastActivity}
          </span>
        )}
      </div>

      {/* Category tag */}
      {ticket.categoria_custodio?.nombre && (
        <div className="mt-1.5">
          <span
            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
          >
            {ticket.categoria_custodio.icono && <span>{ticket.categoria_custodio.icono}</span>}
            {ticket.categoria_custodio.nombre}
          </span>
        </div>
      )}
    </div>
  );
};
