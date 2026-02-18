import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ThreatItem {
  id: string;
  tipoIncidente: string;
  subtipo: string | null;
  severidad: string;
  fechaPublicacion: string;
  redSocial: string;
  ubicacion: string | null;
  carretera: string | null;
  municipio: string | null;
  estado: string | null;
  resumenAi: string | null;
  textoOriginal: string;
  confianzaClasificacion: number | null;
  armasMencionadas: boolean;
  numVictimas: number | null;
  montoPerdida: number | null;
  sentimiento: string | null;
  urlPublicacion: string | null;
  coordLat: number | null;
  coordLng: number | null;
  // Relevance scoring
  relevanceScore: number;
  relevanceFactors: string[];
}

interface ServiceZone {
  origen_lat: number;
  origen_lng: number;
  destino_lat: number | null;
  destino_lng: number | null;
  fecha_servicio: string;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreRelevance(
  inc: any,
  activeZones: ServiceZone[]
): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  // Severity weight
  const sev = (inc.severidad || '').toLowerCase();
  if (sev === 'critica' || sev === 'crítica') { score += 30; factors.push('Severidad crítica'); }
  else if (sev === 'alta') { score += 20; factors.push('Severidad alta'); }
  else if (sev === 'media') { score += 10; }

  // Recency (last 72h = high)
  const hoursAgo = (Date.now() - new Date(inc.fecha_publicacion || '').getTime()) / 3600000;
  if (hoursAgo <= 24) { score += 25; factors.push('Últimas 24h'); }
  else if (hoursAgo <= 72) { score += 15; factors.push('Últimas 72h'); }
  else if (hoursAgo <= 168) { score += 5; }

  // Classification confidence
  const conf = inc.confianza_clasificacion || 0;
  if (conf >= 0.8) { score += 10; factors.push(`Confianza AI ${Math.round(conf * 100)}%`); }
  else if (conf >= 0.6) { score += 5; }

  // Arms mentioned
  if (inc.armas_mencionadas) { score += 10; factors.push('Armas mencionadas'); }

  // Victims
  if (inc.num_victimas && inc.num_victimas > 0) { score += 10; factors.push(`${inc.num_victimas} víctimas`); }

  // Geographic proximity to active service zones
  if (inc.coordenadas_lat && inc.coordenadas_lng && activeZones.length > 0) {
    let minDist = Infinity;
    for (const z of activeZones) {
      const d1 = haversineKm(inc.coordenadas_lat, inc.coordenadas_lng, z.origen_lat, z.origen_lng);
      minDist = Math.min(minDist, d1);
      if (z.destino_lat && z.destino_lng) {
        const d2 = haversineKm(inc.coordenadas_lat, inc.coordenadas_lng, z.destino_lat, z.destino_lng);
        minDist = Math.min(minDist, d2);
      }
    }
    if (minDist <= 20) { score += 25; factors.push(`A ${Math.round(minDist)}km de zona activa`); }
    else if (minDist <= 50) { score += 15; factors.push(`A ${Math.round(minDist)}km de zona activa`); }
    else if (minDist <= 100) { score += 5; }
  }

  return { score: Math.min(100, score), factors };
}

export function useThreatIntelligence(limit = 100) {
  return useQuery({
    queryKey: ['security-threat-intelligence', limit],
    queryFn: async (): Promise<ThreatItem[]> => {
      const [rrssRes, svcRes] = await Promise.all([
        supabase
          .from('incidentes_rrss')
          .select('id, tipo_incidente, subtipo, severidad, fecha_publicacion, red_social, ubicacion_normalizada, carretera, municipio, estado, resumen_ai, texto_original, confianza_clasificacion, armas_mencionadas, num_victimas, monto_perdida_estimado, sentimiento, url_publicacion, coordenadas_lat, coordenadas_lng')
          .order('fecha_publicacion', { ascending: false })
          .limit(limit),
        supabase
          .from('servicios_planificados')
          .select('origen_lat, origen_lng, destino_lat, destino_lng, fecha_servicio')
          .not('origen_lat', 'is', null)
          .gte('fecha_servicio', new Date(Date.now() - 7 * 86400000).toISOString())
          .limit(200),
      ]);

      if (rrssRes.error) throw rrssRes.error;
      const incidents = rrssRes.data || [];
      const activeZones: ServiceZone[] = (svcRes.data || []).map((s: any) => ({
        origen_lat: Number(s.origen_lat),
        origen_lng: Number(s.origen_lng),
        destino_lat: s.destino_lat ? Number(s.destino_lat) : null,
        destino_lng: s.destino_lng ? Number(s.destino_lng) : null,
        fecha_servicio: s.fecha_servicio,
      }));

      return incidents
        .map((inc: any) => {
          const { score, factors } = scoreRelevance(inc, activeZones);
          return {
            id: inc.id,
            tipoIncidente: inc.tipo_incidente,
            subtipo: inc.subtipo,
            severidad: inc.severidad || 'media',
            fechaPublicacion: inc.fecha_publicacion || '',
            redSocial: inc.red_social,
            ubicacion: inc.ubicacion_normalizada,
            carretera: inc.carretera,
            municipio: inc.municipio,
            estado: inc.estado,
            resumenAi: inc.resumen_ai,
            textoOriginal: inc.texto_original,
            confianzaClasificacion: inc.confianza_clasificacion,
            armasMencionadas: inc.armas_mencionadas || false,
            numVictimas: inc.num_victimas,
            montoPerdida: inc.monto_perdida_estimado,
            sentimiento: inc.sentimiento,
            urlPublicacion: inc.url_publicacion,
            coordLat: inc.coordenadas_lat,
            coordLng: inc.coordenadas_lng,
            relevanceScore: score,
            relevanceFactors: factors,
          };
        })
        .sort((a: ThreatItem, b: ThreatItem) => b.relevanceScore - a.relevanceScore);
    },
    staleTime: 5 * 60 * 1000,
  });
}
