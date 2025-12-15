import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { CustodianTicket } from '@/hooks/useCustodianTicketsEnhanced';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketResolvedCelebrationProps {
  ticket: CustodianTicket;
  onComplete: () => void;
}

const TicketResolvedCelebration = ({ ticket, onComplete }: TicketResolvedCelebrationProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after checkmark animation
    const contentTimer = setTimeout(() => setShowContent(true), 600);
    // Auto-advance to CSAT modal
    const completeTimer = setTimeout(onComplete, 2500);
    
    return () => {
      clearTimeout(contentTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const resolvedAgo = formatDistanceToNow(new Date(ticket.updated_at), { 
    addSuffix: true, 
    locale: es 
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="text-center px-6 max-w-sm">
        {/* Animated checkmark */}
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-scale-in">
            <CheckCircle2 className="w-12 h-12 text-white animate-check-draw" />
          </div>
        </div>

        {/* Text content */}
        <div className={`space-y-3 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-2xl font-bold text-foreground">
            ¡Buenas noticias!
          </h2>
          <p className="text-lg text-muted-foreground">
            Tu queja fue resuelta
          </p>
          
          <div className="bg-muted/50 rounded-xl p-4 mt-4">
            <p className="text-sm font-medium text-foreground mb-1">
              {ticket.categoria?.nombre}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {ticket.subject}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Resuelto {resolvedAgo}
            </p>
          </div>

          <p className="text-sm text-muted-foreground animate-pulse mt-4">
            Cuéntanos tu experiencia...
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketResolvedCelebration;
