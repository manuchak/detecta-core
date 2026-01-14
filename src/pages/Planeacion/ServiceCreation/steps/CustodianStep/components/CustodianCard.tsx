/**
 * CustodianCard - Wrapper for CustodioPerformanceCard with action buttons
 */

import { Phone, MessageCircle, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustodioPerformanceCard } from '@/components/planeacion/CustodioPerformanceCard';
import type { CustodioConProximidad } from '@/hooks/useProximidadOperacional';
import type { CustodianCommunicationState } from '../types';

interface CustodianCardProps {
  custodio: CustodioConProximidad;
  selected: boolean;
  highlighted?: boolean;
  comunicacion?: CustodianCommunicationState;
  onSelect: () => void;
  onContact: (method: 'whatsapp' | 'llamada') => void;
  disabled?: boolean;
}

export function CustodianCard({
  custodio,
  selected,
  highlighted = false,
  comunicacion,
  onSelect,
  onContact,
  disabled = false,
}: CustodianCardProps) {
  const hasAccepted = comunicacion?.status === 'acepta';
  const hasRejected = comunicacion?.status === 'rechaza';
  const isContacted = comunicacion && comunicacion.status !== 'pending';

  // Map categoria_disponibilidad to availabilityStatus
  const availabilityStatus = custodio.categoria_disponibilidad || 'disponible';

  return (
    <div
      className={`
        relative group transition-all duration-200
        ${highlighted ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${hasRejected ? 'opacity-50' : ''}
      `}
    >
      {/* Status badge overlay */}
      {isContacted && (
        <div className={`
          absolute -top-2 -right-2 z-10 px-2 py-0.5 rounded-full text-xs font-medium
          ${hasAccepted ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : ''}
          ${hasRejected ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : ''}
          ${!hasAccepted && !hasRejected ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' : ''}
        `}>
          {hasAccepted && '✓ Aceptó'}
          {hasRejected && '✗ Rechazó'}
          {comunicacion?.status === 'contactar_despues' && '⏰ Llamar después'}
          {comunicacion?.status === 'sin_respuesta' && '📵 Sin respuesta'}
        </div>
      )}

      <CustodioPerformanceCard
        custodio={custodio as any}
        selected={selected}
        compact
        disabled={disabled || hasRejected}
        availabilityStatus={availabilityStatus}
        unavailableReason={custodio.razon_no_disponible}
      />

      {/* Action buttons overlay */}
      <div className={`
        mt-2 flex items-center gap-2 transition-all
        ${hasRejected ? 'opacity-50 pointer-events-none' : ''}
      `}>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            onContact('whatsapp');
          }}
          disabled={disabled || hasRejected}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            onContact('llamada');
          }}
          disabled={disabled || hasRejected}
        >
          <Phone className="h-3.5 w-3.5" />
          Llamar
        </Button>

        {hasAccepted ? (
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <Check className="h-3.5 w-3.5" />
            Seleccionado
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            disabled={disabled || hasRejected}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
