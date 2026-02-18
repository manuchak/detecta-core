import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SafePoint, SafePointType, VerificationStatus } from '@/lib/security/safePointScoring';
import { toast } from 'sonner';

export interface CreateSafePointInput {
  name: string;
  type: SafePointType;
  lng: number;
  lat: number;
  address?: string;
  corridor_id?: string;
  km_marker?: number;
  photo_url?: string;
  notes?: string;
  has_security_guard?: boolean;
  has_employees_24h?: boolean;
  has_visible_cctv?: boolean;
  has_military_nearby?: boolean;
  is_well_lit?: boolean;
  is_recognized_chain?: boolean;
  has_perimeter_barrier?: boolean;
  has_commercial_activity?: boolean;
  truck_fits_inside?: boolean;
  has_alternate_exit?: boolean;
  has_restrooms?: boolean;
  has_cell_signal?: boolean;
}

export interface UpdateSafePointInput extends Partial<CreateSafePointInput> {
  id: string;
  verification_status?: VerificationStatus;
  is_active?: boolean;
}

export function useSafePoints(options?: {
  type?: SafePointType;
  certificationLevel?: string;
  verificationStatus?: VerificationStatus;
  corridorId?: string;
  activeOnly?: boolean;
}) {
  return useQuery({
    queryKey: ['safe-points', options],
    queryFn: async () => {
      let query = (supabase as any).from('safe_points').select('*').order('created_at', { ascending: false });
      if (options?.type) query = query.eq('type', options.type);
      if (options?.certificationLevel) query = query.eq('certification_level', options.certificationLevel);
      if (options?.verificationStatus) query = query.eq('verification_status', options.verificationStatus);
      if (options?.corridorId) query = query.eq('corridor_id', options.corridorId);
      if (options?.activeOnly !== false) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return data as SafePoint[];
    }
  });
}

export function useSafePoint(id: string | undefined) {
  return useQuery({
    queryKey: ['safe-point', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any).from('safe_points').select('*').eq('id', id).single();
      if (error) throw error;
      return data as SafePoint;
    },
    enabled: !!id
  });
}

export function useCreateSafePoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSafePointInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any).from('safe_points')
        .insert({ ...input, reported_by: userData.user?.id, verification_status: 'pending' })
        .select().single();
      if (error) throw error;
      return data as SafePoint;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['safe-points'] }); toast.success('Punto seguro creado exitosamente'); },
    onError: () => toast.error('Error al crear punto seguro'),
  });
}

export function useUpdateSafePoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSafePointInput) => {
      const { data, error } = await (supabase as any).from('safe_points').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data as SafePoint;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['safe-points'] });
      queryClient.invalidateQueries({ queryKey: ['safe-point', data.id] });
      toast.success('Punto seguro actualizado');
    },
    onError: () => toast.error('Error al actualizar punto seguro'),
  });
}

export function useVerifySafePoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'verified' | 'rejected' }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any).from('safe_points')
        .update({ verification_status: status, verified_by: userData.user?.id, verified_at: new Date().toISOString() })
        .eq('id', id).select().single();
      if (error) throw error;
      return data as SafePoint;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['safe-points'] });
      toast.success(data.verification_status === 'verified' ? 'Punto verificado exitosamente' : 'Punto rechazado');
    },
    onError: () => toast.error('Error al verificar punto seguro'),
  });
}

export function useDeleteSafePoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('safe_points').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['safe-points'] }); toast.success('Punto seguro eliminado'); },
    onError: () => toast.error('Error al eliminar punto seguro'),
  });
}

export function useSafePointsStats() {
  return useQuery({
    queryKey: ['safe-points-stats'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('safe_points')
        .select('certification_level, verification_status, type').eq('is_active', true);
      if (error) throw error;
      return {
        total: data.length,
        byLevel: {
          oro: data.filter((p: any) => p.certification_level === 'oro').length,
          plata: data.filter((p: any) => p.certification_level === 'plata').length,
          bronce: data.filter((p: any) => p.certification_level === 'bronce').length,
          precaucion: data.filter((p: any) => p.certification_level === 'precaucion').length,
        },
        byStatus: {
          pending: data.filter((p: any) => p.verification_status === 'pending').length,
          verified: data.filter((p: any) => p.verification_status === 'verified').length,
          legacy: data.filter((p: any) => p.verification_status === 'legacy').length,
        },
        byType: data.reduce((acc: Record<string, number>, p: any) => {
          acc[p.type] = (acc[p.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    }
  });
}