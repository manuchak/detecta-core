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
}

interface CreateInvitationParams {
  email?: string;
  nombre?: string;
  telefono?: string;
  candidato_id?: string;
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

  // Fetch all invitations
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

  // Create invitation
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
        })
        .select()
        .single();
      
      if (error) throw error;
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

  // Get invitation link
  const getInvitationLink = (token: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/auth/registro-custodio?token=${token}`;
  };

  return {
    invitations,
    isLoading,
    error,
    createInvitation,
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
