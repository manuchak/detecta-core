import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ValidationResult {
  is_valid: boolean;
  message: string;
  type?: 'finished_service' | 'duplicate_service' | 'permission_warning';
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
    excludeFinished: boolean = true,
    mode: 'create' | 'update' = 'create'
  ): Promise<ValidationResult> => {
    if (!idServicio?.trim()) {
      return {
        is_valid: false,
        message: 'ID de servicio es requerido'
      };
    }

    setIsValidating(true);
    
    try {
      // Usar la nueva función global que valida en ambas tablas
      const { data, error } = await supabase
        .rpc('validate_service_id_globally', {
          p_id_servicio: idServicio.trim()
        });

      if (error) {
        console.error('Error validating service ID globally:', error);
        
        // Handle permission denied errors (42501) non-blockingly in update mode
        const errorCode = (error as any).code;
        const errorMessage = error.message || '';
        
        if (errorCode === '42501' || errorMessage.includes('permission denied')) {
          toast.warning('Validación omitida por permisos - continuando con importación');
          return {
            is_valid: mode === 'update', // Allow in update mode, block in create mode
            message: 'Validación omitida por permisos',
            type: 'permission_warning'
          };
        }
        
        // Distinguir entre errores técnicos y problemas de validación
        if (errorMessage?.includes('function') || errorMessage?.includes('type')) {
          toast.error('Error de validación - problema técnico');
          return {
            is_valid: false,
            message: 'Error técnico de validación'
          };
        }
        
        toast.error('Error de conexión al validar ID');
        return {
          is_valid: false,
          message: 'Error de conexión al validar ID'
        };
      }

      // Mejorar mensajes según el tipo de error
      const result = data as ValidationResult;
      
      // In update mode, treat duplicates as valid (we're updating existing records)
      if (mode === 'update' && result.type === 'duplicate_service') {
        result.is_valid = true;
        result.message = 'ID existe - será actualizado';
        return result;
      }
      
      if (!result.is_valid && result.type === 'duplicate_service') {
        result.message = 'ID ya existe en el sistema';
      } else if (!result.is_valid && result.type === 'finished_service') {
        result.message = 'ID ya existe - pertenece a un servicio finalizado';
      }

      return result;
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
    excludeFinished: boolean = true,
    mode: 'create' | 'update' = 'create'
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

      // Log para debugging
      console.log('🔍 Validating service IDs:', {
        count: cleanIds.length,
        mode,
        excludeFinished,
        sample: cleanIds.slice(0, 3)
      });

      const { data, error } = await supabase
        .rpc('validate_multiple_service_ids', {
          p_service_ids: cleanIds,
          p_exclude_finished: excludeFinished
          // ✅ Sin p_is_test - usa la función correcta con 2 parámetros
        });

      if (error) {
        const errorCode = (error as any).code;
        const errorMessage = error.message || '';
        
        console.error('❌ RPC Error Details:', { 
          error, 
          errorCode, 
          errorMessage,
          hint: (error as any).hint,
          details: (error as any).details
        });
        
        // ✅ NUEVO: Detectar error de autenticación específicamente
        if (errorMessage.includes('No hay usuario autenticado') || errorCode === 'P0001') {
          toast.error('Sesión expirada', {
            description: 'Por favor recarga la página e intenta nuevamente'
          });
          return {
            is_valid: false,
            total_checked: cleanIds.length,
            invalid_count: cleanIds.length,
            duplicate_in_input: [],
            finished_services: [],
            invalid_services: [],
            summary: '⚠️ Sesión expirada - por favor recarga la página'
          };
        }
        
        // ✅ FALLBACK: Si el RPC falla por tabla inexistente, hacer SELECT directo
        if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
          console.warn('⚠️ RPC falló por tabla inexistente - usando fallback con SELECT directo');
          
          try {
            // Hacer SELECT directo en lotes de 200 IDs
            const BATCH_SIZE = 200;
            const allResults: Array<{ id_servicio: string; estado: string | null }> = [];
            
            for (let i = 0; i < cleanIds.length; i += BATCH_SIZE) {
              const batch = cleanIds.slice(i, i + BATCH_SIZE);
              const { data: batchData, error: batchError } = await supabase
                .from('servicios_custodia')
                .select('id_servicio, estado')
                .in('id_servicio', batch);
              
              if (batchError) {
                console.error('Error en fallback batch:', batchError);
                continue;
              }
              
              if (batchData) {
                allResults.push(...batchData);
              }
            }
            
            // Construir mapa de resultados
            const existingMap = new Map(
              allResults.map(r => [r.id_servicio, r.estado])
            );
            
            // Detectar duplicados en input
            const idCounts = new Map<string, number>();
            cleanIds.forEach(id => idCounts.set(id, (idCounts.get(id) || 0) + 1));
            const duplicate_in_input = Array.from(idCounts.entries())
              .filter(([_, count]) => count > 1)
              .map(([id]) => id);
            
            // Procesar según modo
            const finished_services: string[] = [];
            const invalid_services: Array<{
              id_servicio: string;
              message: string;
              type: string;
            }> = [];
            
            cleanIds.forEach(id => {
              const estado = existingMap.get(id);
              const exists = estado !== undefined;
              const isFinished = estado === 'Finalizado';
              
              if (mode === 'create') {
                if (exists) {
                  invalid_services.push({
                    id_servicio: id,
                    message: 'ID ya existe en el sistema',
                    type: 'duplicate_service'
                  });
                }
                if (isFinished) {
                  finished_services.push(id);
                }
              } else if (mode === 'update') {
                if (!exists) {
                  invalid_services.push({
                    id_servicio: id,
                    message: 'ID no encontrado en la base de datos',
                    type: 'not_found'
                  });
                }
                if (isFinished) {
                  finished_services.push(id);
                }
              }
            });
            
            toast.warning('Validación por fallback aplicada', {
              description: 'RPC sin tabla de permisos - validación básica completada'
            });
            
            const notFoundCount = invalid_services.filter(inv => inv.type === 'not_found').length;
            const existingCount = cleanIds.length - notFoundCount;
            
            return {
              is_valid: mode === 'create' 
                ? invalid_services.length === 0 && duplicate_in_input.length === 0
                : existingCount > 0,
              total_checked: cleanIds.length,
              invalid_count: invalid_services.length,
              duplicate_in_input,
              finished_services,
              invalid_services,
              summary: mode === 'create'
                ? invalid_services.length === 0 && duplicate_in_input.length === 0
                  ? `${cleanIds.length} IDs validados correctamente (fallback)`
                  : `${invalid_services.length} IDs con problemas detectados (fallback)`
                : notFoundCount === 0
                  ? `${cleanIds.length} IDs serán actualizados (fallback)`
                  : `${existingCount} IDs serán actualizados, ${notFoundCount} IDs no encontrados (fallback)`
            };
          } catch (fallbackError) {
            console.error('Error en fallback:', fallbackError);
            toast.error('Error crítico de validación');
            return {
              is_valid: false,
              total_checked: cleanIds.length,
              invalid_count: cleanIds.length,
              duplicate_in_input: [],
              finished_services: [],
              invalid_services: [],
              summary: 'Error crítico - no se pudo validar con RPC ni con fallback'
            };
          }
        }
        
        // Timeout específico (código 57014) - permitir continuar en UPDATE mode
        if (errorCode === '57014') {
          toast.warning(
            `Validación tardó demasiado (${cleanIds.length} IDs). ` +
            `${mode === 'update' ? 'Continuando con importación...' : 'Por favor, use lotes más pequeños.'}`,
            { duration: 5000 }
          );
          return {
            is_valid: mode === 'update', // Permitir en UPDATE, bloquear en CREATE
            total_checked: cleanIds.length,
            invalid_count: 0,
            duplicate_in_input: [],
            finished_services: [],
            invalid_services: [],
            summary: mode === 'update' 
              ? 'Validación omitida por timeout - los registros se procesarán directamente'
              : `Timeout al validar ${cleanIds.length} IDs - use lotes más pequeños`
          };
        }
        
        // Handle permission denied errors (42501) non-blockingly in update mode
        if (errorCode === '42501' || errorMessage.includes('permission denied')) {
          toast.warning('Validación omitida por permisos - continuando con importación');
          return {
            is_valid: mode === 'update', // Allow in update mode
            total_checked: cleanIds.length,
            invalid_count: 0,
            duplicate_in_input: [],
            finished_services: [],
            invalid_services: [],
            summary: 'Validación omitida por permisos - se actualizarán los registros existentes'
          };
        }
        
        // Handle ambiguous function call errors (PGRST203) in update mode
        const isAmbiguityError = errorMessage.includes('Could not choose the best candidate function') || 
                                errorMessage.includes('PGRST203');
        if (mode === 'update' && isAmbiguityError) {
          toast.warning('Validación omitida por ambigüedad del RPC - continuando con actualización');
          return {
            is_valid: true,
            total_checked: cleanIds.length,
            invalid_count: 0,
            duplicate_in_input: [],
            finished_services: [],
            invalid_services: [],
            summary: 'Validación omitida por ambigüedad del RPC - se continuará en modo Actualizar'
          };
        }
        
        // Otros errores
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

      // ✅ Transformar array del RPC en BulkValidationResult
      const rpcResults = data as Array<{
        id_servicio: string;
        record_exists: boolean;
        is_finished: boolean;
        has_permission: boolean;
      }>;

      // Detectar duplicados en el INPUT (IDs repetidos en el archivo)
      const idCounts = new Map<string, number>();
      cleanIds.forEach(id => idCounts.set(id, (idCounts.get(id) || 0) + 1));
      const duplicate_in_input = Array.from(idCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([id]) => id);

      // Procesar resultados del RPC
      const finished_services: string[] = [];
      const invalid_services: Array<{
        id_servicio: string;
        message: string;
        type: string;
        existing_service?: any;
      }> = [];

      rpcResults.forEach(row => {
        // Si es modo CREATE:
        if (mode === 'create') {
          if (row.record_exists) {
            invalid_services.push({
              id_servicio: row.id_servicio,
              message: 'ID ya existe en el sistema',
              type: 'duplicate_service'
            });
          }
          if (row.is_finished) {
            finished_services.push(row.id_servicio);
            invalid_services.push({
              id_servicio: row.id_servicio,
              message: 'ID pertenece a un servicio finalizado',
              type: 'finished_service'
            });
          }
        }
        
        // Si es modo UPDATE:
        if (mode === 'update') {
          if (!row.record_exists) {
            invalid_services.push({
              id_servicio: row.id_servicio,
              message: 'ID no encontrado en la base de datos',
              type: 'not_found'
            });
          }
          if (row.is_finished) {
            finished_services.push(row.id_servicio);
            // En UPDATE, servicios finalizados NO son error, solo se omiten
          }
        }
      });

      // Construir resultado
      const notFoundCount = invalid_services.filter(inv => inv.type === 'not_found').length;
      const existingCount = cleanIds.length - notFoundCount;
      
      const result: BulkValidationResult = {
        is_valid: mode === 'create' 
          ? invalid_services.length === 0 && duplicate_in_input.length === 0
          : existingCount > 0, // En UPDATE, válido si al menos 1 ID existe
        total_checked: cleanIds.length,
        invalid_count: invalid_services.length,
        duplicate_in_input,
        finished_services,
        invalid_services,
        summary: mode === 'create'
          ? invalid_services.length === 0 && duplicate_in_input.length === 0
            ? `${cleanIds.length} IDs validados correctamente`
            : `${invalid_services.length} IDs con problemas detectados`
          : notFoundCount === 0
            ? `${cleanIds.length} IDs serán actualizados`
            : `${existingCount} IDs serán actualizados, ${notFoundCount} IDs no encontrados`
      };

      return result;
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