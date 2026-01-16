/**
 * CustodianList - Renders the list of available custodians
 * Supports collapsing when a custodian is selected to reduce visual noise
 */

import { useState, useEffect } from 'react';
import { Loader2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  onReportUnavailability?: (custodio: CustodioConProximidad) => void;
}

export function CustodianList({
  custodians,
  isLoading,
  selectedId,
  highlightedIndex,
  comunicaciones,
  onSelect,
  onContact,
  onReportUnavailability,
}: CustodianListProps) {
  // Auto-collapse when a custodian is selected
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  useEffect(() => {
    if (selectedId) {
      setIsCollapsed(true);
    }
  }, [selectedId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">Cargando custodios...</p>
      </div>
    );
  }

  // Empty state is now handled by NoCustodiansAlert in parent
  // This component just renders nothing when empty
  if (custodians.length === 0) {
    return null;
  }

  // When collapsed, show a toggle button
  if (isCollapsed && selectedId) {
    const otherCount = custodians.filter(c => c.id !== selectedId).length;
    
    return (
      <Button
        variant="ghost"
        className="w-full justify-between h-auto py-3 px-4 text-muted-foreground hover:text-foreground"
        onClick={() => setIsCollapsed(false)}
      >
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Ver otros {otherCount} custodios disponibles
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Collapse toggle when expanded with selection */}
      {selectedId && !isCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-muted-foreground hover:text-foreground"
          onClick={() => setIsCollapsed(true)}
        >
          <span>Ocultar lista</span>
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}
      
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
            onReportUnavailability={onReportUnavailability ? () => onReportUnavailability(custodio) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
