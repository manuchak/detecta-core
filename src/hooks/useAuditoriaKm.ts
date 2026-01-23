import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AuditoriaKmCorreccion {
  id: string;
  servicio_id: number;
  id_servicio: string | null;
  km_original: number;
  km_corregido: number;
  distancia_mapbox: number | null;
  margen_error_pct: number | null;
  metodo_correccion: string;
  razon: string;
  origen_normalizado: string;
  destino_normalizado: string;
  created_at: string;
}

export interface AuditoriaEstadisticas {
  total_auditados: number;
  pendientes_auditoria: number;
  registros_nan: number;
  por_metodo: {
    origen_igual_destino: number;
    division_1000: number;
    km_teorico: number;
    mapbox_api: number;
    correccion_nan: number;
    manual: number;
  };
  km_total_corregido: number;
  impacto_financiero_estimado: number;
}

export function useAuditoriaKmEstadisticas() {
  return useQuery({
    queryKey: ['auditoria-km-estadisticas'],
    queryFn: async (): Promise<AuditoriaEstadisticas> => {
      // Obtener correcciones por método
      const { data: correcciones, error: corrError } = await supabase
        .from('auditoria_km_correcciones')
        .select('metodo_correccion, km_original, km_corregido');

      if (corrError) throw corrError;

      // Contar pendientes de auditoría (incluyendo NaN)
      const { count: pendientes, error: pendError } = await supabase
        .from('servicios_custodia')
        .select('id', { count: 'exact', head: true })
        .eq('km_auditado', false)
        .not('km_recorridos', 'is', null);

      if (pendError) throw pendError;

      // Contar auditados
      const { count: auditados, error: audError } = await supabase
        .from('servicios_custodia')
        .select('id', { count: 'exact', head: true })
        .eq('km_auditado', true);

      if (audError) throw audError;

      // Contar registros con NaN específicamente (usando RPC o query especial)
      // PostgreSQL: 'NaN'::numeric para detectar NaN
      const { count: registrosNaN, error: nanError } = await supabase
        .rpc('count_nan_km_recorridos');
      
      // Si no existe la función, usar 0 como fallback
      const nanCount = nanError ? 0 : (registrosNaN || 0);

      // Calcular estadísticas
      const porMetodo = {
        origen_igual_destino: 0,
        division_1000: 0,
        km_teorico: 0,
        mapbox_api: 0,
        correccion_nan: 0,
        manual: 0,
      };

      let kmTotalCorregido = 0;

      (correcciones || []).forEach((c) => {
        const metodo = c.metodo_correccion as keyof typeof porMetodo;
        if (metodo in porMetodo) {
          porMetodo[metodo]++;
        }
        kmTotalCorregido += Math.abs((c.km_original || 0) - (c.km_corregido || 0));
      });

      // Estimación de impacto financiero (basado en tarifa promedio de $5/km)
      const tarifaPromedio = 5;
      const impactoFinanciero = kmTotalCorregido * tarifaPromedio;

      return {
        total_auditados: auditados || 0,
        pendientes_auditoria: pendientes || 0,
        registros_nan: nanCount,
        por_metodo: porMetodo,
        km_total_corregido: kmTotalCorregido,
        impacto_financiero_estimado: impactoFinanciero,
      };
    },
    staleTime: 60 * 1000, // 1 minuto
  });
}

export function useAuditoriaKmCorrecciones(limite: number = 50) {
  return useQuery({
    queryKey: ['auditoria-km-correcciones', limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auditoria_km_correcciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) throw error;
      return data as AuditoriaKmCorreccion[];
    },
  });
}

export function useServiciosSospechosos(limite: number = 20) {
  return useQuery({
    queryKey: ['servicios-km-sospechosos', limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('id, id_servicio, origen, destino, km_recorridos, km_teorico, km_auditado')
        .eq('km_auditado', false)
        .not('km_recorridos', 'is', null)
        .gt('km_recorridos', 1500)
        .order('km_recorridos', { ascending: false })
        .limit(limite);

      if (error) throw error;
      return data;
    },
  });
}

interface EjecutarAuditoriaParams {
  prioridad?: 'extremos' | 'metros' | 'sospechosos' | 'mismo_punto' | 'todos';
  limite?: number;
  aplicarCambios?: boolean;
  usarMapbox?: boolean;
}

export function useEjecutarAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: EjecutarAuditoriaParams) => {
      const { data, error } = await supabase.functions.invoke('auditar-km-recorridos', {
        body: {
          prioridad: params.prioridad || 'todos',
          limite: params.limite || 50,
          aplicarCambios: params.aplicarCambios ?? false,
          usarMapbox: params.usarMapbox ?? true,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auditoria-km-estadisticas'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria-km-correcciones'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-km-sospechosos'] });

      toast({
        title: 'Auditoría completada',
        description: `${data.estadisticas?.total_correcciones || 0} correcciones identificadas`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error en auditoría',
        description: String(error),
        variant: 'destructive',
      });
    },
  });
}
