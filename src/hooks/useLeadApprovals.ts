
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSandboxAwareSupabase } from "@/hooks/useSandboxAwareSupabase";
import { useToast } from "@/hooks/use-toast";
import { AssignedLead, LeadEstado } from "@/types/leadTypes";
import { VapiCallLog } from "@/types/vapiTypes";
import { validateLeadForApproval, getValidationMessage } from "@/utils/leadValidation";
import { useSandbox } from "@/hooks";

export const useLeadApprovals = () => {
  const sbx = useSandboxAwareSupabase(); // ✅ Hook Sandbox-aware
  const { isSandboxMode, subscribeModeChange } = useSandbox();
  const [assignedLeads, setAssignedLeads] = useState<AssignedLead[]>([]);
  const [callLogs, setCallLogs] = useState<VapiCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // 50 leads por página (configurable)
  const [dateFilter, setDateFilter] = useState<{from?: string, to?: string}>({});
  const { toast } = useToast();

  // ✅ Auto-refresh al cambiar de modo
  useEffect(() => {
    const unsubscribe = subscribeModeChange((newMode) => {
      console.log('🔄 useLeadApprovals: Modo cambiado, recargando datos...', { newMode });
      setAssignedLeads([]); // Limpiar datos para feedback visual
      setLoading(true);
      fetchAssignedLeads();
    });

    return unsubscribe;
  }, []);

  // ✅ Resetear a página 1 cuando cambie el tamaño de página
  useEffect(() => {
    if (page !== 1) {
      console.log('🔄 useLeadApprovals: pageSize cambió, reseteando a página 1');
      setPage(1);
      fetchAssignedLeads(1, dateFilter);
    } else {
      fetchAssignedLeads(1, dateFilter);
    }
  }, [pageSize]);

  const fetchAssignedLeads = async (currentPage = page, filters = dateFilter) => {
    try {
      setLoading(true);
      
      // ✅ Paso 3: Validar consistencia al inicio
      const localStorageSandbox = localStorage.getItem('sandbox-mode') === 'true';
      const timestamp = localStorage.getItem('sandbox-mode-timestamp') || 'Desconocido';
      
      console.log('🔍 LeadApprovals: Validación de consistencia', {
        localStorage: localStorageSandbox,
        contextValue: isSandboxMode,
        timestamp,
        url: window.location.href
      });
      
      if (localStorageSandbox !== isSandboxMode) {
        console.error('⚠️ INCONSISTENCIA CRÍTICA DETECTADA', {
          localStorage: localStorageSandbox,
          contextValue: isSandboxMode,
          timestamp
        });
        
        toast({
          title: "⚠️ Inconsistencia de Ambiente",
          description: "El modo Sandbox no está sincronizado. Recargando...",
          variant: "destructive"
        });
        
        // Forzar recarga para sincronizar
        setTimeout(() => window.location.reload(), 1500);
        return;
      }
      
      console.log('🔍 LeadApprovals: Fetching assigned leads...');
      console.log(`📍 Ambiente confirmado: ${isSandboxMode ? '🧪 SANDBOX' : '🛡️ PRODUCCIÓN'}`);
      console.log(`📄 Página ${currentPage}, mostrando ${pageSize} leads por página`);
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 LeadApprovals: Current user:', user?.id, user?.email);
      
      if (!user) {
        console.error('❌ LeadApprovals: Usuario no autenticado');
        throw new Error('Usuario no autenticado');
      }
      
      // Calcular offset para paginación
      const offset = (currentPage - 1) * pageSize;
      
      console.log('🔍 LeadApprovals: Calling get_analyst_assigned_leads RPC with pagination...');
      // Llamar ambas funciones en paralelo para obtener datos y conteo
      const [{ data, error }, { data: countData, error: countError }] = await Promise.all([
        sbx.rpc('get_analyst_assigned_leads', {
          p_limit: pageSize,
          p_offset: offset,
          p_date_from: filters.from || null,
          p_date_to: filters.to || null
        }),
        sbx.rpc('count_analyst_assigned_leads', {
          p_date_from: filters.from || null,
          p_date_to: filters.to || null
        })
      ]);
      
      if (error) {
        console.error('❌ LeadApprovals: RPC Error:', error);
        throw error;
      }
      
      if (countError) {
        console.error('❌ LeadApprovals: Count RPC Error:', countError);
        throw countError;
      }
      
      console.log('✅ LeadApprovals: Assigned leads data received:', data?.length || 0, 'leads');
      console.log('✅ LeadApprovals: Total count:', countData);
      
      // Convertir datos de la DB al tipo AssignedLead
      // La función RPC ya devuelve los campos con el prefijo correcto (lead_nombre, lead_email, etc.)
      const typedLeads: AssignedLead[] = (data || []).map(lead => ({
        lead_id: lead.lead_id,
        lead_nombre: lead.lead_nombre,
        lead_email: lead.lead_email,
        lead_telefono: lead.lead_telefono,
        lead_estado: lead.lead_estado as LeadEstado,
        lead_fecha_creacion: lead.lead_fecha_creacion,
        current_stage: lead.approval_stage || 'phone_interview',
        phone_interview_completed: lead.phone_interview_completed || false,
        second_interview_required: lead.second_interview_required || false,
        final_decision: lead.final_decision,
        notas: lead.notas,
        scheduled_call_datetime: lead.scheduled_call_datetime,
        // 🔗 Campo crítico para detectar leads aprobados sin candidato vinculado
        candidato_custodio_id: lead.candidato_custodio_id,
        // Pool de Reserva
        zona_preferida_id: lead.zona_preferida_id,
        zona_nombre: lead.zona_nombre,
        fecha_entrada_pool: lead.fecha_entrada_pool,
        // 👤 Información del analista asignado
        asignado_a: lead.asignado_a,
        analista_nombre: lead.analista_nombre,
        analista_email: lead.analista_email,
      }));
      
      // ✅ CORRECCIÓN FASE 1: Obtener call status de manera síncrona ANTES de actualizar estado
      const leadsWithCallStatus = await fetchLeadsWithCallStatus(typedLeads);
      
      // ✅ Ahora sí actualizar estado con todos los datos completos
      setAssignedLeads(leadsWithCallStatus);
      setTotalCount(countData || 0);
      setPage(currentPage);
      
      console.log(`✅ Cargados ${leadsWithCallStatus.length} de ${countData} leads totales con estado de llamadas actualizado (página ${currentPage})`);
      
      if (!data || data.length === 0) {
        console.log('📝 LeadApprovals: No leads assigned to current user');
        toast({
          title: "Sin candidatos asignados",
          description: "No tienes candidatos asignados en este momento.",
        });
      }
    } catch (error) {
      console.error('❌ LeadApprovals: Error fetching assigned leads:', error);
      toast({
        title: "Error",
        description: `No se pudieron cargar los candidatos asignados: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      console.log('🏁 LeadApprovals: fetchAssignedLeads completed, setting loading to false');
      setLoading(false);
    }
  };

  const fetchCallLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('vapi_call_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCallLogs(data || []);
    } catch (error) {
      console.error('Error fetching call logs:', error);
    }
  };

  // ✅ Fetch leads with call status - CORREGIDO: Recibe leads como parámetro para evitar race condition
  const fetchLeadsWithCallStatus = async (currentLeads: AssignedLead[]): Promise<AssignedLead[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return currentLeads;

      // Get manual call logs including reschedule information
      const { data: callData } = await supabase
        .from('manual_call_logs')
        .select('lead_id, call_outcome, scheduled_datetime, created_at')
        .order('created_at', { ascending: false });

      // Update leads with call status y RETORNAR el array actualizado
      const updatedLeads = currentLeads.map(lead => {
        const leadCalls = callData?.filter(call => call.lead_id === lead.lead_id) || [];
        const hasSuccessfulCall = leadCalls.some(call => call.call_outcome === 'successful');
        const lastCall = leadCalls[0];
        
        // Check for rescheduled calls
        const rescheduledCall = leadCalls.find(call => 
          call.call_outcome === 'reschedule_requested' && 
          call.scheduled_datetime &&
          new Date(call.scheduled_datetime) > new Date()
        );
        
        return {
          ...lead,
          has_successful_call: hasSuccessfulCall,
          last_contact_outcome: lastCall?.call_outcome, // ✅ CAMBIO: last_call_outcome -> last_contact_outcome
          has_scheduled_call: !!rescheduledCall,
          scheduled_call_datetime: rescheduledCall?.scheduled_datetime,
          contact_attempts_count: leadCalls.length // ✅ NUEVO: Contador de intentos
        };
      });

      // ✅ FASE 4: Logging para monitoreo
      const failedOutcomes = ['voicemail', 'no_answer', 'busy', 'wrong_number', 'non_existent_number', 'call_failed'];
      console.log('📊 Estado de llamadas actualizado:', {
        totalLeads: updatedLeads.length,
        conLlamadas: updatedLeads.filter(l => l.contact_attempts_count && l.contact_attempts_count > 0).length,
        llamadasExitosas: updatedLeads.filter(l => l.has_successful_call).length,
        intentosFallidos: updatedLeads.filter(l => {
          return l.last_contact_outcome && failedOutcomes.includes(l.last_contact_outcome);
        }).length
      });
      
      return updatedLeads;
    } catch (error) {
      console.error('Error fetching call status:', error);
      return currentLeads; // Retornar leads sin cambios si hay error
    }
  };

  const handleApproveLead = async (lead: AssignedLead) => {
    // Verificar que hay una llamada exitosa registrada
    const { data: successfulCall } = await supabase
      .from('manual_call_logs')
      .select('*')
      .eq('lead_id', lead.lead_id)
      .eq('call_outcome', 'successful')
      .limit(1);

    if (!successfulCall || successfulCall.length === 0) {
      toast({
        title: "Llamada requerida",
        description: "Debes registrar una llamada exitosa antes de aprobar el candidato.",
        variant: "destructive"
      });
      return;
    }

    // Validar que todos los campos requeridos estén completos
    const validation = validateLeadForApproval(lead);
    
    if (!validation.isValid) {
      const message = getValidationMessage(validation.missingFields);
      toast({
        title: "Información incompleta",
        description: `No se puede aprobar el candidato. ${message}. Por favor, edita el candidato y completa la información faltante.`,
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Iniciando proceso de aprobación para lead:', lead.lead_id);
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuario actual:', user?.id, user?.email);
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Si hay zona_preferida_id, verificar capacidad
      if (lead.zona_preferida_id) {
        const { data: capacityData } = await sbx.rpc('check_zone_capacity', {
          p_zona_id: lead.zona_preferida_id
        });
        
        const capacity = capacityData as any;
        if (capacity?.zona_saturada) {
          // Mostrar opción para enviar al pool
          const shouldMoveToPool = window.confirm(
            `La zona "${lead.zona_nombre || 'seleccionada'}" está saturada (${capacity.capacidad_actual}/${capacity.capacidad_maxima} custodios). ¿Deseas mover este candidato al Pool de Reserva para contactarlo cuando se libere espacio?`
          );
          
          if (shouldMoveToPool) {
            const { data: moveResult } = await sbx.rpc('move_lead_to_pool', {
              p_lead_id: lead.lead_id,
              p_zona_id: lead.zona_preferida_id,
              p_motivo: `Zona saturada - ${capacity.capacidad_actual}/${capacity.capacidad_maxima} custodios`
            });
            
            if (moveResult) {
              toast({
                title: "Candidato movido al Pool de Reserva",
                description: `El candidato ha sido aprobado y agregado al pool de reserva. Será contactado cuando se libere capacidad en la zona.`,
              });
              await refreshAfterCall();
              return;
            }
          } else {
            // Usuario decidió no mover al pool, continuar con aprobación normal
            toast({
              title: "Zona saturada",
              description: "La zona está saturada pero el candidato será aprobado normalmente.",
              variant: "warning" as any
            });
          }
        }
      }

      // Verificar que el lead existe y obtener su información de asignación
      const { data: leadData, error: leadCheckError } = await supabase
        .from('leads')
        .select('id, asignado_a, estado')
        .eq('id', lead.lead_id)
        .single();

      if (leadCheckError) {
        console.error('Error verificando lead:', leadCheckError);
        throw new Error(`No se pudo verificar el lead: ${leadCheckError.message}`);
      }

      console.log('Lead data:', leadData);
      console.log('Lead asignado a:', leadData?.asignado_a);
      console.log('Usuario actual:', user.id);

      // Crear/actualizar el proceso de aprobación usando upsert
      const { error: approvalError } = await sbx.upsert('lead_approval_process', {
        lead_id: lead.lead_id,
        analyst_id: user.id,
        current_stage: 'approved',
        interview_method: 'manual',
        phone_interview_notes: 'Aprobado después de llamada exitosa',
        final_decision: 'approved',
        decision_reason: 'Candidato calificado - aprobación después de entrevista telefónica',
        phone_interview_completed: true,
        second_interview_required: false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'lead_id' });

      if (approvalError) {
        console.error('Error en lead_approval_process:', approvalError);
        throw new Error(`Error en proceso de aprobación: ${approvalError.message}`);
      }

      // 🔄 ARQUITECTURA FIX: Determinar tipo de operativo y sincronizar con tabla correcta
      let notesData: Record<string, any> = {};
      try {
        notesData = lead.notas ? JSON.parse(lead.notas) : {};
      } catch { notesData = {}; }

      const tipoCustodio = notesData.tipo_custodio || 'custodio_vehiculo';
      const esArmado = tipoCustodio === 'armado';

      console.log(`🔀 Tipo operativo detectado: ${tipoCustodio} (esArmado: ${esArmado})`);

      let candidatoId: string;
      let syncError: any;

      if (esArmado) {
        // Sincronizar con candidatos_armados
        const seguridadArmada = notesData.seguridad_armada || {};
        const { data, error } = await supabase
          .rpc('sync_lead_to_candidato_armado', {
            p_lead_id: lead.lead_id,
            p_nombre: lead.lead_nombre,
            p_email: lead.lead_email,
            p_telefono: lead.lead_telefono || '',
            p_fuente: 'Plataforma Detecta',
            p_estado_proceso: 'aprobado',
            p_tipo_armado: 'interno',
            p_licencia_portacion: seguridadArmada.licencia_armas || null,
            p_experiencia_seguridad: !!seguridadArmada.experiencia_militar
          });
        candidatoId = data;
        syncError = error;
      } else {
        // Sincronizar con candidatos_custodios (flujo original)
        const { data, error } = await supabase
          .rpc('sync_lead_to_candidato', {
            p_lead_id: lead.lead_id,
            p_nombre: lead.lead_nombre,
            p_email: lead.lead_email,
            p_telefono: lead.lead_telefono || '',
            p_fuente: 'Plataforma Detecta',
            p_estado_proceso: 'aprobado'
          });
        candidatoId = data;
        syncError = error;
      }

      if (syncError) {
        console.error('❌ Error sincronizando candidato:', syncError);
        throw new Error(`Error vinculando candidato: ${syncError.message}. El lead NO fue aprobado.`);
      }

      console.log(`✅ Candidato ${esArmado ? 'armado' : 'custodio'} vinculado exitosamente:`, candidatoId);

      // 🚗 Migrar datos adicionales desde notas del lead al candidato (solo para custodios)
      if (!esArmado) {
        try {
          const vehiculo = notesData.vehiculo || {};
          const datosPersonales = notesData.datos_personales || {};
          const experiencia = notesData.experiencia || {};

          const updatePayload: Record<string, any> = {};
          if (vehiculo.marca_vehiculo) updatePayload.marca_vehiculo = vehiculo.marca_vehiculo;
          if (vehiculo.modelo_vehiculo) updatePayload.modelo_vehiculo = vehiculo.modelo_vehiculo;
          if (vehiculo.placas) updatePayload.placas_vehiculo = vehiculo.placas;
          if (vehiculo.color_vehiculo) updatePayload.color_vehiculo = vehiculo.color_vehiculo;
          if (vehiculo.numero_serie) updatePayload.numero_serie = vehiculo.numero_serie;
          if (experiencia.licencia_conducir) updatePayload.numero_licencia = experiencia.licencia_conducir;
          if (experiencia.tipo_licencia) updatePayload.licencia_expedida_por = experiencia.tipo_licencia;
          if (datosPersonales.direccion) updatePayload.direccion = datosPersonales.direccion;

          if (Object.keys(updatePayload).length > 0) {
            const { error: vehicleError } = await supabase
              .from('candidatos_custodios')
              .update(updatePayload)
              .eq('id', candidatoId);

            if (vehicleError) {
              console.warn('⚠️ No se pudieron migrar datos vehiculares:', vehicleError);
            } else {
              console.log('✅ Datos vehiculares migrados al candidato:', Object.keys(updatePayload));
            }
          }
        } catch (vehicleErr) {
          console.warn('⚠️ Error migrando datos vehiculares:', vehicleErr);
        }
      } else {
        // Para armados, migrar datos de seguridad armada
        try {
          const seguridadArmada = notesData.seguridad_armada || {};
          const updatePayload: Record<string, any> = {};
          if (seguridadArmada.licencia_armas) updatePayload.licencia_portacion = seguridadArmada.licencia_armas;
          if (seguridadArmada.años_experiencia_armada) updatePayload.experiencia_seguridad = true;

          if (Object.keys(updatePayload).length > 0) {
            const { error: armadoError } = await supabase
              .from('candidatos_armados')
              .update(updatePayload)
              .eq('id', candidatoId);

            if (armadoError) {
              console.warn('⚠️ No se pudieron migrar datos de armado:', armadoError);
            } else {
              console.log('✅ Datos de seguridad armada migrados:', Object.keys(updatePayload));
            }
          }
        } catch (armadoErr) {
          console.warn('⚠️ Error migrando datos de armado:', armadoErr);
        }
      }

      // Solo si la sincronización fue exitosa, actualizar el lead a aprobado
      const { error: leadError } = await sbx.update('leads', {
        estado: 'aprobado',
        updated_at: new Date().toISOString()
      }).eq('id', lead.lead_id);

      if (leadError) {
        console.error('Error actualizando lead:', leadError);
        // Nota: El candidato ya fue creado, pero el lead no se actualizó
        // Esto es menos grave que el caso inverso (lead aprobado sin candidato)
        throw new Error(`Error actualizando lead: ${leadError.message}`);
      }

      console.log('✅ Lead aprobado y candidato vinculado correctamente:', candidatoId);

      toast({
        title: "Candidato aprobado",
        description: "El candidato ha sido aprobado exitosamente.",
      });

      await refreshAfterCall();
    } catch (error) {
      console.error('Error completo al aprobar lead:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error",
        description: `No se pudo aprobar el candidato: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleSendToSecondInterview = async (lead: AssignedLead) => {
    // Validar que todos los campos requeridos estén completos
    const validation = validateLeadForApproval(lead);
    
    if (!validation.isValid) {
      const message = getValidationMessage(validation.missingFields);
      toast({
        title: "Información incompleta",
        description: `No se puede enviar a segunda entrevista. ${message}. Por favor, edita el candidato y completa la información faltante.`,
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Iniciando proceso de segunda entrevista para lead:', lead.lead_id);
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuario actual:', user?.id, user?.email);
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que el lead existe y obtener su información de asignación
      const { data: leadData, error: leadCheckError } = await supabase
        .from('leads')
        .select('id, asignado_a, estado')
        .eq('id', lead.lead_id)
        .single();

      if (leadCheckError) {
        console.error('Error verificando lead:', leadCheckError);
        throw new Error(`No se pudo verificar el lead: ${leadCheckError.message}`);
      }

      console.log('Lead data:', leadData);
      console.log('Lead asignado a:', leadData?.asignado_a);
      console.log('Usuario actual:', user.id);

      // Crear/actualizar el proceso de aprobación usando upsert
      const { error: approvalError } = await sbx.upsert('lead_approval_process', {
        lead_id: lead.lead_id,
        analyst_id: user.id,
        current_stage: 'second_interview',
        interview_method: 'manual',
        phone_interview_notes: 'Enviado a segunda entrevista por el analista',
        final_decision: null,
        decision_reason: 'Requiere evaluación adicional en segunda entrevista',
        phone_interview_completed: true,
        second_interview_required: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'lead_id' });

      if (approvalError) {
        console.error('Error en lead_approval_process:', approvalError);
        throw new Error(`Error en proceso de aprobación: ${approvalError.message}`);
      }

      console.log('Lead enviado a segunda entrevista exitosamente');

      toast({
        title: "Candidato enviado a segunda entrevista",
        description: "El candidato ha sido programado para segunda entrevista.",
      });

      fetchAssignedLeads();
    } catch (error) {
      console.error('Error completo al enviar a segunda entrevista:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error",
        description: `No se pudo enviar a segunda entrevista: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleRejectWithReasons = async (lead: AssignedLead, rejectionReasons: string[] = [], customReason: string = "") => {
    // Para rechazar no se requiere validación de campos completos
    try {
      console.log('Iniciando proceso de rechazo para lead:', lead.lead_id);
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuario actual:', user?.id, user?.email);
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que el lead existe y obtener su información de asignación
      const { data: leadData, error: leadCheckError } = await supabase
        .from('leads')
        .select('id, asignado_a, estado')
        .eq('id', lead.lead_id)
        .single();

      if (leadCheckError) {
        console.error('Error verificando lead:', leadCheckError);
        throw new Error(`No se pudo verificar el lead: ${leadCheckError.message}`);
      }

      // Construir el motivo de rechazo completo
      let fullRejectionReason = "";
      if (rejectionReasons.length > 0) {
        fullRejectionReason = rejectionReasons.join("; ");
      }
      if (customReason.trim()) {
        if (fullRejectionReason) {
          fullRejectionReason += "; " + customReason.trim();
        } else {
          fullRejectionReason = customReason.trim();
        }
      }
      
      // Si no hay razones específicas, usar mensaje genérico
      const finalReason = fullRejectionReason || "No cumple con los requisitos";
      
      // Usar la función RPC actualizada que valida el ambiente
      const { error: approvalError } = await sbx.rpc('update_approval_process', {
        p_lead_id: lead.lead_id,
        p_stage: 'rejected',
        p_interview_method: 'manual',
        p_notes: 'Rechazado por el analista',
        p_decision: 'rejected',
        p_decision_reason: finalReason
      });

      if (approvalError) {
        console.error('Error en lead_approval_process:', approvalError);
        throw new Error(`Error en proceso de aprobación: ${approvalError.message}`);
      }

      // Luego actualizar el lead con el motivo de rechazo
      const { error: leadError } = await sbx.update('leads', {
        estado: 'rechazado',
        motivo_rechazo: finalReason,
        updated_at: new Date().toISOString()
      }).eq('id', lead.lead_id);

      if (leadError) {
        console.error('Error actualizando lead:', leadError);
        throw new Error(`Error actualizando lead: ${leadError.message}`);
      }

      console.log('Lead rechazado exitosamente');

      toast({
        title: "Candidato rechazado",
        description: "El candidato ha sido rechazado con las razones especificadas.",
      });

      fetchAssignedLeads();
    } catch (error) {
      console.error('Error completo al rechazar lead:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error",
        description: `No se pudo rechazar el candidato: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchAssignedLeads();
      await fetchCallLogs();
    };
    loadData();
  }, []);

  const refreshAfterCall = async () => {
    await fetchAssignedLeads();
    await fetchCallLogs();
  };

  // Re-vincular leads aprobados que quedaron sin candidato
  // Retorna el candidatoId si tiene éxito para permitir navegación a liberación
  const retryVinculacion = async (lead: AssignedLead): Promise<string | null> => {
    try {
      console.log('🔗 Intentando re-vincular lead:', lead.lead_id);
      
      const { data: candidatoId, error: syncError } = await supabase
        .rpc('sync_lead_to_candidato', {
          p_lead_id: lead.lead_id,
          p_nombre: lead.lead_nombre,
          p_email: lead.lead_email,
          p_telefono: lead.lead_telefono || '',
          p_fuente: 'Plataforma Detecta',
          p_estado_proceso: 'aprobado'
        });

      if (syncError) {
        console.error('❌ Error re-vinculando candidato:', syncError);
        throw new Error(`Error vinculando candidato: ${syncError.message}`);
      }

      // Actualizar estado del lead a aprobado si no lo está
      const { error: leadError } = await sbx.update('leads', {
        estado: 'aprobado',
        updated_at: new Date().toISOString()
      }).eq('id', lead.lead_id);

      if (leadError) {
        console.error('Error actualizando lead:', leadError);
      }

      console.log('✅ Lead re-vinculado exitosamente:', candidatoId);

      await refreshAfterCall();
      
      return candidatoId as string;
    } catch (error) {
      console.error('Error completo al re-vincular lead:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error",
        description: `No se pudo vincular el candidato: ${errorMessage}`,
        variant: "destructive",
      });
      return null;
    }
  };

  // Funciones de paginación
  const goToPage = (newPage: number) => {
    fetchAssignedLeads(newPage, dateFilter);
  };

  const applyDateFilter = (from?: string, to?: string) => {
    const newFilter = { from, to };
    setDateFilter(newFilter);
    fetchAssignedLeads(1, newFilter); // Resetear a página 1 al aplicar filtro
  };

  return {
    assignedLeads,
    callLogs,
    loading,
    totalCount,
    page,
    pageSize,
    setPageSize,
    dateFilter,
    fetchAssignedLeads: async () => {
      await fetchAssignedLeads();
    },
    fetchCallLogs,
    refreshAfterCall,
    handleApproveLead,
    handleSendToSecondInterview,
    handleRejectWithReasons,
    retryVinculacion,
    goToPage,
    applyDateFilter
  };
};
