import { useNavigate } from "react-router-dom";
import { AlertTriangle, MessageSquareWarning, ChevronRight } from "lucide-react";
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
  
  // Simplified severity styles - solid backgrounds, better contrast
  const getSeverityStyles = () => {
    if (isCritical) {
      return {
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800/50",
        iconColor: "text-red-500",
        accentColor: "text-red-600 dark:text-red-400",
        badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
      };
    }
    if (isWarning) {
      return {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800/50",
        iconColor: "text-amber-500",
        accentColor: "text-amber-600 dark:text-amber-400",
        badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
      };
    }
    return {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800/50",
      iconColor: "text-blue-500",
      accentColor: "text-blue-600 dark:text-blue-400",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
    };
  };

  const styles = getSeverityStyles();

  const getTitle = () => {
    if (isCritical) return "Ticket requiere atención urgente";
    if (isWarning) return "Tienes un ticket pendiente";
    return "Ticket abierto";
  };

  const getTimeAgo = () => {
    return formatDistanceToNow(new Date(oldestTicket.created_at), { 
      locale: es, 
      addSuffix: true 
    });
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
        "w-full rounded-2xl p-4 border text-left transition-all active:scale-[0.98]",
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon - simplified, no circle */}
        {isCritical ? (
          <AlertTriangle className={cn("w-6 h-6 flex-shrink-0 mt-0.5", styles.iconColor)} />
        ) : (
          <MessageSquareWarning className={cn("w-6 h-6 flex-shrink-0 mt-0.5", styles.iconColor)} />
        )}
        
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-foreground">
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
          
          {/* Subject */}
          <p className={cn("text-sm font-medium mt-1 line-clamp-1", styles.accentColor)}>
            {oldestTicket.subject}
          </p>
          
          {/* Meta info */}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="font-medium">#{oldestTicket.ticket_number}</span>
            <span>•</span>
            <span>Abierto {getTimeAgo()}</span>
          </div>
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
};

export default PendingTicketAlert;
