import { useNavigate } from "react-router-dom";
import { AlertTriangle, MessageSquareWarning, Clock, ChevronRight, Ticket } from "lucide-react";
import { CustodianTicket } from "@/hooks/useCustodianTicketsEnhanced";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface PendingTicketAlertProps {
  tickets: CustodianTicket[];
  onViewTicket?: (ticket: CustodianTicket) => void;
}

interface TicketWithAge extends CustodianTicket {
  diasAbierto: number;
}

const PendingTicketAlert = ({ tickets, onViewTicket }: PendingTicketAlertProps) => {
  const navigate = useNavigate();
  
  // Calculate days open for each ticket and sort by age
  const ticketsWithAge: TicketWithAge[] = tickets
    .filter(t => t.status === 'abierto' || t.status === 'en_progreso')
    .map(ticket => {
      const createdDate = new Date(ticket.created_at);
      const now = new Date();
      const diasAbierto = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return { ...ticket, diasAbierto };
    })
    .sort((a, b) => b.diasAbierto - a.diasAbierto);

  if (ticketsWithAge.length === 0) return null;

  const oldestTicket = ticketsWithAge[0];
  const isCritical = oldestTicket.diasAbierto >= 5;
  const isWarning = oldestTicket.diasAbierto >= 2 && oldestTicket.diasAbierto < 5;
  
  // Determine severity level
  const getSeverityStyles = () => {
    if (isCritical) {
      return {
        bg: "bg-gradient-to-r from-destructive/15 to-red-500/10",
        border: "border-destructive/30",
        icon: "bg-destructive/20",
        iconColor: "text-destructive",
        titleColor: "text-destructive",
        textColor: "text-destructive/80",
        badgeColor: "bg-destructive/20 text-destructive"
      };
    }
    if (isWarning) {
      return {
        bg: "bg-gradient-to-r from-amber-500/15 to-yellow-500/10",
        border: "border-amber-500/30",
        icon: "bg-amber-500/20",
        iconColor: "text-amber-600",
        titleColor: "text-amber-700",
        textColor: "text-amber-600/80",
        badgeColor: "bg-amber-500/20 text-amber-700"
      };
    }
    return {
      bg: "bg-gradient-to-r from-blue-500/10 to-primary/10",
      border: "border-blue-500/20",
      icon: "bg-blue-500/20",
      iconColor: "text-blue-600",
      titleColor: "text-blue-700",
      textColor: "text-blue-600/80",
      badgeColor: "bg-blue-500/20 text-blue-700"
    };
  };

  const styles = getSeverityStyles();

  const getTitle = () => {
    if (isCritical) return "⚠️ Ticket requiere atención urgente";
    if (isWarning) return "Tienes un ticket pendiente";
    return "Ticket abierto";
  };

  const getSubtitle = () => {
    const timeAgo = formatDistanceToNow(new Date(oldestTicket.created_at), { 
      locale: es, 
      addSuffix: true 
    });
    return `Abierto ${timeAgo}`;
  };

  const handleClick = () => {
    if (onViewTicket) {
      onViewTicket(oldestTicket);
    } else {
      navigate('/custodian/support');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full rounded-2xl p-5 border text-left transition-all active:scale-[0.98]",
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0",
          styles.icon
        )}>
          {isCritical ? (
            <AlertTriangle className={cn("w-7 h-7", styles.iconColor)} />
          ) : (
            <MessageSquareWarning className={cn("w-7 h-7", styles.iconColor)} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className={cn("text-lg font-bold", styles.titleColor)}>
              {getTitle()}
            </h3>
            {ticketsWithAge.length > 1 && (
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                styles.badgeColor
              )}>
                +{ticketsWithAge.length - 1} más
              </span>
            )}
          </div>
          
          <p className={cn("text-base font-medium mb-1 line-clamp-1", styles.textColor)}>
            {oldestTicket.subject}
          </p>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <Ticket className={cn("w-3.5 h-3.5", styles.iconColor)} />
              <span className={cn("font-medium", styles.textColor)}>
                #{oldestTicket.ticket_number}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Clock className={cn("w-3.5 h-3.5", styles.iconColor)} />
              <span className={cn(styles.textColor)}>
                {getSubtitle()}
              </span>
            </div>
            
            <ChevronRight className={cn("w-4 h-4 ml-auto", styles.iconColor)} />
          </div>
        </div>
      </div>
    </button>
  );
};

export default PendingTicketAlert;
