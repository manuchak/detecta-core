/**
 * Types for CustodianStep - Phase 3 of Service Creation
 */

import type { CustodioConProximidad } from '@/hooks/useProximidadOperacional';

export interface CustodianCommunicationState {
  status: 'pending' | 'contacted' | 'acepta' | 'rechaza' | 'contactar_despues' | 'sin_respuesta';
  method?: 'whatsapp' | 'llamada';
  razon_rechazo?: string;
  categoria_rechazo?: string;
  contactar_en?: string;
  timestamp?: string;
}

export interface CustodianStepFilters {
  disponibles: boolean;
  parcialmenteOcupados: boolean;
  ocupados: boolean;
  scoreMinimo: number | null;
}

export interface CustodianStepState {
  selectedCustodianId: string;
  selectedCustodianName: string;
  comunicaciones: Record<string, CustodianCommunicationState>;
  searchTerm: string;
  filters: CustodianStepFilters;
}

export interface ConflictOverrideData {
  motivo: string;
  detalles?: string;
  timestamp: string;
  autor?: string;
}

export const DEFAULT_FILTERS: CustodianStepFilters = {
  disponibles: true,
  parcialmenteOcupados: true,
  ocupados: false,
  scoreMinimo: null,
};

// Helper to check if custodian has been successfully contacted
export function hasSuccessfulContact(
  comunicacion: CustodianCommunicationState | undefined
): boolean {
  return comunicacion?.status === 'acepta';
}

// Helper to check if custodian should be skipped (rejected or unreachable)
export function shouldSkipCustodian(
  comunicacion: CustodianCommunicationState | undefined
): boolean {
  return comunicacion?.status === 'rechaza' || comunicacion?.status === 'sin_respuesta';
}
