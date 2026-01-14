/**
 * ConflictSection - Collapsible section showing custodians with conflicts
 * Allows override assignment with justification
 */

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CustodioPerformanceCard } from '@/components/planeacion/CustodioPerformanceCard';
import type { CustodioConProximidad } from '@/hooks/useProximidadOperacional';

interface ConflictSectionProps {
  custodians: CustodioConProximidad[];
  onOverrideSelect: (custodio: CustodioConProximidad) => void;
}

export function ConflictSection({
  custodians,
  onOverrideSelect,
}: ConflictSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (custodians.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Ver {custodians.length} custodio{custodians.length > 1 ? 's' : ''} con conflicto</span>
            <span className="text-xs text-muted-foreground">(override disponible)</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-3 space-y-3">
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            ⚠️ Estos custodios tienen conflictos de horario. Puedes asignarlos con justificación para auditoría.
          </p>
        </div>

        {custodians.map((custodio) => (
          <div key={custodio.id} className="relative">
            <CustodioPerformanceCard
              custodio={custodio as any}
              compact
              disabled
              availabilityStatus="no_disponible"
              unavailableReason={custodio.razon_no_disponible}
            />

            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
              onClick={() => onOverrideSelect(custodio)}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Asignar con justificación
            </Button>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
