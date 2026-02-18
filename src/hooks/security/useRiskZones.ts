import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RiskZoneScore } from '@/types/security/riskZones';

interface UseRiskZonesReturn {
  zones: RiskZoneScore[];
  getZoneScore: (h3Index: string) => Promise<RiskZoneScore | null>;
  getZonesInArea: (h3Indices: string[]) => Promise<RiskZoneScore[]>;
  recalculateZones: (h3Indices: string[]) => Promise<void>;
  refreshZones: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

function mapZone(zone: any): RiskZoneScore {
  return {
    id: zone.id,
    h3Index: zone.h3_index,
    h3Resolution: zone.h3_resolution || undefined,
    baseScore: zone.base_score || 0,
    manualAdjustment: zone.manual_adjustment || 0,
    finalScore: zone.final_score || 0,
    riskLevel: (zone.risk_level as 'bajo' | 'medio' | 'alto' | 'extremo') || 'bajo',
    priceMultiplier: zone.price_multiplier || 1.0,
    eventCount: zone.event_count || 0,
    lastEventDate: zone.last_event_date || undefined,
    lastCalculatedAt: zone.last_calculated_at || undefined,
    createdAt: zone.created_at || undefined,
    updatedAt: zone.updated_at || undefined,
  };
}

export const useRiskZones = (): UseRiskZonesReturn => {
  const [zones, setZones] = useState<RiskZoneScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadZones(); }, []);

  const loadZones = async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('risk_zone_scores')
        .select('*')
        .order('final_score', { ascending: false });
      if (fetchError) throw fetchError;
      setZones((data || []).map(mapZone));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar zonas de riesgo');
      console.error('Error loading risk zones:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getZoneScore = async (h3Index: string): Promise<RiskZoneScore | null> => {
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('risk_zone_scores').select('*').eq('h3_index', h3Index).single();
      if (fetchError) throw fetchError;
      return data ? mapZone(data) : null;
    } catch (err) {
      console.error('Error getting zone score:', err);
      return null;
    }
  };

  const getZonesInArea = async (h3Indices: string[]): Promise<RiskZoneScore[]> => {
    if (h3Indices.length === 0) return [];
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('risk_zone_scores').select('*').in('h3_index', h3Indices);
      if (fetchError) throw fetchError;
      return (data || []).map(mapZone);
    } catch (err) {
      console.error('Error getting zones in area:', err);
      return [];
    }
  };

  const recalculateZones = async (h3Indices: string[]): Promise<void> => {
    if (h3Indices.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error: funcError } = await supabase.functions.invoke('recalculate-zone-scores', {
        body: { h3Indices }
      });
      if (funcError) throw funcError;
      await loadZones();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al recalcular zonas');
      console.error('Error recalculating zones:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { zones, getZoneScore, getZonesInArea, recalculateZones, refreshZones: loadZones, isLoading, error };
};