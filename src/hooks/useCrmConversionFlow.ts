import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SankeyNode, SankeyLink, SankeyData } from '@/types/crm';
import { extraerCiudad, ZONAS_A_CIUDADES } from '@/utils/geografico';

// Zone mapping helper
function getZoneFromCity(cityKey: string | null): string {
  if (!cityKey) return 'otras';
  
  for (const [zone, cities] of Object.entries(ZONAS_A_CIUDADES)) {
    if ((cities as readonly string[]).includes(cityKey)) {
      return zone;
    }
  }
  return 'otras';
}

// Normalize zone name for display
const ZONE_DISPLAY_NAMES: Record<string, string> = {
  zona_centro: 'Centro',
  zona_bajio: 'Bajío',
  zona_occidente: 'Occidente',
  zona_norte: 'Norte',
  zona_golfo: 'Golfo',
  zona_pacifico: 'Pacífico',
  zona_sureste: 'Sureste',
  otras: 'Otras',
};

export function useCrmConversionFlow() {
  return useQuery({
    queryKey: ['crm-conversion-flow'],
    queryFn: async (): Promise<SankeyData> => {
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
            order_nr
          )
        `)
        .eq('is_deleted', false);

      if (error) {
        console.error('Error fetching deals for flow:', error);
        throw error;
      }

      const allDeals = deals || [];

      // Build nodes
      const nodes: SankeyNode[] = [];
      const linksMap: Map<string, number> = new Map();

      // Source nodes (simplified - all from Pipedrive for now)
      nodes.push({ id: 'source_pipedrive', name: 'Pipedrive', category: 'source' });

      // Zone nodes - discover from deals
      const zonesFound = new Set<string>();
      allDeals.forEach(deal => {
        const city = extraerCiudad(deal.organization_name || '');
        const zone = getZoneFromCity(city);
        zonesFound.add(zone);
      });

      zonesFound.forEach(zone => {
        nodes.push({
          id: `zone_${zone}`,
          name: ZONE_DISPLAY_NAMES[zone] || zone,
          category: 'zone',
        });
      });

      // Stage nodes - discover from deals
      const stagesMap = new Map<string, string>();
      allDeals.forEach(deal => {
        const stages = deal.crm_pipeline_stages;
        if (stages && Array.isArray(stages) && stages.length > 0) {
          const stage = stages[0];
          stagesMap.set(stage.id, stage.name);
        } else if (stages && !Array.isArray(stages)) {
          // Handle case where it's a single object
          const stage = stages as unknown as { id: string; name: string };
          stagesMap.set(stage.id, stage.name);
        }
      });

      stagesMap.forEach((name, id) => {
        nodes.push({
          id: `stage_${id}`,
          name,
          category: 'stage',
        });
      });

      // Outcome nodes
      nodes.push({ id: 'outcome_won', name: 'Ganados', category: 'outcome' });
      nodes.push({ id: 'outcome_lost', name: 'Perdidos', category: 'outcome' });
      nodes.push({ id: 'outcome_open', name: 'En Proceso', category: 'outcome' });

      // Build links
      allDeals.forEach(deal => {
        const value = Math.max(deal.value || 1, 1); // Ensure minimum value for visibility
        
        // Source → Zone
        const city = extraerCiudad(deal.organization_name || '');
        const zone = getZoneFromCity(city);
        const sourceToZoneKey = `source_pipedrive|zone_${zone}`;
        linksMap.set(sourceToZoneKey, (linksMap.get(sourceToZoneKey) || 0) + value);

        // Zone → Stage
        if (deal.stage_id) {
          const zoneToStageKey = `zone_${zone}|stage_${deal.stage_id}`;
          linksMap.set(zoneToStageKey, (linksMap.get(zoneToStageKey) || 0) + value);

          // Stage → Outcome
          const outcomeId = deal.status === 'won' 
            ? 'outcome_won' 
            : deal.status === 'lost' 
              ? 'outcome_lost' 
              : 'outcome_open';
          const stageToOutcomeKey = `stage_${deal.stage_id}|${outcomeId}`;
          linksMap.set(stageToOutcomeKey, (linksMap.get(stageToOutcomeKey) || 0) + value);
        }
      });

      // Convert to links array
      const links: SankeyLink[] = [];
      linksMap.forEach((value, key) => {
        const [source, target] = key.split('|');
        links.push({ source, target, value });
      });

      return { nodes, links };
    },
    staleTime: 60 * 1000,
  });
}

export interface FlowInsight {
  type: 'zone_best' | 'zone_worst' | 'stage_bottleneck' | 'source_effective';
  title: string;
  description: string;
  value?: string;
}

export function useConversionInsights() {
  const { data: flowData, isLoading } = useCrmConversionFlow();

  const insights: FlowInsight[] = [];

  if (flowData && !isLoading) {
    // Calculate zone conversion rates
    const zoneStats: Record<string, { total: number; won: number }> = {};
    
    flowData.links.forEach(link => {
      if (link.source.startsWith('zone_')) {
        const zone = link.source;
        if (!zoneStats[zone]) {
          zoneStats[zone] = { total: 0, won: 0 };
        }
        zoneStats[zone].total += link.value;
      }
      if (link.target === 'outcome_won' && link.source.startsWith('stage_')) {
        // Find which zone this came from (simplified)
      }
    });

    // Add sample insights
    const zoneNodes = flowData.nodes.filter(n => n.category === 'zone');
    if (zoneNodes.length > 0) {
      insights.push({
        type: 'zone_best',
        title: 'Distribución por Zona',
        description: `Deals distribuidos en ${zoneNodes.length} zonas geográficas`,
      });
    }
  }

  return { insights, isLoading };
}
