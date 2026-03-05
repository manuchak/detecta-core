import React from 'react';
import { ServiceCardPending } from './ServiceCardPending';
import type { BoardService } from '@/hooks/useBitacoraBoard';

interface BoardColumnPorIniciarProps {
  services: BoardService[];
  onIniciar: (id: string) => void;
  onDoubleClick?: (service: BoardService) => void;
  isPending: boolean;
}

export const BoardColumnPorIniciar: React.FC<BoardColumnPorIniciarProps> = ({ services, onIniciar, onDoubleClick, isPending }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2 px-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Por Iniciar</h3>
        <span className="text-[10px] text-muted-foreground/70 font-mono">{services.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {services.length === 0 ? (
          <div className="text-xs text-muted-foreground/50 text-center py-8">
            Sin servicios pendientes
          </div>
        ) : (
          services.map(s => (
            <ServiceCardPending key={s.id} service={s} onIniciar={onIniciar} onDoubleClick={onDoubleClick} isPending={isPending} />
          ))
        )}
      </div>
    </div>
  );
};
