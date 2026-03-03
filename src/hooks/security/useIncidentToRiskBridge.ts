import { supabase } from '@/integrations/supabase/client';

/**
 * Bridge: Propagates an incidente_operativo to security_events
 * so that operational incidents (robberies, assaults) recalibrate H3 risk zones.
 * 
 * Requirements:
 * - The incident must have coordinates (from a timeline entry with ubicacion_lat/lng)
 * - Only relevant types are propagated: robo, asalto, secuestro, amenaza
 * 
 * Flow:
 * 1. Fetch latest timeline entry with coordinates for the incident
 * 2. Convert lat/lng → H3 index via geocode-to-h3 edge function
 * 3. Insert into security_events with source='operativo_detecta', verified=true
 */

const PROPAGABLE_TYPES = ['robo', 'asalto', 'secuestro', 'amenaza', 'robo_vehiculo', 'robo_carga'];

const SEVERITY_MAP: Record<string, string> = {
  critica: 'critico',
  alta: 'alto',
  media: 'medio',
  baja: 'bajo',
};

interface PropagateParams {
  incidenteId: string;
  tipo: string;
  severidad: string;
  descripcion: string;
  fechaIncidente: string;
  // Optional: if caller already has coordinates
  lat?: number;
  lng?: number;
}

/**
 * Attempt to propagate an operational incident to security_events.
 * Fails silently (logs error) — never blocks the main mutation.
 */
export async function propagateIncidentToSecurityEvents(params: PropagateParams): Promise<boolean> {
  try {
    // Only propagate relevant incident types
    const normalizedTipo = params.tipo.toLowerCase().replace(/\s+/g, '_');
    if (!PROPAGABLE_TYPES.some(t => normalizedTipo.includes(t))) {
      return false;
    }

    let lat = params.lat;
    let lng = params.lng;

    // If no coordinates provided, try to find them from timeline entries
    if (!lat || !lng) {
      const { data: entries } = await (supabase as any)
        .from('entradas_cronologia_incidente')
        .select('ubicacion_lat, ubicacion_lng')
        .eq('incidente_id', params.incidenteId)
        .not('ubicacion_lat', 'is', null)
        .not('ubicacion_lng', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (entries && entries.length > 0) {
        lat = entries[0].ubicacion_lat;
        lng = entries[0].ubicacion_lng;
      }
    }

    // Can't propagate without coordinates
    if (!lat || !lng) {
      console.info('[IncidentBridge] No coordinates available, skipping propagation for', params.incidenteId);
      return false;
    }

    // Convert to H3 index via edge function
    const { data: h3Data, error: h3Error } = await supabase.functions.invoke('geocode-to-h3', {
      body: { lat, lng, resolution: 7 },
    });

    if (h3Error || !h3Data?.h3Index) {
      console.error('[IncidentBridge] H3 conversion failed:', h3Error || 'No h3Index returned');
      return false;
    }

    const h3Index: string = h3Data.h3Index;
    const severity = SEVERITY_MAP[params.severidad] || 'medio';

    // Check for duplicate (same incident already propagated)
    const { data: existing } = await (supabase as any)
      .from('security_events')
      .select('id')
      .eq('source', 'operativo_detecta')
      .eq('description', `[OP:${params.incidenteId}]`)
      .limit(1);

    if (existing && existing.length > 0) {
      console.info('[IncidentBridge] Already propagated:', params.incidenteId);
      return true;
    }

    // Insert into security_events
    const { error: insertError } = await (supabase as any)
      .from('security_events')
      .insert({
        event_type: normalizedTipo,
        severity,
        event_date: params.fechaIncidente,
        h3_index: h3Index,
        h3_resolution: 7,
        lat,
        lng,
        source: 'operativo_detecta',
        verified: true,
        description: `[OP:${params.incidenteId}] ${params.descripcion?.substring(0, 200) || ''}`,
      });

    if (insertError) {
      console.error('[IncidentBridge] Insert to security_events failed:', insertError);
      return false;
    }

    console.info('[IncidentBridge] Successfully propagated incident', params.incidenteId, '→ H3:', h3Index);
    return true;
  } catch (err) {
    console.error('[IncidentBridge] Unexpected error:', err);
    return false;
  }
}
