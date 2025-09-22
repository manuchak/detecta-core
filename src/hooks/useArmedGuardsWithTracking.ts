import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ArmedGuard {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  zona_base?: string;
  disponibilidad: string;
  estado: string;
  licencia_portacion?: string;
  fecha_vencimiento_licencia?: string;
  experiencia_anos: number;
  rating_promedio: number;
  numero_servicios: number;
  tasa_respuesta: number;
  tasa_confirmacion: number;
  equipamiento_disponible?: string[];
  observaciones?: string;
  fecha_ultimo_servicio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ArmedProvider {
  id: string;
  nombre_empresa: string;
  contacto_principal: string;
  telefono_contacto: string;
  email_contacto?: string;
  zonas_cobertura: string[];
  tarifa_por_servicio?: number;
  disponibilidad_24h: boolean;
  tiempo_respuesta_promedio?: number;
  rating_proveedor: number;
  servicios_completados: number;
  activo: boolean;
  documentacion_legal?: string[];
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceRequest {
  zona_base?: string;
  tipo_servicio?: string;
  incluye_armado?: boolean;
  fecha_programada?: string;
  hora_ventana_inicio?: string;
}

export function useArmedGuardsWithTracking(serviceData?: ServiceRequest) {
  const [armedGuards, setArmedGuards] = useState<ArmedGuard[]>([]);
  const [providers, setProviders] = useState<ArmedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadArmedGuardsAndProviders = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load internal armed guards
        const { data: armedGuardsData, error: armedError } = await supabase
          .from('armados')
          .select('*')
          .eq('estado', 'activo')
          .order('rating_promedio', { ascending: false });

        if (armedError) {
          console.error('Error loading armed guards:', armedError);
          throw armedError;
        }

        // Load external providers
        const { data: providersData, error: providersError } = await supabase
          .from('proveedores_armados')
          .select('*')
          .eq('activo', true)
          .order('rating_proveedor', { ascending: false });

        if (providersError) {
          console.error('Error loading providers:', providersError);
          throw providersError;
        }

        // Filter based on service requirements if provided
        let filteredGuards = armedGuardsData || [];
        let filteredProviders = providersData || [];

        if (serviceData?.zona_base) {
          // Filter guards by zone
          filteredGuards = filteredGuards.filter(guard => 
            !guard.zona_base || guard.zona_base.toLowerCase().includes(serviceData.zona_base!.toLowerCase())
          );

          // Filter providers by coverage zones
          filteredProviders = filteredProviders.filter(provider => 
            provider.zonas_cobertura.some(zona => 
              zona.toLowerCase().includes(serviceData.zona_base!.toLowerCase())
            )
          );
        }

        // Prioritize available guards
        filteredGuards.sort((a, b) => {
          if (a.disponibilidad === 'disponible' && b.disponibilidad !== 'disponible') return -1;
          if (a.disponibilidad !== 'disponible' && b.disponibilidad === 'disponible') return 1;
          return b.rating_promedio - a.rating_promedio;
        });

        setArmedGuards(filteredGuards);
        setProviders(filteredProviders);

      } catch (error: any) {
        console.error('Error in useArmedGuardsWithTracking:', error);
        setError(error.message || 'Error al cargar armados y proveedores');
        toast.error('Error al cargar armados disponibles');
      } finally {
        setLoading(false);
      }
    };

    loadArmedGuardsAndProviders();
  }, [serviceData?.zona_base, serviceData?.tipo_servicio]);

  const assignArmedGuard = async (
    servicioId: string,
    custodioId: string,
    armadoId: string,
    tipoAsignacion: 'interno' | 'proveedor',
    puntoEncuentro: string,
    horaEncuentro: string,
    providerId?: string
  ) => {
    try {
      const assignmentData = {
        servicio_custodia_id: servicioId,
        custodio_id: custodioId,
        tipo_asignacion: tipoAsignacion,
        punto_encuentro: puntoEncuentro,
        hora_encuentro: horaEncuentro,
        estado_asignacion: 'pendiente',
        ...(tipoAsignacion === 'interno' ? { armado_id: armadoId } : { proveedor_armado_id: providerId })
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

      toast.success('Armado asignado exitosamente');
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

  return {
    armedGuards,
    providers,
    loading,
    error,
    assignArmedGuard,
    updateAssignmentStatus,
    refetch: () => {
      setLoading(true);
      // Re-trigger the useEffect
      setArmedGuards([]);
      setProviders([]);
    }
  };
}