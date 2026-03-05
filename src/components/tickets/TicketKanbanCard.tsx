import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { type TicketEnhanced } from "@/hooks/useTicketsEnhanced";
import { SLAProgressBar } from "./SLAProgressBar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, User, Phone } from "lucide-react";
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

  const rawName = ticket.custodio?.nombre || ticket.customer_name || ticket.custodio_telefono || "Sin nombre";
  const isPhoneOnly = !ticket.custodio?.nombre && !ticket.customer_name && !!ticket.custodio_telefono;
  const displayName = isPhoneOnly && rawName.replace(/\D/g, '').length >= 10
    ? rawName.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4')
    : rawName;

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
        "group rounded-lg border bg-card p-2.5 cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        isDragging && "opacity-50 shadow-lg rotate-2 z-50",
        isNeedsReply && "border-l-[3px] border-l-orange-500",
        ticket.sla.estadoGeneral === "vencido" && "border-l-[3px] border-l-destructive"
      )}
    >
      {/* Row 1: SLA + Ticket # + Priority */}
      <div className="flex items-center gap-1.5 mb-1">
        <SLAProgressBar
          status={ticket.sla.estadoGeneral as any}
          percentage={ticket.sla.porcentajeConsumidoResolucion}
          remainingMinutes={ticket.sla.tiempoRestanteResolucion}
          compact
        />
        <span className="text-[11px] font-mono text-muted-foreground ml-auto">{ticket.ticket_number}</span>
        {showPriority && (
          <Badge variant="outline" className={cn("text-[11px] px-1.5 py-0 shrink-0", priorityConfig[ticket.priority]?.className)}>
            {priorityConfig[ticket.priority]?.label}
          </Badge>
        )}
      </div>

      {/* Row 2: Subject */}
      <p className="text-sm font-medium leading-tight line-clamp-2 mb-1">{ticket.subject}</p>

      {/* Row 3: Reply indicator (conditional) */}
      {isNeedsReply && (
        <div className="flex items-center gap-1 mb-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500" />
          </span>
          <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">
            Esperando tu respuesta
          </span>
        </div>
      )}
      {isAwaitingCustodian && !["resuelto", "cerrado"].includes(ticket.status) && (
        <div className="flex items-center gap-1 mb-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            Esperando respuesta del custodio
          </span>
        </div>
      )}

      {/* Row 4: Custodian name (prominent) */}
      <div className="flex items-center gap-1.5 mt-1">
        {isPhoneOnly ? (
          <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <User className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-foreground truncate">{displayName}</span>
      </div>

      {/* Row 5: Category · Time (subtle) */}
      {(ticket.categoria_custodio?.nombre || lastActivity) && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
          {ticket.categoria_custodio?.nombre && (
            <span className="truncate max-w-[140px]">{ticket.categoria_custodio.nombre}</span>
          )}
          {ticket.categoria_custodio?.nombre && lastActivity && <span>·</span>}
          {lastActivity && (
            <span className="whitespace-nowrap">{lastActivity}</span>
          )}
        </div>
      )}
    </div>
  );
};
