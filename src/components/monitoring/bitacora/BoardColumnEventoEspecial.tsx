import React from 'react';
import { ServiceCardSpecialEvent } from './ServiceCardSpecialEvent';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { BoardService } from '@/hooks/useBitacoraBoard';

interface BoardColumnEventoEspecialProps {
  services: BoardService[];
  onCerrar: (eventoId: string) => void;
  isPending: boolean;
}

export const BoardColumnEventoEspecial: React.FC<BoardColumnEventoEspecialProps> = ({ services, onCerrar, isPending }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 px-1">
        <AlertTriangle className="h-4 w-4 text-chart-4" />
        <h3 className="text-sm font-semibold">Evento Especial</h3>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{services.length}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {services.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8">
            Sin eventos activos
          </div>
        ) : (
          services.map(s => (
            <ServiceCardSpecialEvent key={s.id} service={s} onCerrar={onCerrar} isPending={isPending} />
          ))
        )}
      </div>
    </div>
  );
};
