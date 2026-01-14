/**
 * CustodianList - Renders the list of available custodians
 */

import { Loader2, Users } from 'lucide-react';
import { CustodianCard } from './CustodianCard';
import type { CustodioConProximidad } from '@/hooks/useProximidadOperacional';
import type { CustodianCommunicationState } from '../types';

interface CustodianListProps {
  custodians: CustodioConProximidad[];
  isLoading: boolean;
  selectedId: string;
  highlightedIndex: number;
  comunicaciones: Record<string, CustodianCommunicationState>;
  onSelect: (custodio: CustodioConProximidad) => void;
  onContact: (custodio: CustodioConProximidad, method: 'whatsapp' | 'llamada') => void;
}

export function CustodianList({
  custodians,
  isLoading,
  selectedId,
  highlightedIndex,
  comunicaciones,
  onSelect,
  onContact,
}: CustodianListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">Cargando custodios...</p>
      </div>
    );
  }

  if (custodians.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">No hay custodios disponibles</p>
        <p className="text-xs mt-1">Intenta ajustar los filtros de búsqueda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
      {custodians.map((custodio, index) => (
        <CustodianCard
          key={custodio.id}
          custodio={custodio}
          selected={selectedId === custodio.id}
          highlighted={highlightedIndex === index}
          comunicacion={comunicaciones[custodio.id]}
          onSelect={() => onSelect(custodio)}
          onContact={(method) => onContact(custodio, method)}
        />
      ))}
    </div>
  );
}
