/**
 * SelectedCustodianSummary - Shows the currently selected (and auto-confirmed) custodian
 * Includes contact CTAs for WhatsApp/Call and a clear "Continuar" action
 */

import { Check, User, X, Phone, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CustodianCommunicationState } from '../types';

interface SelectedCustodianSummaryProps {
  custodianName: string;
  custodianId: string;
  custodianPhone?: string;
  custodianVehicle?: string;
  comunicacion?: CustodianCommunicationState;
  onClear: () => void;
  onContinue: () => void;
  onContact?: (method: 'whatsapp' | 'llamada') => void;
}

export function SelectedCustodianSummary({
  custodianName,
  custodianId,
  custodianPhone,
  custodianVehicle,
  comunicacion,
  onClear,
  onContinue,
  onContact,
}: SelectedCustodianSummaryProps) {
  const isConfirmed = comunicacion?.status === 'acepta';

  const handleWhatsApp = () => {
    if (custodianPhone) {
      const cleanPhone = custodianPhone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`;
      window.open(`https://wa.me/${fullPhone}`, '_blank');
    }
    onContact?.('whatsapp');
  };

  const handleCall = () => {
    if (custodianPhone) {
      window.open(`tel:${custodianPhone}`, '_self');
    }
    onContact?.('llamada');
  };

  return (
    <div className="rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header with status badge */}
      <div className="px-4 py-3 bg-green-100/50 dark:bg-green-900/30 border-b border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-green-800 dark:text-green-200">
                Custodio Asignado
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-600 hover:text-green-800 hover:bg-green-200/50"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Custodian info */}
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg text-foreground truncate">
              {custodianName}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
              {custodianPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {custodianPhone}
                </span>
              )}
              {custodianVehicle && (
                <span className="truncate">🚗 {custodianVehicle}</span>
              )}
            </div>
            {isConfirmed && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  Confirmado para el servicio
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Contact buttons - useful if planner needs to call again */}
        {custodianPhone && onContact && (
          <div className="flex gap-2 pt-2 border-t border-green-200 dark:border-green-800">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/50"
              onClick={handleWhatsApp}
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/50"
              onClick={handleCall}
            >
              <Phone className="h-4 w-4" />
              Llamar
            </Button>
          </div>
        )}

        {/* Continue button - prominent CTA */}
        <Button
          onClick={onContinue}
          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          Continuar con este custodio
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {comunicacion?.status === 'contactar_despues' && comunicacion.contactar_en && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Llamar después: {comunicacion.contactar_en}
        </div>
      )}
    </div>
  );
}
