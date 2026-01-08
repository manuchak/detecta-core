import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { 
  SIERCPInvitation, 
  CreateInvitationData, 
  InvitationValidation,
  SIERCPInvitationStatus,
  SendVia 
} from '@/types/siercpInvitationTypes';

// Extended type with joined evaluation data
export interface SIERCPInvitationWithEvaluation extends SIERCPInvitation {
  evaluacion?: {
    id: string;
    score_global: number;
    resultado_semaforo?: string;
  } | null;
}

/**
 * Hook para gestionar invitaciones SIERCP
 */
export function useSIERCPInvitations(leadId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Obtener invitaciones para un lead específico
  const { data: invitations, isLoading, refetch } = useQuery({
    queryKey: ['siercp-invitations', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from('siercp_invitations')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SIERCPInvitation[];
    },
    enabled: !!leadId,
  });

  // Crear nueva invitación
  const createInvitation = useMutation({
    mutationFn: async (data: CreateInvitationData) => {
      if (!user) throw new Error('Usuario no autenticado');

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (data.expires_hours || 72));

      const { data: invitation, error } = await supabase
        .from('siercp_invitations')
        .insert({
          lead_id: data.lead_id,
          candidato_custodio_id: data.candidato_custodio_id,
          lead_nombre: data.lead_nombre,
          lead_email: data.lead_email,
          lead_telefono: data.lead_telefono,
          expires_at: expiresAt.toISOString(),
          notas: data.notas,
          created_by: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return invitation as SIERCPInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siercp-invitations', leadId] });
      toast({
        title: 'Invitación creada',
        description: 'El enlace de evaluación SIERCP ha sido generado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al crear invitación',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Marcar como enviada
  const markAsSent = useMutation({
    mutationFn: async ({ invitationId, sendVia }: { invitationId: string; sendVia: SendVia }) => {
      const { data, error } = await supabase
        .from('siercp_invitations')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_via: sendVia,
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;
      return data as SIERCPInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siercp-invitations', leadId] });
    },
  });

  // Cancelar invitación
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('siercp_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siercp-invitations', leadId] });
      toast({
        title: 'Invitación cancelada',
        description: 'El enlace ya no será válido.',
      });
    },
  });

  // Generar URL de invitación
  const getInvitationUrl = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/assessment/${token}`;
  };

  // Obtener última invitación activa
  const activeInvitation = invitations?.find(
    inv => ['pending', 'sent', 'opened', 'started'].includes(inv.status) && 
           new Date(inv.expires_at) > new Date()
  );

  return {
    invitations,
    activeInvitation,
    isLoading,
    refetch,
    createInvitation,
    markAsSent,
    cancelInvitation,
    getInvitationUrl,
  };
}

/**
 * Hook para obtener todas las invitaciones SIERCP (para administradores)
 */
export function useAllSIERCPInvitations() {
  const queryClient = useQueryClient();

  const { data: invitations, isLoading, refetch } = useQuery({
    queryKey: ['siercp-invitations-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('siercp_invitations')
        .select(`
          *,
          evaluacion:evaluacion_id (
            id,
            score_global,
            resultado_semaforo
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SIERCPInvitationWithEvaluation[];
    },
  });

  // Cancelar invitación
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('siercp_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siercp-invitations-all'] });
      toast({
        title: 'Invitación cancelada',
        description: 'El enlace ya no será válido.',
      });
    },
  });

  // Generar URL de invitación
  const getInvitationUrl = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/assessment/${token}`;
  };

  return {
    invitations,
    isLoading,
    refetch,
    cancelInvitation,
    getInvitationUrl,
  };
}

/**
 * Hook para validar y usar un token de invitación (uso público, sin auth)
 */
export function useSIERCPToken(token?: string) {
  const [updating, setUpdating] = useState(false);

  // Validar token
  const { data: validation, isLoading, refetch } = useQuery({
    queryKey: ['siercp-token', token],
    queryFn: async (): Promise<InvitationValidation> => {
      if (!token) {
        return { valid: false, error: 'not_found', message: 'Token no proporcionado' };
      }

      const { data, error } = await supabase
        .from('siercp_invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        return { valid: false, error: 'not_found', message: 'Enlace inválido o no encontrado' };
      }

      const invitation = data as SIERCPInvitation;

      if (invitation.status === 'cancelled') {
        return { valid: false, error: 'cancelled', message: 'Este enlace ha sido cancelado' };
      }

      if (invitation.status === 'completed') {
        return { valid: false, error: 'already_completed', message: 'Esta evaluación ya fue completada' };
      }

      if (new Date(invitation.expires_at) <= new Date()) {
        return { valid: false, error: 'expired', message: 'Este enlace ha expirado' };
      }

      return { valid: true, invitation };
    },
    enabled: !!token,
    staleTime: 0, // Siempre revalidar
  });

  // Actualizar estado de la invitación
  const updateStatus = async (newStatus: SIERCPInvitationStatus) => {
    if (!token || !validation?.valid) return;
    setUpdating(true);

    try {
      const updateData: Record<string, any> = { status: newStatus };
      
      if (newStatus === 'opened' && !validation.invitation?.opened_at) {
        updateData.opened_at = new Date().toISOString();
      }
      if (newStatus === 'started' && !validation.invitation?.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('siercp_invitations')
        .update(updateData)
        .eq('token', token);

      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error('Error updating invitation status:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Vincular evaluación completada
  const linkEvaluation = async (evaluacionId: string) => {
    if (!token) return;

    const { error } = await supabase
      .from('siercp_invitations')
      .update({
        evaluacion_id: evaluacionId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('token', token);

    if (error) {
      console.error('Error linking evaluation:', error);
    }
  };

  return {
    validation,
    isLoading,
    updating,
    updateStatus,
    linkEvaluation,
    refetch,
  };
}
