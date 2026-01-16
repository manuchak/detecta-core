/**
 * ConflictSection - Collapsible section showing custodians with conflicts
 * Allows override assignment with justification
 * 
 * CRITICAL: When forceOpen=true, the section auto-expands and shows
 * a prominent message that this is the only option available.
 */

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CustodioPerformanceCard } from '@/components/planeacion/CustodioPerformanceCard';
import type { CustodioConProximidad } from '@/hooks/useProximidadOperacional';

interface ConflictSectionProps {
  custodians: CustodioConProximidad[];
  onOverrideSelect: (custodio: CustodioConProximidad) => void;
  /** When true, section auto-expands (used when all custodians are in conflict) */
  forceOpen?: boolean;
  /** Ref for scrolling into view */
  sectionRef?: React.RefObject<HTMLDivElement>;
}

export function ConflictSection({
  custodians,
  onOverrideSelect,
  forceOpen = false,
  sectionRef,
}: ConflictSectionProps) {
  const [isOpen, setIsOpen] = useState(forceOpen);
  const localRef = useRef<HTMLDivElement>(null);
  const ref = sectionRef || localRef;

  // Auto-open when forceOpen changes to true
  useEffect(() => {
    if (forceOpen && !isOpen) {
      setIsOpen(true);
      // Scroll into view after a brief delay for render
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [forceOpen, isOpen, ref]);

  if (custodians.length === 0) return null;

  return (
    <div ref={ref}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full justify-between hover:bg-amber-50 dark:hover:bg-amber-950/30 ${
              forceOpen 
                ? 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800' 
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>
                {forceOpen ? (
                  <>⚠️ {custodians.length} custodio{custodians.length > 1 ? 's' : ''} con conflicto (única opción)</>
                ) : (
                  <>Ver {custodians.length} custodio{custodians.length > 1 ? 's' : ''} con conflicto</>
                )}
              </span>
              {!forceOpen && (
                <span className="text-xs text-muted-foreground">(override disponible)</span>
              )}
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-3 space-y-3">
          <div className={`p-3 rounded-lg border ${
            forceOpen 
              ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700' 
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
          }`}>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {forceOpen ? (
                <>
                  <strong>⚠️ Todos los custodios tienen conflicto.</strong> Puedes asignar uno con justificación 
                  (ej: viaje de retorno, cliente flexible en horario). La justificación queda registrada para auditoría.
                </>
              ) : (
                <>⚠️ Estos custodios tienen conflictos de horario. Puedes asignarlos con justificación para auditoría.</>
              )}
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
    </div>
  );
}
