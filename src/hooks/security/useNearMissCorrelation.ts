import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NearMiss {
  rrssId: string;
  tipoIncidente: string;
  severidad: string;
  fechaPublicacion: string;
  ubicacion: string;
  carretera: string | null;
  resumenAi: string | null;
  servicioId: string;
  clienteNombre: string | null;
  fechaServicio: string;
  distanciaKm: number;
  horasDiferencia: number;
}

/** Haversine distance in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useNearMissCorrelation() {
  return useQuery({
    queryKey: ['security-near-miss-correlation'],
    queryFn: async (): Promise<NearMiss[]> => {
      // Fetch RRSS incidents with coordinates
      const { data: rrss, error: e1 } = await supabase
        .from('incidentes_rrss')
        .select('id, tipo_incidente, severidad, fecha_publicacion, ubicacion_normalizada, carretera, resumen_ai, coordenadas_lat, coordenadas_lng')
        .not('coordenadas_lat', 'is', null)
        .not('coordenadas_lng', 'is', null)
        .order('fecha_publicacion', { ascending: false })
        .limit(500);

      if (e1) throw e1;

      // Fetch planned services with coordinates
      const { data: servicios, error: e2 } = await supabase
        .from('servicios_planificados')
        .select('id, cliente_nombre, fecha_servicio, origen_lat, origen_lng, destino_lat, destino_lng')
        .not('origen_lat', 'is', null)
        .order('fecha_servicio', { ascending: false })
        .limit(1000);

      if (e2) throw e2;
      if (!rrss?.length || !servicios?.length) return [];

      const nearMisses: NearMiss[] = [];
      const RADIUS_KM = 50;
      const HOURS_WINDOW = 48;

      for (const inc of rrss) {
        const incLat = Number(inc.coordenadas_lat);
        const incLng = Number(inc.coordenadas_lng);
        const incTime = new Date(inc.fecha_publicacion || '').getTime();
        if (!incLat || !incLng || !incTime) continue;

        for (const svc of servicios) {
          const svcTime = new Date(svc.fecha_servicio || '').getTime();
          const hoursDiff = Math.abs(incTime - svcTime) / 3600000;
          if (hoursDiff > HOURS_WINDOW) continue;

          // Check distance to origin and destination
          const dOrigen = haversineKm(incLat, incLng, Number(svc.origen_lat), Number(svc.origen_lng));
          const dDestino = svc.destino_lat
            ? haversineKm(incLat, incLng, Number(svc.destino_lat), Number(svc.destino_lng))
            : Infinity;
          const minDist = Math.min(dOrigen, dDestino);

          if (minDist <= RADIUS_KM) {
            nearMisses.push({
              rrssId: inc.id,
              tipoIncidente: inc.tipo_incidente,
              severidad: inc.severidad || 'media',
              fechaPublicacion: inc.fecha_publicacion || '',
              ubicacion: inc.ubicacion_normalizada || 'Desconocida',
              carretera: inc.carretera,
              resumenAi: inc.resumen_ai,
              servicioId: svc.id,
              clienteNombre: svc.cliente_nombre,
              fechaServicio: svc.fecha_servicio || '',
              distanciaKm: Math.round(minDist * 10) / 10,
              horasDiferencia: Math.round(hoursDiff * 10) / 10,
            });
          }
        }
      }

      // Sort by proximity then time
      return nearMisses
        .sort((a, b) => a.distanciaKm - b.distanciaKm || a.horasDiferencia - b.horasDiferencia)
        .slice(0, 50);
    },
    staleTime: 10 * 60 * 1000,
  });
}
