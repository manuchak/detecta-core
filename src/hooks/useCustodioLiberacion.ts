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

  // Actualizar checklist (incluye datos de contacto del candidato y ubicación)
  const updateChecklist = useMutation({
    mutationFn: async ({ 
      id, 
      updates,
      candidatoUpdates
    }: { 
      id: string; 
      updates: Partial<CustodioLiberacion>;
      candidatoUpdates?: { 
        nombre?: string; 
        telefono?: string; 
        email?: string; 
        vehiculo_propio?: boolean;
      };
    }) => {
      // Preparar updates de liberación incluyendo campos de ubicación
      const liberacionUpdates: Record<string, unknown> = { ...updates };
      
      // Asegurar que los campos de ubicación se incluyan si existen en updates
      if ('direccion_residencia' in updates) {
        liberacionUpdates.direccion_residencia = updates.direccion_residencia;
      }
      if ('estado_residencia_id' in updates) {
        liberacionUpdates.estado_residencia_id = updates.estado_residencia_id;
      }
      if ('ciudad_residencia' in updates) {
        liberacionUpdates.ciudad_residencia = updates.ciudad_residencia;
      }
      
      // Actualizar liberación con campos de ubicación
      const { data, error } = await supabase
        .from('custodio_liberacion')
        .update(liberacionUpdates)
        .eq('id', id)
        .select('candidato_id')
        .single();
      
      if (error) throw error;

      // Si hay updates del candidato, actualizar candidatos_custodios
      if (candidatoUpdates && Object.keys(candidatoUpdates).length > 0 && data?.candidato_id) {
        const { error: candidatoError } = await supabase
          .from('candidatos_custodios')
          .update({
            ...candidatoUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.candidato_id);
        
        if (candidatoError) {
          console.error('Error actualizando datos del candidato:', candidatoError);
          throw new Error('Error actualizando datos del candidato: ' + candidatoError.message);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodio-liberacion'] });
      queryClient.invalidateQueries({ queryKey: ['candidatos-custodios'] });
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

  // Liberar custodio (función final) - retorna datos para modal de éxito
  const liberarCustodio = useMutation({
    mutationFn: async ({ 
      liberacion_id, 
      forzar = true 
    }: { 
      liberacion_id: string;
      forzar?: boolean;
    }) => {
      console.log('🚀 Iniciando liberación:', { liberacion_id, forzar });
      
      const { data: user } = await supabase.auth.getUser();
      
      // Usar v2 canónica para máxima estabilidad (wrapper legacy sigue existiendo para clientes viejos)
      const { data, error } = await supabase.rpc('liberar_custodio_a_planeacion_v2', {
        p_custodio_liberacion_id: liberacion_id,
        p_aprobado_por: user.user?.id,
        p_forzar_liberacion: forzar
      });
      
      if (error) {
        console.error('❌ Error RPC liberación:', error);
        if (error.message?.includes('schema cache') || error.message?.includes('function')) {
          throw new Error('Tu app parece desactualizada. Recarga con Ctrl+Shift+R o abre en modo incógnito.');
        }
        throw error;
      }

      // ✅ FIX: Validar success del resultado RPC (soft errors)
      if (!data?.success) {
        console.error('❌ RPC retornó error de negocio:', data);
        throw new Error(data?.error || 'Error desconocido en la liberación');
      }
      
      const result = data as {
        success: boolean;
        pc_custodio_id: string;
        custodio_operativo_id: string;
        candidato_id: string;
        candidato_nombre: string;
        candidato_email: string | null;
        candidato_telefono: string | null;
        warnings: string[];
        fases_incompletas: string[];
        tiene_warnings: boolean;
        mensaje: string;
        invitation_token: string;
        sync_status?: {
          pc_custodios_synced: boolean;
          custodios_operativos_synced: boolean;
          pc_custodios_was_existing: boolean;
          custodios_operativos_was_existing: boolean;
          nombre_normalizado: string;
        };
      };

      // ✅ VERIFICACIÓN POST-LIBERACIÓN: Validar sincronización Y estado activo
      const syncVerified = result.pc_custodio_id && result.custodio_operativo_id;
      let estadoVerified = false;
      
      if (syncVerified && result.custodio_operativo_id) {
        // Verificar que el custodio quedó con estado='activo' en custodios_operativos
        const { data: verification, error: verifyError } = await supabase
          .from('custodios_operativos')
          .select('estado, disponibilidad, nombre')
          .eq('id', result.custodio_operativo_id)
          .single();
        
        if (verifyError) {
          console.error('❌ Error verificando estado post-liberación:', verifyError);
        } else if (verification) {
          estadoVerified = verification.estado === 'activo';
          
          if (!estadoVerified) {
            console.error('⚠️ ALERTA: Custodio liberado pero estado NO es activo:', {
              nombre: verification.nombre,
              estado_actual: verification.estado,
              disponibilidad: verification.disponibilidad
            });
            result.warnings = result.warnings || [];
            result.warnings.push(`⚠️ Estado=${verification.estado} en lugar de 'activo' - reportar a soporte`);
          } else {
            console.log('✅ Estado verificado:', {
              nombre: verification.nombre,
              estado: verification.estado,
              disponibilidad: verification.disponibilidad
            });
          }
        }
      }
      
      if (!syncVerified) {
        console.error('⚠️ Liberación exitosa pero sincronización incompleta:', {
          pc_custodio_id: result.pc_custodio_id,
          custodio_operativo_id: result.custodio_operativo_id,
          sync_status: result.sync_status
        });
        result.warnings = result.warnings || [];
        result.warnings.push('⚠️ Sincronización incompleta - verificar en Planeación');
      } else {
        console.log('✅ Liberación verificada:', {
          pc_custodio_id: result.pc_custodio_id,
          custodio_operativo_id: result.custodio_operativo_id,
          sync_status: result.sync_status,
          estado_activo_verificado: estadoVerified
        });
      }

      // Intentar enviar email si hay datos disponibles
      let emailSent = false;
      if (result.invitation_token && result.candidato_email) {
        try {
          const invitationLink = `${window.location.origin}/auth/registro-custodio?token=${result.invitation_token}`;
          
          const { error: emailError } = await supabase.functions.invoke('send-custodian-invitation', {
            body: {
              email: result.candidato_email,
              nombre: result.candidato_nombre,
              telefono: result.candidato_telefono,
              invitationLink
            }
          });
          
          emailSent = !emailError;
          if (emailError) {
            console.error('Error enviando email de invitación:', emailError);
          }
        } catch (emailError) {
          console.error('Error invocando Edge Function:', emailError);
        }
      }

      // Retornar resultado extendido con estado de email y verificación
      return {
        ...result,
        emailSent,
        syncVerified
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['custodio-liberacion'] });
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      queryClient.invalidateQueries({ queryKey: ['pc-custodios'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-operativos'] });
      
      // Toast con estado de sincronización
      const syncIcon = data.syncVerified ? '🎉' : '⚠️';
      toast({
        title: `${syncIcon} Custodio Liberado`,
        description: data.syncVerified 
          ? `${data.candidato_nombre} sincronizado con Planeación.`
          : `${data.candidato_nombre} liberado pero verificar sincronización.`
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
    
    // GPS: completado = 100, pendiente (diferido) = 100 (no bloquea), else 0
    const gps = liberacion.instalacion_gps_completado ? 100 : (liberacion.gps_pendiente ? 100 : 0);
    
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
