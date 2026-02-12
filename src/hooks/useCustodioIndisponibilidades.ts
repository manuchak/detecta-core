import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface CustodioIndisponibilidad {
  id: string;
  custodio_id: string;
  tipo_indisponibilidad: 'falla_mecanica' | 'enfermedad' | 'familiar' | 'personal' | 'mantenimiento' | 'capacitacion' | 'otro';
  motivo: string;
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  fecha_fin_real?: string;
  estado: 'activo' | 'resuelto' | 'extendido' | 'cancelado';
  severidad: 'baja' | 'media' | 'alta';
  requiere_seguimiento: boolean;
  notas?: string;
  reportado_por?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface CrearIndisponibilidadData {
  custodio_id: string;
  tipo_indisponibilidad: CustodioIndisponibilidad['tipo_indisponibilidad'];
  motivo: string;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  severidad?: CustodioIndisponibilidad['severidad'];
  requiere_seguimiento?: boolean;
  notas?: string;
}

export const useCustodioIndisponibilidades = () => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Obtener todas las indisponibilidades activas
  const { data: indisponibilidadesActivas = [], isLoading: loadingActivas } = useQuery({
    queryKey: ['custodio-indisponibilidades', 'activas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custodio_indisponibilidades')
        .select(`
          *,
          custodio:custodios_operativos(id, nombre, telefono)
        `)
        .eq('estado', 'activo')
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Obtener indisponibilidades por custodio
  const getIndisponibilidadesCustodio = async (custodio_id: string) => {
    const { data, error } = await supabase
      .from('custodio_indisponibilidades')
      .select('*')
      .eq('custodio_id', custodio_id)
      .order('fecha_inicio', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  // Crear nueva indisponibilidad
  const crearIndisponibilidad = useMutation({
    mutationFn: async (data: CrearIndisponibilidadData) => {
      const { data: result, error } = await supabase
        .from('custodio_indisponibilidades')
        .insert([{
          ...data,
          fecha_inicio: data.fecha_inicio || new Date().toISOString(),
          severidad: data.severidad || 'media',
          requiere_seguimiento: data.requiere_seguimiento || false
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodio-indisponibilidades'] });
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-operativos-disponibles'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad-equitativo'] });
      toast.success('Indisponibilidad registrada correctamente');
    },
    onError: (error) => {
      console.error('Error creando indisponibilidad:', error);
      toast.error('Error al registrar indisponibilidad');
    },
  });

  // Resolver indisponibilidad
  const resolverIndisponibilidad = useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas?: string }) => {
      const { data, error } = await supabase
        .from('custodio_indisponibilidades')
        .update({
          estado: 'resuelto',
          fecha_fin_real: new Date().toISOString(),
          notas: notas || undefined
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodio-indisponibilidades'] });
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-operativos-disponibles'] });
      toast.success('Indisponibilidad resuelta correctamente');
    },
    onError: () => {
      toast.error('Error al resolver indisponibilidad');
    },
  });

  // Extender indisponibilidad
  const extenderIndisponibilidad = useMutation({
    mutationFn: async ({ 
      id, 
      nueva_fecha_fin, 
      motivo_extension 
    }: { 
      id: string; 
      nueva_fecha_fin: string; 
      motivo_extension: string; 
    }) => {
      const { data, error } = await supabase
        .from('custodio_indisponibilidades')
        .update({
          estado: 'extendido',
          fecha_fin_estimada: nueva_fecha_fin,
          notas: motivo_extension
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodio-indisponibilidades'] });
      toast.success('Indisponibilidad extendida correctamente');
    },
    onError: () => {
      toast.error('Error al extender indisponibilidad');
    },
  });

  // Cancelar indisponibilidad
  const cancelarIndisponibilidad = useMutation({
    mutationFn: async ({ id, motivo_cancelacion }: { id: string; motivo_cancelacion: string }) => {
      const { data, error } = await supabase
        .from('custodio_indisponibilidades')
        .update({
          estado: 'cancelado',
          fecha_fin_real: new Date().toISOString(),
          notas: motivo_cancelacion
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodio-indisponibilidades'] });
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-operativos-disponibles'] });
      toast.success('Indisponibilidad cancelada');
    },
    onError: () => {
      toast.error('Error al cancelar indisponibilidad');
    },
  });

  // Obtener estadísticas de indisponibilidades
  const getEstadisticasIndisponibilidades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custodio_indisponibilidades')
        .select('tipo_indisponibilidad, estado, severidad')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = {
        total: data.length,
        activas: data.filter(i => i.estado === 'activo').length,
        resueltas: data.filter(i => i.estado === 'resuelto').length,
        por_tipo: data.reduce((acc, item) => {
          acc[item.tipo_indisponibilidad] = (acc[item.tipo_indisponibilidad] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        por_severidad: data.reduce((acc, item) => {
          acc[item.severidad] = (acc[item.severidad] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar función de auto-reactivación manual
  const ejecutarAutoReactivacion = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('auto_reactivar_custodios');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodio-indisponibilidades'] });
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-operativos-disponibles'] });
      toast.success('Auto-reactivación ejecutada correctamente');
    },
    onError: () => {
      toast.error('Error en auto-reactivación');
    },
  });

  // Filtrar custodios por tipo de indisponibilidad
  const getCustodiosPorTipoIndisponibilidad = (tipo: CustodioIndisponibilidad['tipo_indisponibilidad']) => {
    return indisponibilidadesActivas.filter(i => i.tipo_indisponibilidad === tipo);
  };

  // Verificar si un custodio tiene indisponibilidades activas
  const custodioTieneIndisponibilidadActiva = (custodio_id: string) => {
    return indisponibilidadesActivas.some(i => i.custodio_id === custodio_id);
  };

  return {
    // Datos
    indisponibilidadesActivas,
    loading: loading || loadingActivas,
    
    // Funciones de consulta
    getIndisponibilidadesCustodio,
    getEstadisticasIndisponibilidades,
    getCustodiosPorTipoIndisponibilidad,
    custodioTieneIndisponibilidadActiva,
    
    // Mutaciones
    crearIndisponibilidad,
    resolverIndisponibilidad,
    extenderIndisponibilidad,
    cancelarIndisponibilidad,
    ejecutarAutoReactivacion,
    
    // Estados de mutaciones
    creandoIndisponibilidad: crearIndisponibilidad.isPending,
    resolviendoIndisponibilidad: resolverIndisponibilidad.isPending,
  };
};