/**
 * useCustodianStepLogic - State management for CustodianStep
 * Handles custodian selection, filtering, search, and communication tracking
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ServiceFormData } from '../../../hooks/useServiceCreation';
import type { CustodioConProximidad, CustodiosCategorizados } from '@/hooks/useProximidadOperacional';
import type { ServicioNuevo } from '@/utils/proximidadOperacional';
import { 
  CustodianStepState, 
  CustodianCommunicationState, 
  CustodianStepFilters,
  DEFAULT_FILTERS,
  hasSuccessfulContact
} from '../types';

interface UseCustodianStepLogicProps {
  formData: Partial<ServiceFormData>;
  updateFormData: (data: Partial<ServiceFormData>) => void;
  draftId: string | null;
}

export function useCustodianStepLogic({
  formData,
  updateFormData,
  draftId
}: UseCustodianStepLogicProps) {
  const queryClient = useQueryClient();
  
  // State
  const [selectedCustodianId, setSelectedCustodianId] = useState<string>(formData.custodioId || '');
  const [selectedCustodianName, setSelectedCustodianName] = useState<string>(formData.custodio || '');
  const [comunicaciones, setComunicaciones] = useState<Record<string, CustodianCommunicationState>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CustodianStepFilters>(DEFAULT_FILTERS);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  
  // Persistence - Load from localStorage on mount
  useEffect(() => {
    if (draftId) {
      const savedState = localStorage.getItem(`custodian-step-${draftId}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState) as Partial<CustodianStepState>;
          if (parsed.comunicaciones) setComunicaciones(parsed.comunicaciones);
          if (parsed.searchTerm) setSearchTerm(parsed.searchTerm);
          if (parsed.filters) setFilters(parsed.filters);
        } catch (e) {
          console.error('Error loading custodian step state:', e);
        }
      }
    }
  }, [draftId]);
  
  // Persistence - Save to localStorage on change
  useEffect(() => {
    if (draftId && (Object.keys(comunicaciones).length > 0 || searchTerm)) {
      const stateToSave: Partial<CustodianStepState> = {
        selectedCustodianId,
        selectedCustodianName,
        comunicaciones,
        searchTerm,
        filters,
      };
      localStorage.setItem(`custodian-step-${draftId}`, JSON.stringify(stateToSave));
    }
  }, [draftId, selectedCustodianId, selectedCustodianName, comunicaciones, searchTerm, filters]);
  
  // Map formData to ServicioNuevo for the proximity hook
  const servicioNuevo: ServicioNuevo | undefined = useMemo(() => {
    if (!formData.fecha || !formData.hora) return undefined;
    
    return {
      origen_texto: formData.origen || formData.cliente || '',
      destino_texto: formData.destino || '',
      fecha_programada: formData.fecha,
      hora_ventana_inicio: formData.hora,
      tipo_servicio: formData.tipoServicio || 'custodia',
      incluye_armado: formData.requiereArmado || false,
      requiere_gadgets: Object.keys(formData.gadgets || {}).length > 0
    };
  }, [formData.fecha, formData.hora, formData.origen, formData.destino, formData.cliente, formData.tipoServicio, formData.requiereArmado, formData.gadgets]);
  
  // Select custodian action - Auto-confirms since confirmation happens offline via phone call
  const selectCustodian = useCallback((custodio: CustodioConProximidad) => {
    setSelectedCustodianId(custodio.id);
    setSelectedCustodianName(custodio.nombre);
    
    // Update global formData
    updateFormData({
      custodioId: custodio.id,
      custodio: custodio.nombre,
    });
    
    // Auto-confirm - the planner confirms via phone call offline
    setComunicaciones(prev => ({
      ...prev,
      [custodio.id]: {
        status: 'acepta',
        method: 'llamada',
        timestamp: new Date().toISOString(),
      }
    }));
  }, [updateFormData]);
  
  // Update communication state for a custodian
  const updateComunicacion = useCallback((
    custodioId: string,
    state: CustodianCommunicationState
  ) => {
    setComunicaciones(prev => ({
      ...prev,
      [custodioId]: {
        ...state,
        timestamp: new Date().toISOString(),
      }
    }));
    
    // If custodian accepted, auto-select them
    if (state.status === 'acepta' && custodioId) {
      // Find and select the custodian
      const custodio = queryClient.getQueryData<CustodiosCategorizados>(
        ['custodios-con-proximidad-equitativo', ...(servicioNuevo ? [
          servicioNuevo.fecha_programada ?? null,
          servicioNuevo.hora_ventana_inicio ?? null,
          servicioNuevo.origen_texto ?? null,
          servicioNuevo.destino_texto ?? null,
          servicioNuevo.tipo_servicio ?? null,
          servicioNuevo.incluye_armado ?? null,
        ] : ['sin-servicio'])]
      );
      
      const allCustodios = [
        ...(custodio?.disponibles || []),
        ...(custodio?.parcialmenteOcupados || []),
        ...(custodio?.ocupados || []),
        ...(custodio?.noDisponibles || []),
      ];
      
      const foundCustodio = allCustodios.find(c => c.id === custodioId);
      if (foundCustodio) {
        selectCustodian(foundCustodio);
      }
    }
  }, [queryClient, servicioNuevo, selectCustodian]);
  
  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedCustodianId('');
    setSelectedCustodianName('');
    updateFormData({
      custodioId: '',
      custodio: '',
    });
  }, [updateFormData]);
  
  // Toggle filter
  const toggleFilter = useCallback((key: keyof CustodianStepFilters) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);
  
  // Filter custodians locally (instant, no server call)
  const filterCustodians = useCallback((
    categorized: CustodiosCategorizados | undefined
  ): CustodioConProximidad[] => {
    if (!categorized) return [];
    
    let result: CustodioConProximidad[] = [];
    
    // Add categories based on filters
    if (filters.disponibles) {
      result = [...result, ...categorized.disponibles];
    }
    if (filters.parcialmenteOcupados) {
      result = [...result, ...categorized.parcialmenteOcupados];
    }
    if (filters.ocupados) {
      result = [...result, ...categorized.ocupados];
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(c => 
        c.nombre.toLowerCase().includes(term) ||
        c.telefono?.toLowerCase().includes(term) ||
        c.zona_base?.toLowerCase().includes(term)
      );
    }
    
    // Apply score filter
    if (filters.scoreMinimo !== null) {
      result = result.filter(c => (c.score_total || 0) >= filters.scoreMinimo!);
    }
    
    return result;
  }, [filters, searchTerm]);
  
  // Check if step can continue
  const canContinue = useMemo(() => {
    if (!selectedCustodianId) return false;
    
    const comunicacion = comunicaciones[selectedCustodianId];
    return hasSuccessfulContact(comunicacion);
  }, [selectedCustodianId, comunicaciones]);
  
  // Keyboard navigation
  const handleKeyboardNavigation = useCallback((
    event: KeyboardEvent,
    filteredList: CustodioConProximidad[]
  ) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredList.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && filteredList[highlightedIndex]) {
          selectCustodian(filteredList[highlightedIndex]);
        }
        break;
    }
  }, [highlightedIndex, selectCustodian]);
  
  return {
    // State
    state: {
      selectedCustodianId,
      selectedCustodianName,
      comunicaciones,
      searchTerm,
      filters,
      highlightedIndex,
      canContinue,
    },
    // Actions
    actions: {
      selectCustodian,
      updateComunicacion,
      clearSelection,
      setSearchTerm,
      toggleFilter,
      setFilters,
      filterCustodians,
      handleKeyboardNavigation,
      setHighlightedIndex,
    },
    // Data
    servicioNuevo,
  };
}
