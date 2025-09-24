import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ValidationResult {
  is_valid: boolean;
  message: string;
  type?: 'finished_service' | 'duplicate_service';
  existing_service?: {
    id_servicio: string;
    estado: string;
    cliente: string;
    fecha: string;
  };
}

interface BulkValidationResult {
  is_valid: boolean;
  total_checked: number;
  invalid_count: number;
  duplicate_in_input: string[];
  finished_services: string[];
  invalid_services: Array<{
    id_servicio: string;
    message: string;
    type: string;
    existing_service?: any;
  }>;
  summary: string;
}

export const useServiceIdValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateSingleId = useCallback(async (
    idServicio: string,
    excludeFinished: boolean = true
  ): Promise<ValidationResult> => {
    if (!idServicio?.trim()) {
      return {
        is_valid: false,
        message: 'ID de servicio es requerido'
      };
    }

    setIsValidating(true);
    
    try {
      const { data, error } = await supabase
        .rpc('validate_unique_service_id', {
          p_id_servicio: idServicio.trim(),
          p_exclude_finished: excludeFinished
        });

      if (error) {
        console.error('Error validating service ID:', error);
        toast.error('Error al validar ID de servicio');
        return {
          is_valid: false,
          message: 'Error de conexión al validar ID'
        };
      }

      return data as ValidationResult;
    } catch (error) {
      console.error('Error validating service ID:', error);
      return {
        is_valid: false,
        message: 'Error de conexión al validar ID'
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateMultipleIds = useCallback(async (
    serviceIds: string[],
    excludeFinished: boolean = true
  ): Promise<BulkValidationResult> => {
    if (!serviceIds?.length) {
      return {
        is_valid: true,
        total_checked: 0,
        invalid_count: 0,
        duplicate_in_input: [],
        finished_services: [],
        invalid_services: [],
        summary: 'No hay IDs para validar'
      };
    }

    setIsValidating(true);
    
    try {
      const cleanIds = serviceIds
        .filter(id => id?.trim())
        .map(id => id.trim());

      const { data, error } = await supabase
        .rpc('validate_multiple_service_ids', {
          p_service_ids: cleanIds,
          p_exclude_finished: excludeFinished
        });

      if (error) {
        console.error('Error validating service IDs:', error);
        toast.error('Error al validar IDs de servicio');
        return {
          is_valid: false,
          total_checked: cleanIds.length,
          invalid_count: cleanIds.length,
          duplicate_in_input: [],
          finished_services: [],
          invalid_services: [],
          summary: 'Error de conexión al validar IDs'
        };
      }

      return data as BulkValidationResult;
    } catch (error) {
      console.error('Error validating service IDs:', error);
      return {
        is_valid: false,
        total_checked: serviceIds.length,
        invalid_count: serviceIds.length,
        duplicate_in_input: [],
        finished_services: [],
        invalid_services: [],
        summary: 'Error de conexión al validar IDs'
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validateSingleId,
    validateMultipleIds,
    isValidating
  };
};