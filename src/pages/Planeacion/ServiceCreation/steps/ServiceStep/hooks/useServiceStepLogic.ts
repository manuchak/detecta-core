/**
 * useServiceStepLogic - Central logic for the Service Step
 * Handles auto-fill, timezone-safe dates, validation, and synchronization
 * 
 * CRITICAL: This hook implements "Hydration-Safe State Initialization" to prevent
 * race conditions where local state overwrites draft data during hydration.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useServiceCreation, PricingResultData } from '../../../hooks/useServiceCreation';

export interface ServiceStepState {
  servicioId: string;
  idInterno: string;
  fechaRecepcion: string;
  horaRecepcion: string;
  fecha: string;
  hora: string;
  tipoServicio: 'custodia_sin_arma' | 'custodia_armada' | 'custodia_armada_reforzada';
  requiereArmado: boolean;
  gadgets: Record<string, number>;
  observaciones: string;
}

interface ValidationState {
  isValidating: boolean;
  isValid: boolean;
  errorMessage: string | null;
}

const SERVICE_TYPE_OPTIONS = [
  { value: 'custodia_sin_arma', label: 'Custodia Sin Arma', description: 'Custodio civil sin portación' },
  { value: 'custodia_armada', label: 'Custodia Armada', description: 'Custodio armado certificado' },
  { value: 'custodia_armada_reforzada', label: 'Custodia Reforzada', description: 'Dos custodios armados' },
] as const;

export function useServiceStepLogic() {
  const { formData, updateFormData, isHydrated } = useServiceCreation();
  
  // HYDRATION-SAFE: Track if we've synced from hydrated formData
  const [hasInitializedFromHydration, setHasInitializedFromHydration] = useState(false);
  
  // Initialize with empty/default values - will be populated after hydration
  const [servicioId, setServicioId] = useState('');
  const [idInterno, setIdInterno] = useState('');
  const [fechaRecepcion, setFechaRecepcion] = useState('');
  const [horaRecepcion, setHoraRecepcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [tipoServicio, setTipoServicio] = useState<ServiceStepState['tipoServicio']>('custodia_sin_arma');
  const [requiereArmado, setRequiereArmado] = useState(false);
  const [cantidadArmadosRequeridos, setCantidadArmadosRequeridos] = useState(1);
  const [esServicioRetorno, setEsServicioRetorno] = useState(false);
  const [gadgets, setGadgets] = useState<Record<string, number>>({});
  const [observaciones, setObservaciones] = useState('');
  
  // Validation state
  const [validation, setValidation] = useState<ValidationState>({
    isValidating: false,
    isValid: true,
    errorMessage: null,
  });
  
  // Track if we auto-filled from route
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  const [wasHoraOptimized, setWasHoraOptimized] = useState(false);

  // Get route data for auto-fill
  const pricingResult = formData.pricingResult as PricingResultData | null;
  const distanciaKm = pricingResult?.distancia_km || 0;

  // ============================================================================
  // HYDRATION-SAFE INITIALIZATION
  // Wait for isHydrated before syncing FROM formData to local state
  // ============================================================================
  useEffect(() => {
    if (isHydrated && !hasInitializedFromHydration) {
      console.log('[ServiceStepLogic] Hydrating from formData:', {
        formData_idInterno: formData.idInterno,
        formData_fecha: formData.fecha,
        formData_hora: formData.hora,
      });
      
      // Now it's safe to read from hydrated formData
      setServicioId(formData.servicioId || '');
      setIdInterno(formData.idInterno || '');
      setFechaRecepcion(formData.fechaRecepcion || format(new Date(), 'yyyy-MM-dd'));
      setHoraRecepcion(formData.horaRecepcion || format(new Date(), 'HH:mm'));
      setFecha(formData.fecha || format(new Date(), 'yyyy-MM-dd'));
      setHora(formData.hora || '');
      setTipoServicio((formData.tipoServicio as ServiceStepState['tipoServicio']) || 'custodia_sin_arma');
      setRequiereArmado(formData.requiereArmado || false);
      setCantidadArmadosRequeridos(formData.cantidadArmadosRequeridos || 1);
      setEsServicioRetorno(formData.esServicioRetorno || false);
      setGadgets(formData.gadgets || {});
      setObservaciones(formData.observaciones || '');
      
      setHasInitializedFromHydration(true);
    }
  }, [isHydrated, hasInitializedFromHydration, formData]);

  // Auto-generate UUID if servicioId is empty (only after hydration)
  useEffect(() => {
    if (hasInitializedFromHydration && !servicioId) {
      const newId = crypto.randomUUID();
      setServicioId(newId);
    }
  }, [hasInitializedFromHydration, servicioId]);

  // Auto-fill from route data (only after hydration)
  useEffect(() => {
    if (!hasInitializedFromHydration) return;
    
    if (pricingResult && !wasAutoFilled) {
      setWasAutoFilled(true);
      
      // Auto-detect service type from route
      const tipoFromRoute = pricingResult.tipo_servicio?.toUpperCase();
      const incluyeArmado = pricingResult.incluye_armado;
      
      if (tipoFromRoute === 'ARMADA' || incluyeArmado) {
        setTipoServicio('custodia_armada');
        setRequiereArmado(true);
      }
      
      // Suggest "custodia_armada_reforzada" for high-value long routes
      if (distanciaKm > 200 && (pricingResult.precio_sugerido || 0) > 20000) {
        setTipoServicio('custodia_armada_reforzada');
        setRequiereArmado(true);
      }
      
      // Optimize hora based on distance (only if not already set from draft)
      if (distanciaKm > 100 && !hora) {
        setHora('07:00');
        setWasHoraOptimized(true);
      }
    }
  }, [hasInitializedFromHydration, pricingResult, wasAutoFilled, distanciaKm, hora]);

  // ============================================================================
  // SYNC TO CONTEXT - ONLY AFTER HYDRATION INITIALIZATION
  // This prevents overwriting hydrated draft data with empty defaults
  // ============================================================================
  useEffect(() => {
    // CRITICAL GUARD: Don't sync until we've initialized from hydration
    if (!hasInitializedFromHydration) {
      console.log('[ServiceStepLogic] Skipping sync - waiting for hydration');
      return;
    }
    
    updateFormData({
      servicioId,
      idInterno,
      fechaRecepcion,
      horaRecepcion,
      fecha,
      hora,
      tipoServicio,
      requiereArmado,
      cantidadArmadosRequeridos,
      esServicioRetorno,
      gadgets,
      observaciones,
    });
  }, [
    hasInitializedFromHydration,
    servicioId, 
    idInterno, 
    fechaRecepcion, 
    horaRecepcion, 
    fecha, 
    hora, 
    tipoServicio, 
    requiereArmado, 
    cantidadArmadosRequeridos,
    esServicioRetorno, 
    gadgets, 
    observaciones, 
    updateFormData
  ]);

  // Bidirectional sync: tipoServicio <-> requiereArmado
  const handleTipoServicioChange = useCallback((value: ServiceStepState['tipoServicio']) => {
    setTipoServicio(value);
    
    if (value === 'custodia_sin_arma') {
      setRequiereArmado(false);
    } else if (value === 'custodia_armada' || value === 'custodia_armada_reforzada') {
      setRequiereArmado(true);
    }
  }, []);

  const handleRequiereArmadoChange = useCallback((checked: boolean) => {
    setRequiereArmado(checked);
    
    if (!checked) {
      setCantidadArmadosRequeridos(1);
      if (tipoServicio !== 'custodia_sin_arma') {
        setTipoServicio('custodia_sin_arma');
      }
    } else if (checked && tipoServicio === 'custodia_sin_arma') {
      setTipoServicio('custodia_armada');
    }
  }, [tipoServicio]);

  const handleCantidadArmadosChange = useCallback((cantidad: number) => {
    setCantidadArmadosRequeridos(Math.max(1, Math.min(4, cantidad)));
  }, []);

  // Gadget handling
  const handleGadgetChange = useCallback((gadgetId: string, cantidad: number) => {
    setGadgets(prev => {
      const updated = { ...prev };
      if (cantidad <= 0) {
        delete updated[gadgetId];
      } else {
        updated[gadgetId] = cantidad;
      }
      return updated;
    });
  }, []);

  // Date validation: today (with future time) or later
  const minDate = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const isToday = fecha === today;
  
  // Combined date+time validation
  const isDateTimeValid = useMemo(() => {
    if (!fecha) return false;
    
    const now = new Date();
    const selectedDate = startOfDay(new Date(fecha + 'T00:00:00'));
    
    // Past date is always invalid
    if (isBefore(selectedDate, startOfDay(now))) {
      return false;
    }
    
    // If today, check time constraints
    if (fecha === format(now, 'yyyy-MM-dd')) {
      if (!hora) return false; // Need time for today validation
      const selectedDateTime = new Date(`${fecha}T${hora}:00`);
      
      // For return services: allow up to 10 minutes in the past (edge cases)
      if (esServicioRetorno) {
        const minRetornoTime = new Date(now.getTime() - 10 * 60 * 1000);
        return !isBefore(selectedDateTime, minRetornoTime);
      }
      
      // Standard validation: 30 min in future
      const minFutureTime = new Date(now.getTime() + 30 * 60 * 1000);
      return !isBefore(selectedDateTime, minFutureTime);
    }
    
    // Tomorrow or later is always valid (if hora is set)
    return true;
  }, [fecha, hora, esServicioRetorno]);

  // Specific error message for date/time
  const dateTimeErrorMessage = useMemo(() => {
    if (!fecha) return null;
    
    const now = new Date();
    const selectedDate = startOfDay(new Date(fecha + 'T00:00:00'));
    
    if (isBefore(selectedDate, startOfDay(now))) {
      return 'No se pueden crear servicios para fechas pasadas';
    }
    
    if (fecha === format(now, 'yyyy-MM-dd') && hora) {
      const selectedDateTime = new Date(`${fecha}T${hora}:00`);
      
      // For return services: relaxed validation
      if (esServicioRetorno) {
        const minRetornoTime = new Date(now.getTime() - 10 * 60 * 1000);
        if (isBefore(selectedDateTime, minRetornoTime)) {
          return 'La hora del retorno no puede ser más de 10 minutos en el pasado';
        }
        return null; // Valid for return service
      }
      
      // Standard validation
      const minFutureTime = new Date(now.getTime() + 30 * 60 * 1000);
      if (isBefore(selectedDateTime, minFutureTime)) {
        return 'La hora debe ser al menos 30 minutos en el futuro';
      }
    }
    
    return null;
  }, [fecha, hora, esServicioRetorno]);

  // Keep isDateValid for backwards compatibility (now uses combined logic)
  const isDateValid = isDateTimeValid;

  // Format display for reception time
  const formattedRecepcion = useMemo(() => {
    if (!fechaRecepcion || !horaRecepcion) return '';
    try {
      const date = new Date(`${fechaRecepcion}T${horaRecepcion}`);
      return format(date, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return `${fechaRecepcion} ${horaRecepcion}`;
    }
  }, [fechaRecepcion, horaRecepcion]);

  // Format display for appointment date
  const formattedFecha = useMemo(() => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha + 'T00:00:00');
      return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return fecha;
    }
  }, [fecha]);

  // Total gadgets count
  const totalGadgets = useMemo(() => 
    Object.values(gadgets).reduce((sum, qty) => sum + qty, 0),
    [gadgets]
  );

  // Validate servicioId against existing services (debounced, only after hydration)
  useEffect(() => {
    if (!hasInitializedFromHydration) return;
    
    if (!servicioId || servicioId.length < 10) {
      setValidation({ isValidating: false, isValid: true, errorMessage: null });
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setValidation(prev => ({ ...prev, isValidating: true }));
      
      try {
        // Check if service ID already exists
        const { data, error } = await supabase
          .from('servicios_planificados')
          .select('id')
          .eq('id', servicioId)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          setValidation({
            isValidating: false,
            isValid: false,
            errorMessage: 'Este ID ya existe en el sistema',
          });
        } else {
          setValidation({
            isValidating: false,
            isValid: true,
            errorMessage: null,
          });
        }
      } catch (err) {
        console.error('Error validating service ID:', err);
        setValidation({
          isValidating: false,
          isValid: true, // Assume valid on error
          errorMessage: null,
        });
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [hasInitializedFromHydration, servicioId]);

  // Can continue to next step? (only valid after hydration)
  const canContinue = useMemo(() => {
    if (!hasInitializedFromHydration) return false;
    
    return (
      servicioId.length > 0 &&
      validation.isValid &&
      !validation.isValidating &&
      isDateValid &&
      hora.length > 0
    );
  }, [hasInitializedFromHydration, servicioId, validation.isValid, validation.isValidating, isDateValid, hora]);

  // ============================================================================
  // SYNC TO CONTEXT - SYNCHRONOUS VERSION FOR NAVIGATION
  // Call this BEFORE nextStep() to ensure formData is updated before navigation
  // ============================================================================
  const syncToContext = useCallback(() => {
    console.log('[ServiceStepLogic] syncToContext called - forcing synchronous update');
    updateFormData({
      servicioId,
      idInterno,
      fechaRecepcion,
      horaRecepcion,
      fecha,
      hora,
      tipoServicio,
      requiereArmado,
      cantidadArmadosRequeridos,
      esServicioRetorno,
      gadgets,
      observaciones,
    });
  }, [
    updateFormData,
    servicioId,
    idInterno,
    fechaRecepcion,
    horaRecepcion,
    fecha,
    hora,
    tipoServicio,
    requiereArmado,
    cantidadArmadosRequeridos,
    esServicioRetorno,
    gadgets,
    observaciones,
  ]);

  return {
    // State
    servicioId,
    idInterno,
    fechaRecepcion,
    horaRecepcion,
    fecha,
    hora,
    tipoServicio,
    requiereArmado,
    cantidadArmadosRequeridos,
    esServicioRetorno,
    gadgets,
    observaciones,
    
    // Setters
    setServicioId,
    setIdInterno,
    setFecha,
    setHora,
    setObservaciones,
    handleTipoServicioChange,
    handleRequiereArmadoChange,
    handleCantidadArmadosChange,
    setEsServicioRetorno,
    handleGadgetChange,
    
    // Validation
    validation,
    isDateValid,
    isDateTimeValid,
    dateTimeErrorMessage,
    minDate,
    isToday,
    canContinue,
    
    // Hydration state (for debugging/UI feedback)
    isHydrated: hasInitializedFromHydration,
    
    // Formatted displays
    formattedRecepcion,
    formattedFecha,
    totalGadgets,
    
    // Auto-fill indicators
    wasHoraOptimized,
    wasAutoFilled,
    distanciaKm,
    
    // Constants
    SERVICE_TYPE_OPTIONS,
    
    // NEW: Synchronous sync function
    syncToContext,
  };
}
