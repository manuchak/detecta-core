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
}

export const useIncidentesRRSS = (filtros?: {
  tipo?: string;
  estado?: string;
  dias_atras?: number;
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

      if (filtros?.dias_atras) {
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

export const useIncidentesStats = () => {
  return useQuery({
    queryKey: ['incidentes-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidentes_rrss')
        .select('tipo_incidente, severidad, geocoding_metodo, procesado')
        .eq('procesado', true);

      if (error) throw error;

      const stats = {
        total: data.length,
        por_tipo: {} as Record<string, number>,
        por_severidad: {} as Record<string, number>,
        geocodificados: 0,
        por_metodo_geocoding: {} as Record<string, number>
      };

      data.forEach((item) => {
        stats.por_tipo[item.tipo_incidente] = (stats.por_tipo[item.tipo_incidente] || 0) + 1;
        if (item.severidad) {
          stats.por_severidad[item.severidad] = (stats.por_severidad[item.severidad] || 0) + 1;
        }
        if (item.geocoding_metodo) {
          stats.geocodificados++;
          stats.por_metodo_geocoding[item.geocoding_metodo] = (stats.por_metodo_geocoding[item.geocoding_metodo] || 0) + 1;
        }
      });

      return stats;
    }
  });
};
