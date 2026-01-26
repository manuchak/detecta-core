import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmGeoDistribution } from './useCrmGeoDistribution';
import type { SupplyGapAnalysis } from '@/types/crm';

// Average ticket for conversion calculation (from historical data)
const AVG_SERVICE_TICKET = 6765; // MXN

// Zone mapping for instaladores
const ZONE_KEYWORDS: Record<string, string[]> = {
  zona_centro: ['cdmx', 'ciudad de mexico', 'mexico', 'toluca', 'puebla', 'cuernavaca', 'pachuca'],
  zona_bajio: ['leon', 'celaya', 'irapuato', 'queretaro', 'salamanca', 'aguascalientes', 'guanajuato'],
  zona_occidente: ['guadalajara', 'zapopan', 'tlaquepaque', 'jalisco'],
  zona_norte: ['monterrey', 'saltillo', 'nuevo leon', 'coahuila', 'chihuahua'],
  zona_golfo: ['veracruz', 'tampico', 'altamira'],
  zona_pacifico: ['tijuana', 'mexicali', 'ensenada', 'baja california'],
  zona_sureste: ['cancun', 'merida', 'quintana roo', 'yucatan'],
};

function inferZoneFromText(text: string | null): string {
  if (!text) return 'otras';
  const normalized = text.toLowerCase();
  
  for (const [zone, keywords] of Object.entries(ZONE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return zone;
      }
    }
  }
  return 'otras';
}

export function useCrmSupplyGap() {
  const { data: geoDistribution, isLoading: geoLoading } = useCrmGeoDistribution();

  return useQuery({
    queryKey: ['crm-supply-gap', geoDistribution],
    queryFn: async (): Promise<SupplyGapAnalysis[]> => {
      if (!geoDistribution) return [];

      // Get active instaladores/custodios grouped by zone
      // Using instaladores table as proxy for supply
      const { data: instaladores, error } = await supabase
        .from('instaladores')
        .select('id, nombre, zona_preferida_id, estado')
        .eq('estado', 'activo');

      if (error) {
        console.error('Error fetching instaladores for supply gap:', error);
        // Continue with empty supply data
      }

      // Count instaladores by zone
      const supplyByZone: Record<string, number> = {};
      
      (instaladores || []).forEach(inst => {
        const zone = inferZoneFromText(inst.zona_preferida_id);
        supplyByZone[zone] = (supplyByZone[zone] || 0) + 1;
      });

      // Calculate gap for each zone with deals
      const results: SupplyGapAnalysis[] = geoDistribution.map(zoneData => {
        // Convert weighted pipeline value to estimated service demand
        const demandProjected = Math.ceil(zoneData.weightedValue / AVG_SERVICE_TICKET);
        const supplyActual = supplyByZone[zoneData.zone] || 0;
        const gap = supplyActual - demandProjected;

        // Determine gap status
        let gapStatus: 'surplus' | 'balanced' | 'deficit' | 'critical';
        const gapRatio = demandProjected > 0 ? supplyActual / demandProjected : 1;

        if (gapRatio >= 1.5) {
          gapStatus = 'surplus';
        } else if (gapRatio >= 0.8) {
          gapStatus = 'balanced';
        } else if (gapRatio >= 0.5) {
          gapStatus = 'deficit';
        } else {
          gapStatus = 'critical';
        }

        return {
          zone: zoneData.zone,
          zoneName: zoneData.zoneName,
          demandProjected,
          supplyActual,
          gap,
          gapStatus,
        };
      });

      return results;
    },
    enabled: !!geoDistribution && geoDistribution.length > 0,
    staleTime: 60 * 1000,
  });
}
