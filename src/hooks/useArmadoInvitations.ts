import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ArmadoInvitation {
  id: string;
  token: string;
  email: string | null;
  nombre: string | null;
  telefono: string | null;
  armado_operativo_id: string | null;
  created_by: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
  status: string;
}

interface CreateInvitationParams {
  email?: string;
  nombre?: string;
  telefono?: string;
}

interface BulkInvitationParams {
  invitations: CreateInvitationParams[];
  onProgress?: (current: number, total: number, lastEmail: string | null) => void;
}

const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const useArmadoInvitations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invitations, isLoading, error } = useQuery({
    queryKey: ['armado-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('armado_invitations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ArmadoInvitation[];
    },
  });

  const createInvitation = useMutation({
    mutationFn: async (params: CreateInvitationParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('armado_invitations')
        .insert({
          token,
          email: params.email || null,
          nombre: params.nombre || null,
          telefono: params.telefono || null,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as ArmadoInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armado-invitations'] });
      toast({
        title: 'Invitación creada',
        description: 'El link de invitación para armado ha sido generado exitosamente.',
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

  const createBulkInvitations = useMutation({
    mutationFn: async ({ invitations: invitationsList, onProgress }: BulkInvitationParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let sentCount = 0;
      let noEmailCount = 0;
      let failedCount = 0;

      for (let i = 0; i < invitationsList.length; i++) {
        const params = invitationsList[i];
        const token = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        try {
          await supabase
            .from('armado_invitations')
            .insert({
              token,
              email: params.email || null,
              nombre: params.nombre || null,
              telefono: params.telefono || null,
              created_by: user.id,
              expires_at: expiresAt.toISOString(),
              status: 'pending',
            });

          if (params.email) {
            sentCount++;
          } else {
            noEmailCount++;
          }

          onProgress?.(i + 1, invitationsList.length, params.email || null);
        } catch {
          failedCount++;
        }
      }

      return { batchId: '', sentCount, noEmailCount, failedCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armado-invitations'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getInvitationLink = (token: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/auth/registro-armado?token=${token}`;
  };

  return {
    invitations,
    batches: null,
    isLoading,
    error,
    createInvitation,
    createBulkInvitations,
    getInvitationLink,
  };
};
