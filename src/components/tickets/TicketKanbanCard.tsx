import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { type TicketEnhanced } from "@/hooks/useTicketsEnhanced";
import { SLAProgressBar } from "./SLAProgressBar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageCircle, Clock, AlertTriangle, User, Phone } from "lucide-react";
...
export const TicketKanbanCard = ({ ticket, onClick }: TicketKanbanCardProps) => {
...
  const custodianName = ticket.custodio?.nombre || ticket.customer_name || ticket.custodio_telefono || "Sin nombre";
  const isPhoneOnly = !ticket.custodio?.nombre && !ticket.customer_name && !!ticket.custodio_telefono;
  const displayName = isPhoneOnly && custodianName.replace(/\D/g, '').length >= 10
    ? custodianName.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4')
    : custodianName;
...
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
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
        {ticket.categoria_custodio?.nombre && (
          <span className="truncate max-w-[140px]">{ticket.categoria_custodio.nombre}</span>
        )}
        {ticket.categoria_custodio?.nombre && lastActivity && <span>·</span>}
        {lastActivity && (
          <span className={cn("whitespace-nowrap", !ticket.categoria_custodio?.nombre && "ml-0" )}>{lastActivity}</span>
        )}
      </div>
    </div>
  );
};
