/**
 * useServiceStepLogic - Central logic for the Service Step
 * Handles auto-fill, timezone-safe dates, validation, and synchronization
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const { formData, updateFormData } = useServiceCreation();
  
  // Initialize state from formData or defaults
  const [servicioId, setServicioId] = useState(() => 
    formData.servicioId || ''
  );
  const [idInterno, setIdInterno] = useState(() => 
    formData.idInterno || ''
  );
  const [fechaRecepcion] = useState(() => 
    formData.fechaRecepcion || format(new Date(), 'yyyy-MM-dd')
  );
  const [horaRecepcion] = useState(() => 
    formData.horaRecepcion || format(new Date(), 'HH:mm')
  );
  const [fecha, setFecha] = useState(() => 
    formData.fecha || format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [hora, setHora] = useState(() => 
    formData.hora || '08:00'
  );
  const [tipoServicio, setTipoServicio] = useState<ServiceStepState['tipoServicio']>(() => 
    (formData.tipoServicio as ServiceStepState['tipoServicio']) || 'custodia_sin_arma'
  );
  const [requiereArmado, setRequiereArmado] = useState(() => 
    formData.requiereArmado || false
  );
  const [gadgets, setGadgets] = useState<Record<string, number>>(() => 
    formData.gadgets || {}
  );
  const [observaciones, setObservaciones] = useState(() => 
    formData.observaciones || ''
  );
  
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

  // Auto-generate UUID if servicioId is empty (only once on mount)
  useEffect(() => {
    if (!servicioId) {
      const newId = crypto.randomUUID();
      setServicioId(newId);
    }
  }, []);

  // Auto-fill from route data on first mount
  useEffect(() => {
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
      
      // Optimize hora based on distance
      if (distanciaKm > 100 && !formData.hora) {
        setHora('07:00');
        setWasHoraOptimized(true);
      }
    }
  }, [pricingResult, wasAutoFilled, distanciaKm, formData.hora]);

  // Sync changes to form data (debounced in parent context)
  useEffect(() => {
    updateFormData({
      servicioId,
      idInterno,
      fechaRecepcion,
      horaRecepcion,
      fecha,
      hora,
      tipoServicio,
      requiereArmado,
      gadgets,
      observaciones,
    });
  }, [servicioId, idInterno, fechaRecepcion, horaRecepcion, fecha, hora, tipoServicio, requiereArmado, gadgets, observaciones, updateFormData]);

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
    
    if (!checked && tipoServicio !== 'custodia_sin_arma') {
      setTipoServicio('custodia_sin_arma');
    } else if (checked && tipoServicio === 'custodia_sin_arma') {
      setTipoServicio('custodia_armada');
    }
  }, [tipoServicio]);

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

  // Date validation: must be tomorrow or later
  const minDate = useMemo(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'), []);
  
  const isDateValid = useMemo(() => {
    if (!fecha) return false;
    const selectedDate = startOfDay(new Date(fecha + 'T00:00:00'));
    const tomorrow = startOfDay(addDays(new Date(), 1));
    return !isBefore(selectedDate, tomorrow);
  }, [fecha]);

  // Format display for reception time
  const formattedRecepcion = useMemo(() => {
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

  // Validate servicioId against existing services (debounced)
  useEffect(() => {
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
  }, [servicioId]);

  // Can continue to next step?
  const canContinue = useMemo(() => {
    return (
      servicioId.length > 0 &&
      validation.isValid &&
      !validation.isValidating &&
      isDateValid &&
      hora.length > 0
    );
  }, [servicioId, validation.isValid, validation.isValidating, isDateValid, hora]);

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
    handleGadgetChange,
    
    // Validation
    validation,
    isDateValid,
    minDate,
    canContinue,
    
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
  };
}
