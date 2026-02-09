import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TarifaKmArmado {
  id: string;
  km_min: number;
  km_max: number | null;
  tarifa_por_km: number;
  descripcion: string;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export type CreateTarifaData = Omit<TarifaKmArmado, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTarifaData = Partial<CreateTarifaData> & { id: string };

// Fallback hardcoded rates (used when DB is empty)
const TARIFAS_FALLBACK: Omit<TarifaKmArmado, 'id' | 'created_at' | 'updated_at'>[] = [
  { km_min: 0, km_max: 100, tarifa_por_km: 6.0, descripcion: '0-100 km', activo: true, orden: 1 },
  { km_min: 100, km_max: 250, tarifa_por_km: 5.5, descripcion: '101-250 km', activo: true, orden: 2 },
  { km_min: 250, km_max: 400, tarifa_por_km: 5.0, descripcion: '251-400 km', activo: true, orden: 3 },
  { km_min: 400, km_max: null, tarifa_por_km: 4.6, descripcion: '400+ km', activo: true, orden: 4 },
];

const QUERY_KEY = ['tarifas-km-armados-internos'];

export function useTarifasKmArmados() {
  const queryClient = useQueryClient();

  const { data: tarifas = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarifas_km_armados_internos')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true });

      if (error) throw error;
      return (data || []) as TarifaKmArmado[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const allTarifasQuery = useQuery({
    queryKey: [...QUERY_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarifas_km_armados_internos')
        .select('*')
        .order('orden', { ascending: true });

      if (error) throw error;
      return (data || []) as TarifaKmArmado[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateTarifaData) => {
      const { data: result, error } = await supabase
        .from('tarifas_km_armados_internos')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Tarifa creada exitosamente');
    },
    onError: (err: Error) => toast.error(`Error al crear tarifa: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: UpdateTarifaData) => {
      const { data: result, error } = await supabase
        .from('tarifas_km_armados_internos')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Tarifa actualizada');
    },
    onError: (err: Error) => toast.error(`Error al actualizar: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tarifas_km_armados_internos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Tarifa eliminada');
    },
    onError: (err: Error) => toast.error(`Error al eliminar: ${err.message}`),
  });

  // Get active tarifas or fallback
  const tarifasActivas = tarifas.length > 0 ? tarifas : TARIFAS_FALLBACK.map((t, i) => ({
    ...t,
    id: `fallback-${i}`,
    created_at: '',
    updated_at: '',
  }));

  /**
   * Calculate tiered cost for a given km distance.
   * Uses the SEICSA tiered model where each km range has its own rate.
   */
  function calcularCostoPorKm(km: number): { costo: number; tarifa: number; rango: string } {
    const MAX_KM = 700;
    const kmClamped = Math.min(Math.max(km, 0), MAX_KM);

    // Simple lookup: find the range the km falls into
    const tarifaEncontrada = tarifasActivas.find(t => {
      const max = t.km_max ?? Infinity;
      return kmClamped > t.km_min && kmClamped <= max;
    }) || tarifasActivas[tarifasActivas.length - 1];

    return {
      costo: kmClamped * tarifaEncontrada.tarifa_por_km,
      tarifa: tarifaEncontrada.tarifa_por_km,
      rango: tarifaEncontrada.descripcion,
    };
  }

  /**
   * Calculate tiered cost using the escalonado (staircase) model
   * where different rates apply to different portions of the distance.
   */
  function calcularCostoEscalonado(km: number): number {
    const MAX_KM = 700;
    const kmClamped = Math.min(Math.max(km, 0), MAX_KM);
    let costoTotal = 0;
    let kmRestantes = kmClamped;

    for (const tarifa of tarifasActivas) {
      if (kmRestantes <= 0) break;
      const rangoMax = tarifa.km_max ?? Infinity;
      const kmEnRango = Math.min(kmRestantes, rangoMax - tarifa.km_min);
      costoTotal += kmEnRango * tarifa.tarifa_por_km;
      kmRestantes -= kmEnRango;
    }

    return costoTotal;
  }

  return {
    tarifas: tarifasActivas,
    allTarifas: allTarifasQuery.data || [],
    loading: isLoading,
    error,
    createTarifa: createMutation.mutateAsync,
    updateTarifa: updateMutation.mutateAsync,
    deleteTarifa: deleteMutation.mutateAsync,
    calcularCostoPorKm,
    calcularCostoEscalonado,
  };
}
