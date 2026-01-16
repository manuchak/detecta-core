import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { verificarConflictosArmado, type ArmadosConflictValidation } from '@/utils/armadosConflictDetection';

export interface ArmedGuardOperativo {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  zona_base?: string;
  estado: 'activo' | 'inactivo' | 'suspendido';
  disponibilidad: 'disponible' | 'ocupado' | 'no_disponible';
  tipo_armado: 'interno' | 'proveedor_externo';
  
  // Performance metrics
  numero_servicios: number;
  rating_promedio: number;
  tasa_confirmacion: number;
  tasa_respuesta: number;
  tasa_confiabilidad: number;
  
  // Scoring
  score_comunicacion: number;
  score_disponibilidad: number;
  score_confiabilidad: number;
  score_total: number;
  
  // Capacidades
  experiencia_anos: number;
  licencia_portacion?: string;
  fecha_vencimiento_licencia?: string;
  equipamiento_disponible?: string[];
  zonas_permitidas?: string[];
  servicios_permitidos?: string[];
  restricciones_horario?: Record<string, any>;
  
  // Proveedor info
  proveedor_id?: string;
  proveedor_nombre?: string;
  proveedor_capacidad_maxima?: number;
  proveedor_capacidad_actual?: number;
  
  // Availability
  disponible_hoy?: boolean;
  score_disponibilidad_efectiva?: number;
  
  fuente: 'candidato' | 'historico' | 'proveedor' | 'manual';
  fecha_ultimo_servicio?: string;
  created_at: string;
  updated_at: string;
  
  // New conflict validation fields
  conflicto_validacion?: ArmadosConflictValidation;
  categoria_disponibilidad_conflicto?: string;
  razon_no_disponible?: string;
  scoring_proximidad?: number;
  
  // 🆕 Campos para armados virtuales (leads de Supply)
  es_lead_virtual?: boolean;      // Flag: ¿Es un lead de Supply?
  lead_id_origen?: string;        // ID original del lead
  lead_estado_original?: string;  // Estado del lead (contactado/aprobado)
  
  // 🆕 Campos de actividad reciente (desde servicios_custodia)
  fecha_ultimo_servicio_real?: string;
  servicios_90dias?: number;
  servicios_historico_total?: number;
  tiene_actividad_90dias?: boolean;
  
  // 🆕 Campos de cobertura de zona (calculados post-fetch)
  cubre_zona_servicio?: boolean;
  prioridad_zona?: number;
}

export interface ProveedorArmado {
  id: string;
  nombre_empresa: string;
  rfc?: string;
  contacto_principal: string;
  telefono_contacto: string;
  email_contacto: string;
  
  // Operational capabilities
  zonas_cobertura: string[];
  servicios_disponibles: string[];
  capacidad_maxima: number;
  capacidad_actual: number;
  
  // Commercial data
  tarifa_base_local?: number;
  tarifa_base_foraneo?: number;
  tarifa_alta_seguridad?: number;
  descuento_volumen?: number;
  
  // Performance
  rating_proveedor: number;
  tasa_confirmacion_empresa: number;
  numero_servicios_empresa: number;
  
  // Status
  activo: boolean;
  licencias_vigentes: boolean;
  documentos_completos: boolean;
  documentacion_legal?: string[];
  
  disponibilidad_24h: boolean;
  tiempo_respuesta_promedio?: number;
  observaciones?: string;
  
  created_at: string;
  updated_at: string;
  
  // Zone coverage info (computed at runtime)
  cubre_zona_servicio?: boolean;
  prioridad_zona?: number;
}

export interface ServiceRequestFilters {
  zona_base?: string;
  tipo_servicio?: 'local' | 'foraneo' | 'alta_seguridad';
  incluye_armado?: boolean;
  fecha_programada?: string;
  hora_ventana_inicio?: string;
  urgente?: boolean;
  // 🆕 Filtro de actividad reciente (90 días)
  soloConActividad90Dias?: boolean;
}

export function useArmedGuardsOperativos(filters?: ServiceRequestFilters) {
  const [armedGuards, setArmedGuards] = useState<ArmedGuardOperativo[]>([]);
  const [providers, setProviders] = useState<ProveedorArmado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArmedGuards = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading armed guards with filters:', filters);
      
      // First get currently unavailable armed guards
      const today = new Date().toISOString().split('T')[0];
      const { data: unavailableGuards, error: unavailableError } = await supabase
        .from('armados_indisponibilidades')
        .select('armado_id')
        .eq('activo', true)
        .lte('fecha_inicio', today)
        .or(`fecha_fin.is.null,fecha_fin.gte.${today}`);

      if (unavailableError) {
        console.warn('Error fetching unavailable guards, continuing without filter:', unavailableError);
      }

      const unavailableIds = unavailableGuards?.map(u => u.armado_id) || [];
      console.log('Found unavailable armed guards:', unavailableIds.length);
      
      // 🆕 Query a la vista unificada que incluye leads de Supply
      // ⚠️ NO aplicar filtro de zona a nivel de query - traer todos y marcar post-fetch
      let guardsQuery = supabase
        .from('armados_disponibles_extendido')
        .select('*')
        .eq('estado', 'activo')
        .order('numero_servicios', { ascending: true })  // Priorizar "nuevos" (0 servicios)
        .order('score_total', { ascending: false });
      
      // Filter out unavailable guards if any found
      if (unavailableIds.length > 0) {
        guardsQuery = guardsQuery.not('id', 'in', `(${unavailableIds.join(',')})`);
      }

      // 🆕 Zone filter is NOT applied at query level for armed guards
      // Instead, we'll mark zone coverage post-fetch (similar to providers)
      // This ensures all armed guards are fetched and then sorted by zone proximity
      const zoneFilterInfo = filters?.zona_base?.trim() || null;
      if (zoneFilterInfo) {
        console.log('[Armed] Zone filter will be applied post-fetch for:', zoneFilterInfo);
      }

      // Apply service type filter (more flexible - skip if no valid type)
      if (filters?.tipo_servicio && ['local', 'foraneo', 'alta_seguridad'].includes(filters.tipo_servicio)) {
        guardsQuery = guardsQuery.contains('servicios_permitidos', [filters.tipo_servicio]);
      }

      // Filter by availability
      if (filters?.fecha_programada) {
        guardsQuery = guardsQuery.eq('disponibilidad', 'disponible');
      }

      let finalGuardsData: any[] | null = null;
      const { data: guardsData, error: guardsError } = await guardsQuery;

      if (guardsError) {
        if (guardsError.message && guardsError.message.toLowerCase().includes('logic tree')) {
          console.warn('Zone OR parse error detected, retrying without zone filter');
          // Retry without zone filter but keep the other filters
          let retryQuery = supabase
            .from('armados_disponibles_extendido')
            .select('*')
            .eq('estado', 'activo')
            .order('numero_servicios', { ascending: true })
            .order('score_total', { ascending: false });

          if (filters?.tipo_servicio && ['local', 'foraneo', 'alta_seguridad'].includes(filters.tipo_servicio)) {
            retryQuery = retryQuery.contains('servicios_permitidos', [filters.tipo_servicio]);
          }
          if (filters?.fecha_programada) {
            retryQuery = retryQuery.eq('disponibilidad', 'disponible');
          }

          const { data: retryData, error: retryError } = await retryQuery;
          if (retryError) {
            console.error('Retry without zone filter failed:', retryError);
            throw retryError;
          }
          finalGuardsData = retryData;
        } else {
          console.error('Error loading armed guards:', guardsError);
          throw guardsError;
        }
      } else {
        finalGuardsData = guardsData;
      }

      console.log(`Loaded ${finalGuardsData?.length || 0} armed guards from database`);

      // Load external providers
      const { data: providersData, error: providersError } = await supabase
        .from('proveedores_armados')
        .select('*')
        .eq('activo', true)
        .order('rating_proveedor', { ascending: false });

      if (providersError) {
        console.error('Error loading providers:', providersError);
        // Don't throw error for providers, just log and continue
        setProviders([]);
      } else {
        // Apply filters to providers - SHOW ALL but mark zone coverage (fail-open approach)
        const capacityFilteredProviders = (providersData || []).filter(provider => 
          provider.capacidad_actual < provider.capacidad_maxima
        );
        
        // Map providers with zone coverage info (don't filter out, just mark)
        const providersWithCoverage = capacityFilteredProviders.map(provider => {
          let cubreZona = true; // Default true if no zone filter
          let prioridadZona = 0;
          
          if (filters?.zona_base && filters.zona_base.trim()) {
            const zoneName = filters.zona_base.trim();
            const zoneTokens = zoneName.split(/[,\s]+/).filter(token => token.length > 2);
            
            cubreZona = false; // Will be set to true if match found
            
            if (provider.zonas_cobertura && provider.zonas_cobertura.length > 0) {
              // Check for exact match first
              if (provider.zonas_cobertura.includes(zoneName)) {
                cubreZona = true;
              } else {
                // Check for partial matches in zone coverage
                cubreZona = provider.zonas_cobertura.some(zona => {
                  const zonaLower = zona.toLowerCase();
                  const zoneNameLower = zoneName.toLowerCase();
                  
                  // Check if zone contains the search term or vice versa
                  if (zonaLower.includes(zoneNameLower) || zoneNameLower.includes(zonaLower)) {
                    return true;
                  }
                  
                  // Check for token matches
                  return zoneTokens.some(token => 
                    zonaLower.includes(token.toLowerCase()) || token.toLowerCase().includes(zonaLower)
                  );
                });
              }
            }
            
            prioridadZona = cubreZona ? 0 : 1; // Providers covering zone come first
          }
          
          return {
            ...provider,
            cubre_zona_servicio: cubreZona,
            prioridad_zona: prioridadZona
          };
        });

        // Apply service type filter
        let filteredProviders = providersWithCoverage;
        if (filters?.tipo_servicio && ['local', 'foraneo', 'alta_seguridad'].includes(filters.tipo_servicio)) {
          filteredProviders = providersWithCoverage.filter(provider => 
            provider.servicios_disponibles?.includes(filters.tipo_servicio!) ||
            provider.servicios_disponibles?.includes('general') // Allow general providers
          );
        }

        // Sort: providers covering zone first, then by rating
        filteredProviders.sort((a, b) => {
          if (a.prioridad_zona !== b.prioridad_zona) {
            return a.prioridad_zona - b.prioridad_zona;
          }
          return (b.rating_proveedor || 0) - (a.rating_proveedor || 0);
        });

        console.log(`Providers loaded: ${filteredProviders.length} (zone coverage marked, not filtered out)`);
        setProviders(filteredProviders);
      }

      // Process armed guards data with conflict validation - PARALLEL with TIMEOUT + FAIL-OPEN
      const BATCH_SIZE = 20;
      const TIMEOUT_MS = 3000;
      
      // Default fail-open validation result
      const createDefaultValidation = (): ArmadosConflictValidation => ({
        disponible: true,  // FAIL-OPEN: assume available
        categoria_disponibilidad: 'libre',
        razon_no_disponible: null,
        servicios_hoy: 0,
        servicios_en_conflicto: 0,
        conflictos_detalle: [],
        horas_trabajadas_hoy: 0,
        dias_sin_asignar: 0,
        nivel_fatiga: 'bajo',
        factor_equidad: 50,
        factor_oportunidad: 50,
        scoring_equitativo: {
          workload_score: 50,
          opportunity_score: 50,
          fatiga_penalty: 0,
          balance_recommendation: 'neutral'
        }
      });
      
      // Process single guard with timeout
      const procesarArmadoConTimeout = async (guard: any): Promise<any> => {
        let conflictValidation: ArmadosConflictValidation | undefined;
        
        // Only validate if we have service date/time filters
        if (filters?.fecha_programada && filters?.hora_ventana_inicio) {
          try {
            // Race between RPC call and timeout
            const result = await Promise.race([
              supabase.rpc('verificar_disponibilidad_equitativa_armado', {
                p_armado_id: guard.id,
                p_armado_nombre: guard.nombre,
                p_fecha_servicio: filters.fecha_programada,
                p_hora_inicio: filters.hora_ventana_inicio,
                p_duracion_estimada_horas: 4
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)
              )
            ]) as { data: any; error: any };
            
            if (result.error) {
              console.warn(`[FAIL-OPEN] RPC error for ${guard.nombre}, defaulting to available`);
              conflictValidation = createDefaultValidation();
            } else {
              conflictValidation = result.data as ArmadosConflictValidation;
            }
          } catch (error: any) {
            // Timeout or any error - FAIL-OPEN
            console.warn(`[FAIL-OPEN] Timeout/error for armado ${guard.nombre}:`, error.message);
            conflictValidation = createDefaultValidation();
          }
        }
        
        return {
          ...guard,
          // Add computed fields for compatibility
          disponible_hoy: conflictValidation ? conflictValidation.disponible : guard.disponibilidad === 'disponible',
          score_disponibilidad_efectiva: guard.score_total || 0,
          proveedor_nombre: guard.proveedor_id ? 'Proveedor Externo' : undefined,
          proveedor_capacidad_maxima: undefined,
          proveedor_capacidad_actual: undefined,
          // New conflict validation fields
          conflicto_validacion: conflictValidation,
          categoria_disponibilidad_conflicto: conflictValidation?.categoria_disponibilidad || 'libre',
          razon_no_disponible: conflictValidation?.razon_no_disponible,
          scoring_proximidad: conflictValidation ? 
            (conflictValidation.factor_equidad + conflictValidation.factor_oportunidad) / 2 : 
            guard.score_total || 50
        };
      };
      
      // Process guards in batches for efficiency
      const guardsToProcess = finalGuardsData || [];
      const allProcessedGuards: any[] = [];
      
      for (let i = 0; i < guardsToProcess.length; i += BATCH_SIZE) {
        const batch = guardsToProcess.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map(guard => procesarArmadoConTimeout(guard))
        );
        
        // Extract fulfilled results, use fail-open for rejected
        batchResults.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            allProcessedGuards.push(result.value);
          } else {
            // Even Promise.allSettled rejection gets fail-open treatment
            const guard = batch[idx];
            console.warn(`[FAIL-OPEN] Batch processing failed for ${guard.nombre}`);
            allProcessedGuards.push({
              ...guard,
              disponible_hoy: true,
              score_disponibilidad_efectiva: guard.score_total || 0,
              conflicto_validacion: createDefaultValidation(),
              categoria_disponibilidad_conflicto: 'libre',
              razon_no_disponible: null,
              scoring_proximidad: guard.score_total || 50
            });
          }
        });
      }
      
      const processedGuards = allProcessedGuards;
      console.log(`[Armed] Processed ${processedGuards.length} guards with fail-open strategy`);

      // 🆕 Apply zone coverage marking POST-FETCH (not as a filter, just marking)
      const guardsWithZoneCoverage = processedGuards.map(guard => {
        let cubreZona = true; // Default true if no zone filter
        let prioridadZona = 0;
        
        if (zoneFilterInfo) {
          const zoneName = zoneFilterInfo;
          const zoneTokens = zoneName.split(/[,\s]+/).filter(token => token.length > 2);
          
          cubreZona = false; // Will be set to true if match found
          
          // Check zona_base
          if (guard.zona_base) {
            const zonaBaseLower = guard.zona_base.toLowerCase();
            const zoneNameLower = zoneName.toLowerCase();
            
            if (zonaBaseLower.includes(zoneNameLower) || zoneNameLower.includes(zonaBaseLower)) {
              cubreZona = true;
            } else {
              // Check token matches
              cubreZona = zoneTokens.some(token => 
                zonaBaseLower.includes(token.toLowerCase())
              );
            }
          }
          
          // Check zonas_permitidas if not already covered
          if (!cubreZona && guard.zonas_permitidas && guard.zonas_permitidas.length > 0) {
            cubreZona = guard.zonas_permitidas.some((zona: string) => {
              const zonaLower = zona.toLowerCase();
              const zoneNameLower = zoneName.toLowerCase();
              
              if (zonaLower.includes(zoneNameLower) || zoneNameLower.includes(zonaLower)) {
                return true;
              }
              
              return zoneTokens.some(token => 
                zonaLower.includes(token.toLowerCase())
              );
            });
          }
          
          prioridadZona = cubreZona ? 0 : 1; // Guards covering zone come first
        }
        
        return {
          ...guard,
          cubre_zona_servicio: cubreZona,
          prioridad_zona: prioridadZona
        };
      });
      
      console.log(`[Armed] Zone coverage marked: ${guardsWithZoneCoverage.filter(g => g.cubre_zona_servicio).length} in zone, ${guardsWithZoneCoverage.filter(g => !g.cubre_zona_servicio).length} outside zone`);

      // Filter out unavailable guards based on conflict validation (if validation was performed)
      let availableGuards = guardsWithZoneCoverage;
      if (filters?.fecha_programada && filters?.hora_ventana_inicio) {
        availableGuards = guardsWithZoneCoverage.filter(guard => {
          if (guard.conflicto_validacion) {
            return guard.conflicto_validacion.disponible;
          }
          return guard.disponibilidad === 'disponible';
        });
        
        console.log(`Conflict validation applied: ${guardsWithZoneCoverage.length} -> ${availableGuards.length} available guards`);
      }

      // 🆕 Apply 90-day activity filter if enabled (only for internal guards)
      let filteredByActivity = availableGuards;
      if (filters?.soloConActividad90Dias) {
        filteredByActivity = availableGuards.filter(guard => {
          // External providers are not filtered by activity
          if (guard.tipo_armado === 'proveedor_externo') return true;
          // Virtual leads are included (they're new, no history expected)
          if (guard.es_lead_virtual) return true;
          // Real internal guards must have recent activity
          return guard.tiene_actividad_90dias === true;
        });
        console.log(`[Armed] Activity filter (90 days): ${availableGuards.length} -> ${filteredByActivity.length} guards`);
      }

      // Separate internal guards from provider guards
      const internalGuards = filteredByActivity.filter(guard => guard.tipo_armado === 'interno');
      const providerGuards = filteredByActivity.filter(guard => guard.tipo_armado === 'proveedor_externo');

      // Sort by zone coverage, availability category and score for internal guards
      const sortedInternalGuards = internalGuards.sort((a, b) => {
        // 🆕 First priority: Zone coverage (in-zone first)
        if (a.prioridad_zona !== b.prioridad_zona) {
          return (a.prioridad_zona || 0) - (b.prioridad_zona || 0);
        }
        
        // If conflict validation was performed, use conflict categories
        if (a.conflicto_validacion && b.conflicto_validacion) {
          const categoryPriority = {
            'libre': 1,
            'parcialmente_ocupado': 2,
            'ocupado_disponible': 3,
            'ocupado': 4,
            'no_disponible': 5
          };
          
          const aPriority = categoryPriority[a.categoria_disponibilidad_conflicto as keyof typeof categoryPriority] || 5;
          const bPriority = categoryPriority[b.categoria_disponibilidad_conflicto as keyof typeof categoryPriority] || 5;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }

          // Then by scoring_proximidad
          return (b.scoring_proximidad || 0) - (a.scoring_proximidad || 0);
        }

        // Fallback to original sorting logic
        // Priority: available > occupied > unavailable
        if (a.disponibilidad === 'disponible' && b.disponibilidad !== 'disponible') return -1;
        if (a.disponibilidad !== 'disponible' && b.disponibilidad === 'disponible') return 1;
        
        // Then by score
        return (b.score_total || 0) - (a.score_total || 0);
      });

      setArmedGuards([...sortedInternalGuards, ...providerGuards]);

    } catch (error: any) {
      console.error('Error in useArmedGuardsOperativos:', error);
      setError(error.message || 'Error al cargar armados y proveedores');
      toast.error('Error al cargar armados disponibles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArmedGuards();
  }, [filters?.zona_base, filters?.tipo_servicio, filters?.fecha_programada]);

  const assignArmedGuard = async (
    servicioId: string,
    custodioId: string,
    armadoId: string,
    tipoAsignacion: 'interno' | 'proveedor',
    puntoEncuentro: string,
    horaEncuentro: string,
    fechaServicio: string,
    providerId?: string,
    tarifaAcordada?: number,
    personalData?: {
      personalId: string;
      nombreCompleto: string;
      licenciaPortacion?: string;
      verificacionData: any;
      es_lead_virtual?: boolean;
      lead_id_origen?: string;
      armado_virtual_uuid?: string;  // UUID virtual generado por la vista
    }
  ) => {
    try {
      console.log('🔄 [assignArmedGuard] Inicio de asignación:', {
        servicioId,
        armadoId,
        es_lead_virtual: personalData?.es_lead_virtual,
        lead_id_origen: personalData?.lead_id_origen,
        armado_virtual_uuid: personalData?.armado_virtual_uuid,
        timestamp: new Date().toISOString()
      });
      
      let armadoFinalId = armadoId;
      
      // 🆕 Si es un lead virtual, convertirlo primero
      if (personalData?.es_lead_virtual && personalData?.lead_id_origen) {
        toast.info('Convirtiendo candidato a armado operativo...', {
          description: 'Primer servicio del candidato. Creando perfil operativo.'
        });
        
        try {
          console.log('🔄 [assignArmedGuard] Llamando a convertir_lead_a_armado_operativo:', {
            lead_id_origen: personalData.lead_id_origen,
            armado_virtual_uuid: personalData.armado_virtual_uuid
          });
          
          const { data: nuevoArmadoId, error: conversionError } = await supabase.rpc(
            'convertir_lead_a_armado_operativo',
            { p_lead_id: personalData.lead_id_origen }
          );
          
          if (conversionError) {
            console.error('❌ [assignArmedGuard] Error en conversión RPC:', conversionError);
            throw conversionError;
          }
          
          console.log('✅ [assignArmedGuard] Lead convertido exitosamente:', {
            lead_id_origen: personalData.lead_id_origen,
            nuevoArmadoId,
            armado_virtual_uuid_anterior: armadoId
          });
          
          armadoFinalId = nuevoArmadoId;
          
          toast.success('Candidato convertido exitosamente', {
            description: 'Ya puede recibir asignaciones futuras como armado operativo.'
          });
        } catch (conversionError: any) {
          console.error('❌ [assignArmedGuard] Error al convertir lead:', conversionError);
          toast.error('Error al convertir candidato', {
            description: conversionError.message || 'No se pudo completar la conversión'
          });
          throw conversionError;
        }
      }
      
      // Construir timestamp completo: fecha + hora
      const [hours, minutes] = horaEncuentro.split(':');
      const fullTimestamp = new Date(`${fechaServicio}T${hours}:${minutes}:00`);
      const timestampISO = fullTimestamp.toISOString();

      const assignmentData: any = {
        servicio_custodia_id: servicioId,
        custodio_id: custodioId,
        tipo_asignacion: tipoAsignacion,
        punto_encuentro: puntoEncuentro,
        hora_encuentro: timestampISO,
        estado_asignacion: 'pendiente',
        tarifa_acordada: tarifaAcordada,
        asignado_por: (await supabase.auth.getUser()).data.user?.id,
        ...(tipoAsignacion === 'interno' 
          ? { armado_id: armadoFinalId }  // 🆕 Usar ID convertido si aplica
          : { proveedor_armado_id: providerId, armado_id: armadoId }
        )
      };

      // 🆕 Obtener nombre del armado SIEMPRE para ambos tipos
      if (tipoAsignacion === 'interno') {
        // Para armados internos, obtener el nombre desde armados_operativos
        const { data: armadoData, error: armadoError } = await supabase
          .from('armados_operativos')
          .select('nombre')
          .eq('id', armadoFinalId)
          .single();
        
        if (!armadoError && armadoData) {
          assignmentData.armado_nombre_verificado = armadoData.nombre;
        }
      } else if (tipoAsignacion === 'proveedor' && personalData) {
        // Para externos, usar los datos proporcionados
        assignmentData.personal_proveedor_id = personalData.personalId;
        assignmentData.armado_nombre_verificado = personalData.nombreCompleto;
        assignmentData.verificacion_identidad_timestamp = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('asignacion_armados')
        .insert(assignmentData)
        .select()
        .single();

      if (error) {
        console.error('Error assigning armed guard:', error);
        throw error;
      }

      // Crear registro de auditoría con datos específicos del armado
      if (personalData) {
        const { error: auditError } = await supabase
          .from('assignment_audit_log')
          .insert({
            action_type: 'assign_external_armed_guard',
            service_id: servicioId,
            assignment_id: data.id,
            armado_id: armadoId,
            proveedor_id: providerId,
            performed_by: (await supabase.auth.getUser()).data.user?.id,
            armado_nombre_real: personalData.nombreCompleto,
            verification_data: personalData.verificacionData,
            security_clearance_level: personalData.verificacionData?.valida ? 'verified' : 'pending',
            document_verification_status: personalData.verificacionData?.valida ? 'valid' : 'invalid',
            changes_summary: `Asignado armado externo verificado: ${personalData.nombreCompleto} (${personalData.licenciaPortacion || 'Sin licencia'})`
          });

        if (auditError) {
          console.error('Error creating audit log:', auditError);
        }
      }

      // Update provider capacity if external
      if (tipoAsignacion === 'proveedor' && providerId) {
        await supabase.rpc('increment', {
          table_name: 'proveedores_armados',
          row_id: providerId,
          column_name: 'capacidad_actual',
          x: 1
        });
      }

      toast.success('Armado asignado exitosamente');
      
      // Refresh data after assignment
      await loadArmedGuards();
      
      return data;

    } catch (error: any) {
      console.error('Error in assignArmedGuard:', error);
      toast.error('Error al asignar el armado');
      throw error;
    }
  };

  const updateAssignmentStatus = async (
    assignmentId: string,
    status: 'confirmado' | 'rechazado' | 'completado' | 'cancelado',
    observaciones?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('asignacion_armados')
        .update({ 
          estado_asignacion: status,
          observaciones: observaciones,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating assignment status:', error);
        throw error;
      }

      toast.success(`Estado actualizado a: ${status}`);
      return data;

    } catch (error: any) {
      console.error('Error in updateAssignmentStatus:', error);
      toast.error('Error al actualizar el estado');
      throw error;
    }
  };

  const refreshAvailability = async () => {
    try {
      // Simply reload the data instead of calling non-existent RPC
      await loadArmedGuards();
      toast.success('Disponibilidad actualizada');
    } catch (error: any) {
      console.error('Error refreshing availability:', error);
      toast.error('Error al actualizar disponibilidad');
    }
  };

  return {
    armedGuards,
    providers,
    loading,
    error,
    assignArmedGuard,
    updateAssignmentStatus,
    refreshAvailability,
    refetch: loadArmedGuards
  };
}

export default useArmedGuardsOperativos;