import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustodioLiberacion, ChecklistProgress } from '@/types/liberacion';

export const useCustodioLiberacion = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch todas las liberaciones
  const { data: liberaciones, isLoading } = useQuery({
    queryKey: ['custodio-liberacion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custodio_liberacion')
        .select(`
          *,
          candidato:candidatos_custodios(
            nombre,
            telefono,
            email,
            zona_preferida_id,
            vehiculo_propio
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CustodioLiberacion[];
    }
  });

  // Fetch una liberación específica
  const fetchLiberacion = async (id: string) => {
    const { data, error } = await supabase
      .from('custodio_liberacion')
      .select(`
        *,
        candidato:candidatos_custodios(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as CustodioLiberacion;
  };

  // Crear registro de liberación
  const createLiberacion = useMutation({
    mutationFn: async (lead_id: string) => {
      // 🔄 ARQUITECTURA: Obtener candidato_custodio_id del lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('candidato_custodio_id, nombre, email, telefono')
        .eq('id', lead_id)
        .single();

      if (leadError) throw new Error(`Error obteniendo lead: ${leadError.message}`);
      
      if (!lead?.candidato_custodio_id) {
        throw new Error('Este lead no tiene un candidato vinculado. Debe ser aprobado primero.');
      }

      const candidato_id = lead.candidato_custodio_id;

      const { data: existing } = await supabase
        .from('custodio_liberacion')
        .select('id')
        .eq('candidato_id', candidato_id)
        .single();
      
      if (existing) {
        throw new Error('Ya existe un registro de liberación para este candidato');
      }
      
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('custodio_liberacion')
        .insert({
          candidato_id,
          estado_liberacion: 'pendiente',
          created_by: user.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;

      // 🔄 SINCRONIZACIÓN CRÍTICA: Actualizar estado del candidato
      const { error: candidatoError } = await supabase
        .from('candidatos_custodios')
        .update({
          estado_proceso: 'en_liberacion',
          updated_at: new Date().toISOString()
        })
        .eq('id', candidato_id);

      if (candidatoError) {
        console.error('Error actualizando estado del candidato:', candidatoError);
        console.warn('⚠️ Liberación creada pero candidato no sincronizado');
      } else {
        console.log('✅ Candidato sincronizado con estado: en_liberacion');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodio-liberacion'] });
      toast({
        title: 'Éxito',
        description: 'Proceso de liberación iniciado'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Actualizar checklist
  const updateChecklist = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<CustodioLiberacion> 
    }) => {
      const { data, error } = await supabase
        .from('custodio_liberacion')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodio-liberacion'] });
      toast({
        title: 'Actualizado',
        description: 'Checklist actualizado correctamente'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Liberar custodio (función final)
  const liberarCustodio = useMutation({
    mutationFn: async (liberacion_id: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('liberar_custodio_a_planeacion', {
        p_liberacion_id: liberacion_id,
        p_liberado_por: user.user?.id
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodio-liberacion'] });
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      toast({
        title: '🎉 Custodio Liberado',
        description: 'El custodio ha sido activado y está disponible para Planificación'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al liberar',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Calcular progreso del checklist
  // Psicométricos ahora es OPCIONAL - no afecta el total
  const calculateProgress = (liberacion: CustodioLiberacion): ChecklistProgress => {
    const documentacion = [
      liberacion.documentacion_ine,
      liberacion.documentacion_licencia,
      liberacion.documentacion_antecedentes,
      liberacion.documentacion_domicilio,
      liberacion.documentacion_curp,
      liberacion.documentacion_rfc
    ].filter(Boolean).length;
    
    const psicometricos = liberacion.psicometricos_completado ? 100 : 0;
    const toxicologicos = liberacion.toxicologicos_completado ? 100 : 0;
    
    let vehiculo = 0;
    if (liberacion.candidato?.vehiculo_propio) {
      const vehiculoItems = [
        liberacion.vehiculo_capturado,
        liberacion.vehiculo_tarjeta_circulacion,
        liberacion.vehiculo_poliza_seguro
      ].filter(Boolean).length;
      vehiculo = (vehiculoItems / 3) * 100;
    } else {
      vehiculo = 100; // No aplica
    }
    
    const gps = liberacion.instalacion_gps_completado ? 100 : 0;
    
    // Total calculado SIN psicométricos (4 componentes en lugar de 5)
    const total = Math.round(
      (documentacion / 6 * 100 + toxicologicos + vehiculo + gps) / 4
    );
    
    return {
      documentacion: Math.round((documentacion / 6) * 100),
      psicometricos, // Se muestra pero NO afecta el total
      toxicologicos,
      vehiculo: Math.round(vehiculo),
      gps,
      total
    };
  };

  return {
    liberaciones,
    isLoading,
    fetchLiberacion,
    createLiberacion,
    updateChecklist,
    liberarCustodio,
    calculateProgress
  };
};
