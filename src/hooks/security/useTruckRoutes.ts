import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TruckRoute {
  id: string;
  name: string;
  origin_lat: number;
  origin_lon: number;
  dest_lat: number;
  dest_lon: number;
  waypoints: { lon: number; lat: number; label?: string; order: number }[];
  vehicle_profile: string;
  max_width_m: number;
  max_weight_tons: number;
  alley_bias: number;
  exclude_flags: { unpaved: boolean; ferry: boolean; toll: boolean; tunnel: boolean };
  route_geojson: any;
  alt_route_geojson: any;
  route_distance_km: number | null;
  route_duration_min: number | null;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export function useTruckRoutes() {
  return useQuery({
    queryKey: ['truck-routes'],
    queryFn: async (): Promise<TruckRoute[]> => {
      const { data, error } = await (supabase as any)
        .from('truck_routes')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSaveTruckRoute() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (route: Partial<TruckRoute> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        ...route,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (route.id) {
        const { data, error } = await (supabase as any)
          .from('truck_routes')
          .update(payload)
          .eq('id', route.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await (supabase as any)
          .from('truck_routes')
          .insert({ ...payload, created_by: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['truck-routes'] }),
  });
}
