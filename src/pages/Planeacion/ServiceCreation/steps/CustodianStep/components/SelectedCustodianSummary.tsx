/**
 * SelectedCustodianSummary - Shows the currently selected custodian
 */

import { Check, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CustodianCommunicationState } from '../types';

interface SelectedCustodianSummaryProps {
  custodianName: string;
  custodianId: string;
  comunicacion?: CustodianCommunicationState;
  onClear: () => void;
}

export function SelectedCustodianSummary({
  custodianName,
  custodianId,
  comunicacion,
  onClear,
}: SelectedCustodianSummaryProps) {
  const hasAccepted = comunicacion?.status === 'acepta';

  return (
    <div className={`
      p-4 rounded-lg border-2 transition-all
      ${hasAccepted 
        ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700' 
        : 'bg-primary/5 border-primary/30'
      }
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${hasAccepted 
              ? 'bg-green-100 dark:bg-green-900/50' 
              : 'bg-primary/10'
            }
          `}>
            {hasAccepted ? (
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
          </div>
          
          <div>
            <div className="font-medium">{custodianName}</div>
            <div className="text-xs text-muted-foreground">
              {hasAccepted ? (
                <span className="text-green-600 dark:text-green-400 font-medium">
                  ✓ Confirmado para el servicio
                </span>
              ) : (
                <span>Seleccionado - pendiente confirmación</span>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {comunicacion?.status === 'contactar_despues' && comunicacion.contactar_en && (
        <div className="mt-2 text-xs text-muted-foreground">
          ⏰ Llamar después: {comunicacion.contactar_en}
        </div>
      )}
    </div>
  );
}
