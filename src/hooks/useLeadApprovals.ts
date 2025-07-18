
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AssignedLead, LeadEstado } from "@/types/leadTypes";
import { VapiCallLog } from "@/types/vapiTypes";
import { validateLeadForApproval, getValidationMessage } from "@/utils/leadValidation";

export const useLeadApprovals = () => {
  const [assignedLeads, setAssignedLeads] = useState<AssignedLead[]>([]);
  const [callLogs, setCallLogs] = useState<VapiCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssignedLeads = async () => {
    try {
      console.log('Fetching assigned leads...');
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id, user?.email);
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      const { data, error } = await supabase.rpc('get_analyst_assigned_leads');
      
      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      
      console.log('Assigned leads data:', data);
      // Convertir datos de la DB al tipo AssignedLead
      const typedLeads: AssignedLead[] = (data || []).map(lead => ({
        ...lead,
        lead_estado: lead.lead_estado as LeadEstado
      }));
      setAssignedLeads(typedLeads);
      
      if (!data || data.length === 0) {
        toast({
          title: "Sin candidatos asignados",
          description: "No tienes candidatos asignados en este momento.",
        });
      }
    } catch (error) {
      console.error('Error fetching assigned leads:', error);
      toast({
        title: "Error",
        description: `No se pudieron cargar los candidatos asignados: ${error.message}`,
        variant: "destructive",
      });
    } finally {
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

  // Fetch leads with call status
  const fetchLeadsWithCallStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get manual call logs including reschedule information
      const { data: callData } = await supabase
        .from('manual_call_logs')
        .select('lead_id, call_outcome, scheduled_datetime, created_at')
        .order('created_at', { ascending: false });

      // Update leads with call status
      setAssignedLeads(prev => prev.map(lead => {
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
          last_call_outcome: lastCall?.call_outcome,
          has_scheduled_call: !!rescheduledCall,
          scheduled_call_datetime: rescheduledCall?.scheduled_datetime
        };
      }));
    } catch (error) {
      console.error('Error fetching call status:', error);
    }
  };

  const handleApproveLead = async (lead: AssignedLead) => {
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
      const { error: approvalError } = await supabase
        .from('lead_approval_process')
        .upsert({
          lead_id: lead.lead_id,
          analyst_id: (await supabase.auth.getUser()).data.user?.id,
          current_stage: 'approved',
          interview_method: 'manual',
          phone_interview_notes: 'Aprobado directamente por el analista',
          final_decision: 'approved',
          decision_reason: 'Candidato calificado - aprobación directa',
          phone_interview_completed: true,
          second_interview_required: false,
          updated_at: new Date().toISOString()
        });

      if (approvalError) throw approvalError;

      const { error: leadError } = await supabase
        .from('leads')
        .update({
          estado: 'aprobado',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.lead_id);

      if (leadError) throw leadError;

      toast({
        title: "Candidato aprobado",
        description: "El candidato ha sido aprobado directamente.",
      });

      fetchAssignedLeads();
    } catch (error) {
      console.error('Error approving lead:', error);
      toast({
        title: "Error",
        description: "No se pudo aprobar el candidato.",
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
      const { error: approvalError } = await supabase
        .from('lead_approval_process')
        .upsert({
          lead_id: lead.lead_id,
          analyst_id: (await supabase.auth.getUser()).data.user?.id,
          current_stage: 'second_interview',
          interview_method: 'manual',
          phone_interview_notes: 'Enviado a segunda entrevista por el analista',
          final_decision: null,
          decision_reason: 'Requiere evaluación adicional en segunda entrevista',
          phone_interview_completed: true,
          second_interview_required: true,
          updated_at: new Date().toISOString()
        });

      if (approvalError) throw approvalError;

      toast({
        title: "Candidato enviado a segunda entrevista",
        description: "El candidato ha sido programado para segunda entrevista.",
      });

      fetchAssignedLeads();
    } catch (error) {
      console.error('Error sending to second interview:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar a segunda entrevista.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (lead: AssignedLead) => {
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

      console.log('Lead data:', leadData);
      console.log('Lead asignado a:', leadData?.asignado_a);
      console.log('Usuario actual:', user.id);
      
      // Primero intentar crear/actualizar el proceso de aprobación
      const { error: approvalError } = await supabase
        .from('lead_approval_process')
        .upsert({
          lead_id: lead.lead_id,
          analyst_id: user.id,
          current_stage: 'rejected',
          interview_method: 'manual',
          phone_interview_notes: 'Rechazado por el analista',
          final_decision: 'rejected',
          decision_reason: 'No cumple con los requisitos',
          phone_interview_completed: true,
          second_interview_required: false,
          updated_at: new Date().toISOString()
        });

      if (approvalError) {
        console.error('Error en lead_approval_process:', approvalError);
        throw new Error(`Error en proceso de aprobación: ${approvalError.message}`);
      }

      // Luego actualizar el lead
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          estado: 'rechazado',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.lead_id);

      if (leadError) {
        console.error('Error actualizando lead:', leadError);
        throw new Error(`Error actualizando lead: ${leadError.message}`);
      }

      console.log('Lead rechazado exitosamente');

      toast({
        title: "Candidato rechazado",
        description: "El candidato ha sido rechazado.",
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
      await fetchLeadsWithCallStatus();
      await fetchCallLogs();
    };
    loadData();
  }, []);

  const refreshAfterCall = async () => {
    await fetchAssignedLeads();
    await fetchLeadsWithCallStatus();
    await fetchCallLogs();
  };

  return {
    assignedLeads,
    callLogs,
    loading,
    fetchAssignedLeads: async () => {
      await fetchAssignedLeads();
      await fetchLeadsWithCallStatus();
    },
    fetchCallLogs,
    refreshAfterCall,
    handleApproveLead,
    handleSendToSecondInterview,
    handleReject
  };
};
