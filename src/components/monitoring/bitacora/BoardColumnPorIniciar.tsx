import React from 'react';
import { ServiceCardPending } from './ServiceCardPending';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import type { BoardService } from '@/hooks/useBitacoraBoard';

interface BoardColumnPorIniciarProps {
  services: BoardService[];
  onIniciar: (id: string) => void;
  isPending: boolean;
}

export const BoardColumnPorIniciar: React.FC<BoardColumnPorIniciarProps> = ({ services, onIniciar, isPending }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Por Iniciar</h3>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{services.length}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {services.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8">
            Sin servicios pendientes
          </div>
        ) : (
          services.map(s => (
            <ServiceCardPending key={s.id} service={s} onIniciar={onIniciar} isPending={isPending} />
          ))
        )}
      </div>
    </div>
  );
};
