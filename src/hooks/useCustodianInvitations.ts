import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface CustodianInvitation {
  id: string;
  token: string;
  email: string | null;
  nombre: string | null;
  telefono: string | null;
  candidato_id: string | null;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
  // New tracking fields
  email_sent_at: string | null;
  resend_email_id: string | null;
  delivery_status: string | null;
  bounce_type: string | null;
  bounce_reason: string | null;
  delivery_updated_at: string | null;
  resent_count: number;
  last_resent_at: string | null;
  batch_id: string | null;
}

interface InvitationBatch {
  id: string;
  created_by: string;
  created_at: string;
  filename: string | null;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  sent_count: number;
  delivered_count: number;
  bounced_count: number;
  status: string;
}

interface CreateInvitationParams {
  email?: string;
  nombre?: string;
  telefono?: string;
  candidato_id?: string;
}

interface BulkInvitationParams {
  invitations: CreateInvitationParams[];
  onProgress?: (current: number, total: number, lastEmail: string | null) => void;
}

// Generate a secure random token
const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const useCustodianInvitations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all invitations with extended data
  const { data: invitations, isLoading, error } = useQuery({
    queryKey: ['custodian-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custodian_invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CustodianInvitation[];
    },
  });

  // Fetch batches
  const { data: batches } = useQuery({
    queryKey: ['invitation-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitation_batches')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InvitationBatch[];
    },
  });

  // Create single invitation
  const createInvitation = useMutation({
    mutationFn: async (params: CreateInvitationParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const token = generateToken();
      
      const { data, error } = await supabase
        .from('custodian_invitations')
        .insert({
          token,
          email: params.email || null,
          nombre: params.nombre || null,
          telefono: params.telefono || null,
          candidato_id: params.candidato_id || null,
          created_by: user.id,
          delivery_status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;

      // Send email if provided
      if (params.email) {
        const invitationLink = getInvitationLink(token);
        const { error: emailError } = await supabase.functions.invoke('send-custodian-invitation', {
          body: { 
            email: params.email, 
            nombre: params.nombre || 'Custodio',
            invitationLink,
            invitationId: data.id,
          },
        });
        
        if (emailError) {
          console.error('Error sending email:', emailError);
        }
      }

      return data as CustodianInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodian-invitations'] });
      toast({
        title: 'Invitación creada',
        description: 'El link de invitación ha sido generado exitosamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create bulk invitations
  const createBulkInvitations = useMutation({
    mutationFn: async ({ invitations: invitationsList, onProgress }: BulkInvitationParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Create batch record
      const { data: batch, error: batchError } = await supabase
        .from('invitation_batches')
        .insert({
          created_by: user.id,
          total_rows: invitationsList.length,
          valid_rows: invitationsList.length,
          invalid_rows: 0,
          status: 'processing',
        })
        .select()
        .single();

      if (batchError) throw batchError;

      let sentCount = 0;
      let noEmailCount = 0;
      let failedCount = 0;

      // Process each invitation with rate limiting
      for (let i = 0; i < invitationsList.length; i++) {
        const params = invitationsList[i];
        const token = generateToken();

        try {
          // Insert invitation
          const { data: invitation, error: insertError } = await supabase
            .from('custodian_invitations')
            .insert({
              token,
              email: params.email || null,
              nombre: params.nombre || null,
              telefono: params.telefono || null,
              candidato_id: params.candidato_id || null,
              created_by: user.id,
              batch_id: batch.id,
              import_row_number: i + 1,
              delivery_status: 'pending',
            })
            .select()
            .single();

          if (insertError) {
            failedCount++;
            continue;
          }

          // Send email if provided
          if (params.email) {
            const invitationLink = getInvitationLink(token);
            const { error: emailError } = await supabase.functions.invoke('send-custodian-invitation', {
              body: { 
                email: params.email, 
                nombre: params.nombre || 'Custodio',
                invitationLink,
                invitationId: invitation.id,
              },
            });
            
            if (!emailError) {
              sentCount++;
            } else {
              failedCount++;
            }
          } else {
            noEmailCount++;
          }

          // Report progress
          onProgress?.(i + 1, invitationsList.length, params.email || null);

          // Rate limiting: 500ms delay between emails to respect Resend limits
          if (params.email && i < invitationsList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          failedCount++;
        }
      }

      // Update batch with final stats
      await supabase
        .from('invitation_batches')
        .update({
          sent_count: sentCount,
          status: 'completed',
        })
        .eq('id', batch.id);

      return {
        batchId: batch.id,
        sentCount,
        noEmailCount,
        failedCount,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodian-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitation-batches'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Resend invitation email
  const resendInvitation = useMutation({
    mutationFn: async ({ invitationId, email, nombre }: { invitationId: string; email: string; nombre: string }) => {
      const { data: invitation } = await supabase
        .from('custodian_invitations')
        .select('token, resent_count')
        .eq('id', invitationId)
        .single();

      if (!invitation) throw new Error('Invitación no encontrada');

      const invitationLink = getInvitationLink(invitation.token);
      
      const { error: emailError } = await supabase.functions.invoke('send-custodian-invitation', {
        body: { 
          email, 
          nombre,
          invitationLink,
          invitationId,
        },
      });
      
      if (emailError) throw emailError;

      // Update resent tracking
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('custodian_invitations')
        .update({
          resent_count: (invitation.resent_count || 0) + 1,
          last_resent_at: new Date().toISOString(),
          resent_by: supabase.rpc('array_append', { 
            arr: [], 
            elem: user?.id 
          }),
        })
        .eq('id', invitationId);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodian-invitations'] });
    },
  });

  // Renew token
  const renewToken = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase
        .rpc('renew_invitation_token', { p_invitation_id: invitationId });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodian-invitations'] });
    },
  });

  // Update invitation email (for bounced emails)
  const updateInvitationEmail = useMutation({
    mutationFn: async ({ invitationId, newEmail, resendEmail, nombre }: { 
      invitationId: string; 
      newEmail: string; 
      resendEmail: boolean;
      nombre: string;
    }) => {
      const { error } = await supabase
        .rpc('update_invitation_email', { 
          p_invitation_id: invitationId, 
          p_new_email: newEmail 
        });

      if (error) throw error;

      // Resend if requested
      if (resendEmail) {
        const { data: invitation } = await supabase
          .from('custodian_invitations')
          .select('token')
          .eq('id', invitationId)
          .single();

        if (invitation) {
          const invitationLink = getInvitationLink(invitation.token);
          await supabase.functions.invoke('send-custodian-invitation', {
            body: { 
              email: newEmail, 
              nombre,
              invitationLink,
              invitationId,
            },
          });
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodian-invitations'] });
    },
  });

  // Get invitation link
  const getInvitationLink = (token: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/auth/registro-custodio?token=${token}`;
  };

  return {
    invitations,
    batches,
    isLoading,
    error,
    createInvitation,
    createBulkInvitations,
    resendInvitation,
    renewToken,
    updateInvitationEmail,
    getInvitationLink,
  };
};

// Hook for validating token during registration
export const useInvitationToken = (token: string | null) => {
  const { toast } = useToast();
  
  const { data: validation, isLoading, error } = useQuery({
    queryKey: ['invitation-validation', token],
    queryFn: async () => {
      if (!token) return null;
      
      const { data, error } = await supabase
        .rpc('validate_invitation_token', { p_token: token });
      
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!token,
    staleTime: 0, // Always revalidate
  });

  // Use invitation and assign role
  const useInvitation = async (userId: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const { data, error } = await supabase
        .rpc('use_invitation_and_assign_role', { 
          p_token: token,
          p_user_id: userId 
        });
      
      if (error) throw error;
      
      const result = data?.[0];
      if (!result?.success) {
        toast({
          title: 'Error',
          description: result?.error_message || 'Error al procesar la invitación',
          variant: 'destructive',
        });
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error using invitation:', err);
      toast({
        title: 'Error',
        description: 'Error al procesar la invitación',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    validation,
    isLoading,
    error,
    isValid: validation?.is_valid === true,
    errorMessage: validation?.error_message,
    prefillData: validation ? {
      email: validation.email,
      nombre: validation.nombre,
      telefono: validation.telefono,
    } : null,
    useInvitation,
  };
};
