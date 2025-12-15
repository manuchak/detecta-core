import { ChevronRight, Star } from 'lucide-react';
import { CustodianTicket } from '@/hooks/useCustodianTicketsEnhanced';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SimpleTicketCardProps {
  ticket: CustodianTicket;
  onClick: () => void;
}

const statusConfig: Record<string, { label: string; color: string; emoji: string }> = {
  abierto: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', emoji: '🟡' },
  en_progreso: { label: 'En proceso', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', emoji: '🔵' },
  resuelto: { label: 'Resuelto', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', emoji: '🟢' },
  cerrado: { label: 'Cerrado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400', emoji: '⚪' },
};

export const SimpleTicketCard = ({ ticket, onClick }: SimpleTicketCardProps) => {
  const status = statusConfig[ticket.status] || statusConfig.abierto;
  const timeAgo = formatDistanceToNow(new Date(ticket.created_at), { 
    addSuffix: true, 
    locale: es 
  });

  const needsRating = ticket.status === 'resuelto' && ticket.calificacion_csat === null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full bg-card border rounded-2xl p-4 text-left transition-all active:scale-[0.98] touch-manipulation",
        needsRating 
          ? "border-green-500/50 hover:border-green-500 ring-2 ring-green-500/20" 
          : "border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status emoji */}
        <span className="text-2xl">{status.emoji}</span>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category and status */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-foreground">
              {ticket.categoria?.nombre || 'Sin categoría'}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              status.color
            )}>
              {status.label}
            </span>
            {needsRating && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-pulse">
                <Star className="w-3 h-3" />
                Calificar
              </span>
            )}
          </div>
          
          {/* Description preview */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {ticket.description || ticket.subject}
          </p>
          
          {/* Footer info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>#{ticket.ticket_number}</span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </button>
  );
};