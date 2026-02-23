import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IncidenteRRSS {
  id: string;
  red_social: string;
  fecha_publicacion: string;
  texto_original: string;
  tipo_incidente: string;
  severidad: string | null;
  estado: string | null;
  municipio: string | null;
  carretera: string | null;
  coordenadas_lat: number | null;
  coordenadas_lng: number | null;
  keywords_detectados: string[] | null;
  url_publicacion: string;
  resumen_ai: string | null;
  autor: string | null;
  engagement_likes: number;
  engagement_shares: number;
  engagement_comments: number;
  // Campos criminológicos
  relevancia_score: number | null;
  modus_operandi: string | null;
  firma_criminal: string | null;
  nivel_organizacion: string | null;
  vector_ataque: string | null;
  objetivo_especifico: string | null;
  indicadores_premeditacion: string[] | null;
  zona_tipo: string | null;
  contexto_ambiental: string | null;
}

export const useIncidentesRRSS = (filtros?: {
  tipo?: string;
  estado?: string;
  estado_geografico?: string;
  carretera?: string;
  dias_atras?: number;
  horas_atras?: number;
  solo_geocodificados?: boolean;
}) => {
  return useQuery({
    queryKey: ['incidentes-rrss', filtros],
    queryFn: async () => {
      let query = supabase
        .from('incidentes_rrss')
        .select('*')
        .eq('procesado', true)
        .order('fecha_publicacion', { ascending: false });

      if (filtros?.tipo && filtros.tipo !== 'todos') {
        query = query.eq('tipo_incidente', filtros.tipo);
      }
      if (filtros?.estado) {
        query = query.eq('estado', filtros.estado);
      }
      if (filtros?.estado_geografico) {
        query = query.ilike('estado', `%${filtros.estado_geografico}%`);
      }
      if (filtros?.carretera) {
        query = query.ilike('carretera', `%${filtros.carretera}%`);
      }
      if (filtros?.horas_atras) {
        const fecha = new Date();
        fecha.setHours(fecha.getHours() - filtros.horas_atras);
        query = query.gte('fecha_publicacion', fecha.toISOString());
      } else if (filtros?.dias_atras) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - filtros.dias_atras);
        query = query.gte('fecha_publicacion', fecha.toISOString());
      }
      if (filtros?.solo_geocodificados) {
        query = query.not('coordenadas_lat', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as IncidenteRRSS[];
    }
  });
};

// Hook para incidentes activos (últimas 4 horas) - usado por el banner
export const useIncidentesActivos = () => {
  return useQuery({
    queryKey: ['incidentes-activos-4h'],
    queryFn: async () => {
      const hace4h = new Date();
      hace4h.setHours(hace4h.getHours() - 4);

      const { data, error } = await supabase
        .from('incidentes_rrss')
        .select('*')
        .eq('procesado', true)
        .gte('fecha_publicacion', hace4h.toISOString())
        .order('fecha_publicacion', { ascending: false });

      if (error) throw error;
      return data as IncidenteRRSS[];
    },
    refetchInterval: 60000, // Refrescar cada minuto
  });
};

// Hook para obtener carreteras únicas de la BD
export const useCarreterasDisponibles = () => {
  return useQuery({
    queryKey: ['carreteras-disponibles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidentes_rrss')
        .select('carretera')
        .eq('procesado', true)
        .not('carretera', 'is', null);

      if (error) throw error;
      const unique = [...new Set((data || []).map((d: any) => d.carretera).filter(Boolean))];
      return unique.sort() as string[];
    }
  });
};

export interface FrecuenciaIncidente {
  semana: string;
  tipo_incidente: string;
  severidad: string | null;
  estado: string | null;
  carretera: string | null;
  total: number;
  criticos: number;
  confianza_promedio: number | null;
}

export const useIncidentesFrecuencia = () => {
  return useQuery({
    queryKey: ['incidentes-frecuencia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vista_frecuencia_incidentes' as any)
        .select('*')
        .order('semana', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as unknown as FrecuenciaIncidente[];
    }
  });
};

export const useCorredoresRiesgo = () => {
  return useQuery({
    queryKey: ['corredores-riesgo'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calcular_score_corredor' as any, {
        p_carretera: null
      });
      if (error) throw error;
      return (data as any[]) || [];
    }
  });
};

export const useIncidentesStats = () => {
  return useQuery({
    queryKey: ['incidentes-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidentes_rrss')
        .select('tipo_incidente, severidad, geocoding_metodo, procesado, modus_operandi, nivel_organizacion, indicadores_premeditacion, zona_tipo, relevancia_score')
        .eq('procesado', true);

      if (error) throw error;

      const stats = {
        total: data.length,
        por_tipo: {} as Record<string, number>,
        por_severidad: {} as Record<string, number>,
        geocodificados: 0,
        por_metodo_geocoding: {} as Record<string, number>,
        // Criminológicos
        por_modus_operandi: {} as Record<string, number>,
        por_nivel_organizacion: {} as Record<string, number>,
        por_zona_tipo: {} as Record<string, number>,
        indicadores_frecuentes: {} as Record<string, number>,
        relevancia_promedio: 0,
      };

      let relSum = 0;
      let relCount = 0;

      data.forEach((item: any) => {
        stats.por_tipo[item.tipo_incidente] = (stats.por_tipo[item.tipo_incidente] || 0) + 1;
        if (item.severidad) {
          stats.por_severidad[item.severidad] = (stats.por_severidad[item.severidad] || 0) + 1;
        }
        if (item.geocoding_metodo) {
          stats.geocodificados++;
          stats.por_metodo_geocoding[item.geocoding_metodo] = (stats.por_metodo_geocoding[item.geocoding_metodo] || 0) + 1;
        }
        if (item.modus_operandi) {
          const mo = item.modus_operandi.substring(0, 80);
          stats.por_modus_operandi[mo] = (stats.por_modus_operandi[mo] || 0) + 1;
        }
        if (item.nivel_organizacion) {
          stats.por_nivel_organizacion[item.nivel_organizacion] = (stats.por_nivel_organizacion[item.nivel_organizacion] || 0) + 1;
        }
        if (item.zona_tipo) {
          stats.por_zona_tipo[item.zona_tipo] = (stats.por_zona_tipo[item.zona_tipo] || 0) + 1;
        }
        if (item.indicadores_premeditacion && Array.isArray(item.indicadores_premeditacion)) {
          item.indicadores_premeditacion.forEach((ind: string) => {
            stats.indicadores_frecuentes[ind] = (stats.indicadores_frecuentes[ind] || 0) + 1;
          });
        }
        if (item.relevancia_score != null) {
          relSum += item.relevancia_score;
          relCount++;
        }
      });

      stats.relevancia_promedio = relCount > 0 ? Math.round(relSum / relCount) : 0;

      return stats;
    }
  });
};
