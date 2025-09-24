import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

export interface ServiceRequestFilters {
  zona_base?: string;
  tipo_servicio?: 'local' | 'foraneo' | 'alta_seguridad';
  incluye_armado?: boolean;
  fecha_programada?: string;
  hora_ventana_inicio?: string;
  urgente?: boolean;
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
      
      // Query the actual armados_operativos table
      let guardsQuery = supabase
        .from('armados_operativos')
        .select('*')
        .eq('estado', 'activo')
        .order('score_total', { ascending: false });

      // Apply zone filter with proper escaping and token-based search
      if (filters?.zona_base && filters.zona_base.trim()) {
        const zoneName = filters.zona_base.trim();
        
        // Extract main zone tokens for flexible matching
        const zoneTokens = zoneName.split(/[,\s]+/).filter(token => token.length > 2);
        
        try {
          // Build flexible search conditions
          const searchConditions: string[] = [];
          
          // Search in zona_base field
          searchConditions.push(`zona_base.ilike.%${zoneName}%`);
          
          // Search for individual tokens in zona_base
          zoneTokens.forEach(token => {
            searchConditions.push(`zona_base.ilike.%${token}%`);
          });
          
          // Search in zonas_permitidas array (properly escaped JSON)
          searchConditions.push(`zonas_permitidas.cs.["${zoneName}"]`);
          
          // Search for tokens in zonas_permitidas
          zoneTokens.forEach(token => {
            searchConditions.push(`zonas_permitidas.cs.["${token}"]`);
          });
          
          guardsQuery = guardsQuery.or(searchConditions.join(','));
          console.log('Applied zone filter for:', zoneName, 'with tokens:', zoneTokens);
        } catch (error) {
          console.warn('Zone filter failed, proceeding without zone filter:', error);
          // Continue without zone filter as fallback
        }
      }

      // Apply service type filter (more flexible - skip if no valid type)
      if (filters?.tipo_servicio && ['local', 'foraneo', 'alta_seguridad'].includes(filters.tipo_servicio)) {
        guardsQuery = guardsQuery.contains('servicios_permitidos', [filters.tipo_servicio]);
      }

      // Filter by availability
      if (filters?.fecha_programada) {
        guardsQuery = guardsQuery.eq('disponibilidad', 'disponible');
      }

      const { data: guardsData, error: guardsError } = await guardsQuery;

      if (guardsError) {
        console.error('Error loading armed guards:', guardsError);
        throw guardsError;
      }

      console.log(`Loaded ${guardsData?.length || 0} armed guards from database`);

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
        // Apply filters to providers and check capacity
        let filteredProviders = (providersData || []).filter(provider => 
          provider.capacidad_actual < provider.capacidad_maxima
        );
        
        // Filter providers based on criteria with improved zone matching
        if (filters?.zona_base && filters.zona_base.trim()) {
          const zoneName = filters.zona_base.trim();
          const zoneTokens = zoneName.split(/[,\s]+/).filter(token => token.length > 2);
          
          filteredProviders = filteredProviders.filter(provider => {
            if (!provider.zonas_cobertura || provider.zonas_cobertura.length === 0) {
              return false;
            }
            
            // Check for exact match first
            if (provider.zonas_cobertura.includes(zoneName)) {
              return true;
            }
            
            // Check for partial matches in zone coverage
            return provider.zonas_cobertura.some(zona => {
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
          });
          
          console.log(`Zone filter applied for providers: ${zoneName} -> ${filteredProviders.length} results`);
        }

        if (filters?.tipo_servicio && ['local', 'foraneo', 'alta_seguridad'].includes(filters.tipo_servicio)) {
          filteredProviders = filteredProviders.filter(provider => 
            provider.servicios_disponibles?.includes(filters.tipo_servicio!) ||
            provider.servicios_disponibles?.includes('general') // Allow general providers
          );
        }

        console.log(`Filtered to ${filteredProviders.length} providers from ${providersData?.length || 0} total`);
        setProviders(filteredProviders);
      }

      // Process armed guards data
      const processedGuards = (guardsData || []).map(guard => ({
        ...guard,
        // Add computed fields for compatibility
        disponible_hoy: guard.disponibilidad === 'disponible',
        score_disponibilidad_efectiva: guard.score_total || 0,
        proveedor_nombre: guard.proveedor_id ? 'Proveedor Externo' : undefined,
        proveedor_capacidad_maxima: undefined,
        proveedor_capacidad_actual: undefined
      }));

      // Separate internal guards from provider guards
      const internalGuards = processedGuards.filter(guard => guard.tipo_armado === 'interno');
      const providerGuards = processedGuards.filter(guard => guard.tipo_armado === 'proveedor_externo');

      // Sort by availability and score
      const sortedInternalGuards = internalGuards.sort((a, b) => {
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
    providerId?: string,
    tarifaAcordada?: number
  ) => {
    try {
      const assignmentData = {
        servicio_custodia_id: servicioId,
        custodio_id: custodioId,
        tipo_asignacion: tipoAsignacion,
        punto_encuentro: puntoEncuentro,
        hora_encuentro: horaEncuentro,
        estado_asignacion: 'pendiente',
        tarifa_acordada: tarifaAcordada,
        asignado_por: (await supabase.auth.getUser()).data.user?.id,
        ...(tipoAsignacion === 'interno' 
          ? { armado_id: armadoId } 
          : { proveedor_armado_id: providerId, armado_id: armadoId }
        )
      };

      const { data, error } = await supabase
        .from('asignacion_armados')
        .insert(assignmentData)
        .select()
        .single();

      if (error) {
        console.error('Error assigning armed guard:', error);
        throw error;
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