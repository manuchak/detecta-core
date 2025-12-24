import { PartyPopper, ChevronRight, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustodianTicket } from '@/hooks/useCustodianTicketsEnhanced';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ResolvedTicketAlertProps {
  tickets: CustodianTicket[];
  onViewTicket: (ticket: CustodianTicket) => void;
  onDismiss: (ticketId: string) => void;
}

const ResolvedTicketAlert = ({ tickets, onViewTicket, onDismiss }: ResolvedTicketAlertProps) => {
  // Only show tickets that were actually resolved by an agent (not just closed by the user)
  // The backend now correctly only marks tickets as 'resuelto' when an agent resolves them
  if (tickets.length === 0) return null;
  
  const latestTicket = tickets[0];
  const hasMultiple = tickets.length > 1;

  return (
    <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 animate-fade-in">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce-subtle">
              <PartyPopper className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-bold text-green-800 dark:text-green-200 text-lg">
                ¡Buenas noticias!
              </h3>
              <p className="text-sm text-green-700/80 dark:text-green-300/80">
                {hasMultiple 
                  ? `${tickets.length} quejas resueltas`
                  : 'Tu queja fue resuelta'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={() => onDismiss(latestTicket.id)}
            className="p-1 rounded-full hover:bg-green-500/20 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-green-600/60" />
          </button>
        </div>

        {/* Ticket preview */}
        <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              #{latestTicket.ticket_number}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(latestTicket.updated_at), { addSuffix: true, locale: es })}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground line-clamp-1">
            {latestTicket.categoria?.nombre || 'Sin categoría'}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {latestTicket.subject}
          </p>
        </div>

        {/* CTA */}
        <Button
          onClick={() => onViewTicket(latestTicket)}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
        >
          Ver y calificar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>

        {hasMultiple && (
          <p className="text-center text-xs text-green-700/60 dark:text-green-300/60 mt-2">
            +{tickets.length - 1} más por revisar
          </p>
        )}
      </div>
    </Card>
  );
};

export default ResolvedTicketAlert;
