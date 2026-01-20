import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getDataCurrentDay } from '@/utils/timezoneUtils';

export interface BusinessTarget {
  id: string;
  year: number;
  month: number;
  target_services: number;
  target_gmv: number;
  target_aov: number;
  target_active_custodians: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProRataTarget {
  targetServices: number;
  targetGMV: number;
  proRataServices: number;
  proRataGMV: number;
  targetActiveCustodians: number | null;
  daysInMonth: number;
  currentDay: number;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const getMonthName = (month: number): string => MONTH_NAMES[month - 1] || '';

export const useBusinessTargets = (year: number) => {
  return useQuery({
    queryKey: ['business-targets', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_targets')
        .select('*')
        .eq('year', year)
        .order('month', { ascending: true });
      
      if (error) throw error;
      return data as BusinessTarget[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCurrentMonthTarget = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  // Usamos getDataCurrentDay() para considerar el retraso de 1 día en la data
  const currentDay = getDataCurrentDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  return useQuery({
    queryKey: ['business-target-current', year, month],
    queryFn: async (): Promise<ProRataTarget | null> => {
      const { data, error } = await supabase
        .from('business_targets')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      const target = data as BusinessTarget;
      
      // Calculate pro-rata targets
      const proRataServices = Math.round((target.target_services / daysInMonth) * currentDay);
      const proRataGMV = Math.round((target.target_gmv / daysInMonth) * currentDay);

      return {
        targetServices: target.target_services,
        targetGMV: target.target_gmv,
        proRataServices,
        proRataGMV,
        targetActiveCustodians: target.target_active_custodians,
        daysInMonth,
        currentDay,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateBusinessTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Partial<BusinessTarget> & { id: string }) => {
      const { data, error } = await supabase
        .from('business_targets')
        .update({
          target_services: target.target_services,
          target_gmv: target.target_gmv,
          target_aov: target.target_aov,
          target_active_custodians: target.target_active_custodians,
          updated_at: new Date().toISOString(),
        })
        .eq('id', target.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['business-targets'] });
      queryClient.invalidateQueries({ queryKey: ['business-target-current'] });
      toast.success(`Meta de ${getMonthName(data.month)} actualizada`);
    },
    onError: (error) => {
      console.error('Error updating business target:', error);
      toast.error('Error al actualizar la meta');
    },
  });
};

export const useUpsertBusinessTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Omit<BusinessTarget, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('business_targets')
        .upsert({
          year: target.year,
          month: target.month,
          target_services: target.target_services,
          target_gmv: target.target_gmv,
          target_aov: target.target_aov,
          target_active_custodians: target.target_active_custodians,
        }, {
          onConflict: 'year,month',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-targets'] });
      queryClient.invalidateQueries({ queryKey: ['business-target-current'] });
    },
    onError: (error) => {
      console.error('Error upserting business target:', error);
      toast.error('Error al guardar la meta');
    },
  });
};
