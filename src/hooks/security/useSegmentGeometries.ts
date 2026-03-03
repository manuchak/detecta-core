import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SegmentGeometry {
  segment_id: string;
  coordinates: [number, number][];
  distance_km: number | null;
  duration_minutes: number | null;
}

export function useSegmentGeometries() {
  return useQuery({
    queryKey: ['segment-geometries'],
    queryFn: async (): Promise<Record<string, SegmentGeometry>> => {
      const { data, error } = await (supabase as any)
        .from('segment_geometries')
        .select('segment_id, coordinates, distance_km, duration_minutes');

      if (error) {
        console.error('Error loading segment geometries:', error);
        return {};
      }

      const map: Record<string, SegmentGeometry> = {};
      for (const row of (data || [])) {
        map[row.segment_id] = {
          segment_id: row.segment_id,
          coordinates: row.coordinates || [],
          distance_km: row.distance_km,
          duration_minutes: row.duration_minutes,
        };
      }
      return map;
    },
    staleTime: 1000 * 60 * 60, // 1 hour - geometries rarely change
    gcTime: 1000 * 60 * 60 * 24, // 24 hours cache
  });
}
