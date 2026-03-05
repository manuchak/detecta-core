import React from 'react';
import { ServiceCardSpecialEvent } from './ServiceCardSpecialEvent';
import type { BoardService } from '@/hooks/useBitacoraBoard';

interface BoardColumnEventoEspecialProps {
  services: BoardService[];
  onCerrar: (eventoId: string) => void;
  isPending: boolean;
}

export const BoardColumnEventoEspecial: React.FC<BoardColumnEventoEspecialProps> = ({ services, onCerrar, isPending }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2 px-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Evento Especial</h3>
        <span className="text-[10px] text-muted-foreground/70 font-mono">{services.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {services.length === 0 ? (
          <div className="text-xs text-muted-foreground/50 text-center py-8">
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
