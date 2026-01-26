import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { extraerCiudad, obtenerInfoCiudad, ZONAS_A_CIUDADES, CIUDADES_PRINCIPALES } from '@/utils/geografico';
import type { DealGeoDistribution } from '@/types/crm';

// Zone center coordinates (approximate centroids)
const ZONE_CENTERS: Record<string, { lat: number; lng: number; name: string }> = {
  zona_centro: { lat: 19.4326, lng: -99.1332, name: 'Centro' },
  zona_bajio: { lat: 20.9, lng: -101.0, name: 'Bajío' },
  zona_occidente: { lat: 20.6597, lng: -103.3496, name: 'Occidente' },
  zona_norte: { lat: 25.6866, lng: -100.3161, name: 'Norte' },
  zona_golfo: { lat: 19.5, lng: -96.9, name: 'Golfo' },
  zona_pacifico: { lat: 32.5149, lng: -117.0382, name: 'Pacífico' },
  zona_sureste: { lat: 21.0, lng: -87.5, name: 'Sureste' },
  otras: { lat: 23.6345, lng: -102.5528, name: 'Otras' }, // Center of Mexico
};

// Get zone from city key
function getZoneFromCity(cityKey: string | null): string {
  if (!cityKey) return 'otras';
  
  for (const [zone, cities] of Object.entries(ZONAS_A_CIUDADES)) {
    if ((cities as readonly string[]).includes(cityKey)) {
      return zone;
    }
  }
  return 'otras';
}

export function useCrmGeoDistribution() {
  return useQuery({
    queryKey: ['crm-geo-distribution'],
    queryFn: async (): Promise<DealGeoDistribution[]> => {
      // Fetch deals with stages
      const { data: deals, error } = await supabase
        .from('crm_deals')
        .select(`
          id,
          title,
          value,
          status,
          organization_name,
          stage_id,
          crm_pipeline_stages (
            id,
            name,
            deal_probability
          )
        `)
        .eq('is_deleted', false)
        .eq('status', 'open'); // Only open deals for pipeline map

      if (error) {
        console.error('Error fetching deals for geo distribution:', error);
        throw error;
      }

      // Group deals by zone
      const zoneDeals: Record<string, {
        deals: Array<{
          id: string;
          title: string;
          value: number;
          stage: string;
        }>;
        totalValue: number;
        weightedValue: number;
      }> = {};

      (deals || []).forEach(deal => {
        // Extract city from organization name
        const city = extraerCiudad(deal.organization_name || '');
        const zone = getZoneFromCity(city);

        if (!zoneDeals[zone]) {
          zoneDeals[zone] = { deals: [], totalValue: 0, weightedValue: 0 };
        }

        const stages = deal.crm_pipeline_stages;
        let stageName = 'Sin etapa';
        let probability = 50;
        
        if (stages) {
          if (Array.isArray(stages) && stages.length > 0) {
            stageName = stages[0].name;
            probability = stages[0].deal_probability || 50;
          } else if (!Array.isArray(stages)) {
            const stage = stages as unknown as { name: string; deal_probability: number };
            stageName = stage.name;
            probability = stage.deal_probability || 50;
          }
        }

        const value = Number(deal.value) || 0;
        const weighted = value * (probability / 100);

        zoneDeals[zone].deals.push({
          id: deal.id,
          title: deal.title,
          value,
          stage: stageName,
        });
        zoneDeals[zone].totalValue += value;
        zoneDeals[zone].weightedValue += weighted;
      });

      // Convert to array with coordinates
      const result: DealGeoDistribution[] = [];

      for (const [zone, data] of Object.entries(zoneDeals)) {
        const center = ZONE_CENTERS[zone] || ZONE_CENTERS.otras;
        
        result.push({
          zone,
          zoneName: center.name,
          lat: center.lat,
          lng: center.lng,
          dealsCount: data.deals.length,
          totalValue: data.totalValue,
          weightedValue: data.weightedValue,
          deals: data.deals,
        });
      }

      // Sort by total value descending
      return result.sort((a, b) => b.totalValue - a.totalValue);
    },
    staleTime: 60 * 1000,
  });
}
