import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RouteCalculationParams {
  origin: [number, number];
  destination: [number, number];
  waypoints?: [number, number][];
  max_width_m?: number;
  max_weight_tons?: number;
  alley_bias?: number;
  exclude?: string[];
}

export interface RouteCalculationResult {
  route_geojson: { type: string; coordinates: number[][] };
  alt_route_geojson: { type: string; coordinates: number[][] } | null;
  distance_km: number;
  duration_min: number;
  warnings: string[];
}

export function useRouteCalculation() {
  const [result, setResult] = useState<RouteCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const calculate = useCallback(async (params: RouteCalculationParams) => {
    setIsCalculating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('calculate-truck-route', {
        body: params,
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setResult(data as RouteCalculationResult);
      return data as RouteCalculationResult;
    } catch (err: any) {
      const msg = err.message || 'Error calculando ruta';
      setError(msg);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const calculateDebounced = useCallback((params: RouteCalculationParams, delay = 500) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => calculate(params), delay);
  }, [calculate]);

  return { result, isCalculating, error, calculate, calculateDebounced };
}
