import { CheckCircle2, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TicketSuccessScreenProps {
  ticketNumber: string;
  categoryName: string;
  onViewTickets: () => void;
  onGoHome: () => void;
}

export const TicketSuccessScreen = ({
  ticketNumber,
  categoryName,
  onViewTickets,
  onGoHome
}: TicketSuccessScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      {/* Animated checkmark */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
        </div>
        <div className="absolute inset-0 w-28 h-28 rounded-full border-4 border-green-500 animate-ping opacity-20" />
      </div>

      {/* Success message */}
      <h1 className="text-2xl font-bold text-foreground mb-2">
        ¡Queja Enviada!
      </h1>
      <p className="text-muted-foreground text-lg mb-6">
        Tu reporte ha sido recibido
      </p>

      {/* Ticket number */}
      <div className="bg-muted rounded-2xl p-6 mb-6 w-full max-w-xs">
        <p className="text-sm text-muted-foreground mb-1">Tu número de folio:</p>
        <p className="text-3xl font-bold text-primary font-mono tracking-wider">
          {ticketNumber}
        </p>
      </div>

      {/* Category */}
      <p className="text-muted-foreground mb-2">Categoría:</p>
      <p className="font-semibold text-foreground mb-8">{categoryName}</p>

      {/* Response time */}
      <div className="bg-primary/10 rounded-xl p-4 mb-8 w-full max-w-xs">
        <p className="text-sm text-primary font-medium">
          ⏱️ Te responderemos en máximo 24-48 horas
        </p>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-xs space-y-3">
        <Button
          onClick={onViewTickets}
          size="lg"
          className="w-full h-14 text-lg rounded-2xl gap-2"
        >
          Ver Mis Quejas
          <ArrowRight className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={onGoHome}
          variant="outline"
          size="lg"
          className="w-full h-12 rounded-2xl gap-2"
        >
          <Home className="w-5 h-5" />
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
};
