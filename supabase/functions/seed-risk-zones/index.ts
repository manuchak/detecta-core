import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4?target=deno";
import { latLngToCell } from "https://esm.sh/h3-js@4.1.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const H3_RESOLUTION = 6;

const HIGHWAY_CORRIDORS = {
  'mexico-puebla': { name: 'México-Puebla (150D)', riskLevel: 'extremo', baseScoreRange: [85, 100], multiplierRange: [1.45, 1.50], avgEventsPerHex: 8, waypoints: [[19.4060,-99.0872],[19.3800,-98.9600],[19.3400,-98.8900],[19.3100,-98.7800],[19.2800,-98.6200],[19.2600,-98.5100],[19.2750,-98.4400],[19.2300,-98.3800],[19.1600,-98.2800],[19.0400,-98.2000]] },
  'edomex-industrial': { name: 'Zona Industrial EdoMex', riskLevel: 'extremo', baseScoreRange: [88, 100], multiplierRange: [1.45, 1.50], avgEventsPerHex: 10, waypoints: [[19.6010,-99.0600],[19.5700,-99.1200],[19.6458,-99.1700],[19.6500,-99.2100],[19.5400,-99.2000],[19.4800,-99.2300],[19.5200,-99.2600],[19.6800,-99.1400]] },
  'mexico-texcoco': { name: 'México-Texcoco', riskLevel: 'extremo', baseScoreRange: [82, 95], multiplierRange: [1.40, 1.48], avgEventsPerHex: 7, waypoints: [[19.4300,-99.0700],[19.4500,-98.9800],[19.4800,-98.9200],[19.5100,-98.8800],[19.5400,-98.8200]] },
  'san-luis-potosi-hub': { name: 'Hub SLP (57/70/80)', riskLevel: 'extremo', baseScoreRange: [90, 100], multiplierRange: [1.48, 1.50], avgEventsPerHex: 12, waypoints: [[22.1500,-100.9800],[22.2800,-100.7500],[22.4100,-100.5200],[21.8800,-100.8200],[21.8500,-101.1500],[22.0500,-100.4500]] },
  'mexico-queretaro': { name: 'México-Querétaro (57D)', riskLevel: 'alto', baseScoreRange: [65, 78], multiplierRange: [1.28, 1.35], avgEventsPerHex: 5, waypoints: [[19.7150,-99.2200],[19.8200,-99.3500],[19.9000,-99.4500],[19.9500,-99.5300],[20.1500,-99.7000],[20.2800,-99.8500],[20.3900,-99.9900],[20.4800,-100.1500],[20.5900,-100.3900]] },
  'corredor-bajio': { name: 'Corredor Bajío (45D)', riskLevel: 'alto', baseScoreRange: [68, 78], multiplierRange: [1.28, 1.35], avgEventsPerHex: 6, waypoints: [[20.5900,-100.3900],[20.5500,-100.5500],[20.5200,-100.8100],[20.5700,-101.0200],[20.6700,-101.3500],[20.9500,-101.4300],[21.0500,-101.5200],[21.1200,-101.6800]] },
  'guadalajara-lagos': { name: 'Guadalajara-Lagos de Moreno', riskLevel: 'alto', baseScoreRange: [62, 75], multiplierRange: [1.25, 1.32], avgEventsPerHex: 5, waypoints: [[20.6700,-103.3500],[20.7200,-103.1800],[20.8100,-102.9500],[20.9300,-102.7200],[21.3500,-102.3400],[21.4200,-102.0800]] },
  'tamaulipas-frontera': { name: 'Corredor Tamaulipas (85)', riskLevel: 'alto', baseScoreRange: [65, 78], multiplierRange: [1.28, 1.35], avgEventsPerHex: 5, waypoints: [[23.7250,-99.5200],[24.0300,-99.1700],[24.3500,-98.9500],[24.7900,-98.7300],[25.4200,-98.5600],[25.8700,-98.2900],[25.8700,-97.5000]] },
  'manzanillo-tampico': { name: 'Manzanillo-Tampico (Transversal)', riskLevel: 'alto', baseScoreRange: [65, 78], multiplierRange: [1.28, 1.35], avgEventsPerHex: 6, waypoints: [[19.1100,-104.3100],[20.6700,-103.3500],[21.3500,-102.3400],[21.8800,-101.8800],[22.1500,-100.9800],[22.2500,-99.1500],[22.2300,-97.8600]] },
  'lazaro-cardenas-cdmx': { name: 'Lázaro Cárdenas-CDMX', riskLevel: 'alto', baseScoreRange: [65, 78], multiplierRange: [1.28, 1.35], avgEventsPerHex: 5, waypoints: [[17.9270,-102.1690],[18.9200,-101.1900],[19.7010,-101.1850],[19.7200,-100.4500],[19.6500,-100.2800],[19.5500,-99.5300],[19.4200,-99.1700]] },
  'altiplano-central': { name: 'Altiplano Central (45/49)', riskLevel: 'alto', baseScoreRange: [68, 78], multiplierRange: [1.28, 1.35], avgEventsPerHex: 6, waypoints: [[21.8800,-102.2900],[22.7700,-102.5700],[23.1900,-102.2800],[22.8500,-101.5200],[22.1500,-100.9800]] },
  'mazatlan-durango-torreon': { name: 'Mazatlán-Durango-Torreón', riskLevel: 'alto', baseScoreRange: [62, 75], multiplierRange: [1.25, 1.32], avgEventsPerHex: 5, waypoints: [[23.2300,-106.4200],[23.6800,-105.8500],[24.0200,-105.0200],[24.8500,-104.4500],[25.5400,-103.4500]] },
  'queretaro-ciudad-juarez': { name: 'Querétaro-Cd. Juárez (45/49)', riskLevel: 'alto', baseScoreRange: [60, 72], multiplierRange: [1.22, 1.30], avgEventsPerHex: 4, waypoints: [[20.5900,-100.3900],[22.1500,-100.9800],[22.7700,-102.5700],[25.5400,-103.4500],[28.6400,-105.4800],[31.7400,-106.4300]] },
  'mexico-veracruz': { name: 'México-Veracruz (150D/180D)', riskLevel: 'medio', baseScoreRange: [45, 58], multiplierRange: [1.15, 1.20], avgEventsPerHex: 4, waypoints: [[19.0400,-98.2000],[18.9300,-97.9200],[18.8700,-97.6300],[18.8500,-97.4000],[18.8800,-97.1000],[18.8500,-96.9300],[18.9200,-96.6800],[19.0500,-96.4500],[19.2033,-96.1342]] },
  'guadalajara-colima': { name: 'Guadalajara-Manzanillo', riskLevel: 'medio', baseScoreRange: [45, 58], multiplierRange: [1.15, 1.20], avgEventsPerHex: 4, waypoints: [[20.6700,-103.3500],[20.5200,-103.4800],[20.2100,-103.7600],[19.9200,-103.9800],[19.5800,-104.2200],[19.1100,-104.3100]] },
  'monterrey-saltillo': { name: 'Monterrey-Saltillo (40D)', riskLevel: 'medio', baseScoreRange: [42, 55], multiplierRange: [1.12, 1.18], avgEventsPerHex: 3, waypoints: [[25.6700,-100.3100],[25.5800,-100.4500],[25.5200,-100.6200],[25.4300,-100.8500],[25.4200,-101.0000]] },
  'laredo-monterrey': { name: 'Nuevo Laredo-Monterrey (85D)', riskLevel: 'medio', baseScoreRange: [48, 60], multiplierRange: [1.15, 1.20], avgEventsPerHex: 4, waypoints: [[27.4800,-99.5200],[27.1200,-99.6500],[26.6800,-99.8200],[26.2300,-100.0500],[25.6700,-100.3100]] },
  'veracruz-monterrey': { name: 'Veracruz-Monterrey (180/85)', riskLevel: 'medio', baseScoreRange: [48, 60], multiplierRange: [1.15, 1.20], avgEventsPerHex: 4, waypoints: [[19.2033,-96.1342],[20.5300,-97.0500],[21.1500,-98.2000],[22.2500,-99.1500],[22.1500,-100.9800],[25.6700,-100.3100]] },
  'costera-pacifico': { name: 'Costera del Pacífico', riskLevel: 'medio', baseScoreRange: [40, 55], multiplierRange: [1.12, 1.18], avgEventsPerHex: 3, waypoints: [[16.8500,-99.8900],[17.6500,-100.3800],[17.9270,-102.1690],[19.1100,-104.3100]] },
  'puebla-oaxaca': { name: 'Puebla-Oaxaca (135D)', riskLevel: 'medio', baseScoreRange: [40, 55], multiplierRange: [1.12, 1.18], avgEventsPerHex: 3, waypoints: [[19.0400,-98.2000],[18.8500,-97.4000],[18.1300,-97.0600],[17.0600,-96.7200]] },
  'mexico-nogales': { name: 'México-Nogales (15D)', riskLevel: 'medio', baseScoreRange: [42, 55], multiplierRange: [1.12, 1.18], avgEventsPerHex: 3, waypoints: [[19.4200,-99.1700],[20.6700,-103.3500],[21.5000,-105.2500],[23.2300,-106.4200],[24.8000,-107.4000],[25.8000,-108.9800],[27.4800,-109.9300],[29.0700,-110.9700],[31.3100,-110.9400]] },
  'merida-cancun': { name: 'Mérida-Cancún (180D)', riskLevel: 'bajo', baseScoreRange: [8, 25], multiplierRange: [1.00, 1.08], avgEventsPerHex: 1, waypoints: [[20.9700,-89.6200],[20.9300,-89.1500],[20.8500,-88.2000],[20.5100,-87.5300],[21.1600,-86.8500]] },
  'tijuana-ensenada': { name: 'Tijuana-Ensenada (1D)', riskLevel: 'bajo', baseScoreRange: [12, 28], multiplierRange: [1.02, 1.08], avgEventsPerHex: 1, waypoints: [[32.5300,-117.0200],[32.4100,-116.9700],[32.1500,-116.8700],[31.8700,-116.6200]] },
};

const EVENT_TEMPLATES = {
  extremo: [
    { type: 'robo', severity: 'critico', desc: 'Robo con violencia a unidad de carga' },
    { type: 'asalto', severity: 'critico', desc: 'Asalto armado a convoy de transporte' },
    { type: 'secuestro', severity: 'critico', desc: 'Secuestro de operador y robo de mercancía' },
    { type: 'robo', severity: 'alto', desc: 'Robo de tracto-camión completo' },
  ],
  alto: [
    { type: 'robo', severity: 'alto', desc: 'Robo de mercancía en tránsito' },
    { type: 'asalto', severity: 'alto', desc: 'Asalto a unidad en descanso' },
    { type: 'amenaza', severity: 'medio', desc: 'Amenazas a operador de transporte' },
    { type: 'robo', severity: 'medio', desc: 'Robo parcial de carga' },
  ],
  medio: [
    { type: 'robo', severity: 'medio', desc: 'Robo sin violencia' },
    { type: 'vandalismo', severity: 'bajo', desc: 'Daños a unidad de transporte' },
    { type: 'amenaza', severity: 'bajo', desc: 'Intento de robo frustrado' },
  ],
  bajo: [
    { type: 'vandalismo', severity: 'bajo', desc: 'Daños menores a carga' },
    { type: 'accidente', severity: 'bajo', desc: 'Incidente menor en ruta' },
  ],
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function generateCorridorHexagons(corridor: any): Set<string> {
  const hexagons = new Set<string>();
  const waypoints = corridor.waypoints;
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [lat1, lng1] = waypoints[i];
    const [lat2, lng2] = waypoints[i + 1];
    const distance = haversineDistance(lat1, lng1, lat2, lng2);
    const steps = Math.max(1, Math.ceil(distance / 5));
    
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      const lat = lat1 + (lat2 - lat1) * t;
      const lng = lng1 + (lng2 - lng1) * t;
      const h3Index = latLngToCell(lat, lng, H3_RESOLUTION);
      hexagons.add(h3Index);
      
      const offsets = [[0.015, 0], [-0.015, 0], [0, 0.015], [0, -0.015]];
      for (const [latOff, lngOff] of offsets) {
        hexagons.add(latLngToCell(lat + latOff, lng + lngOff, H3_RESOLUTION));
      }
    }
  }
  return hexagons;
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomRecentDate(): string {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 90);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

function generateEvents(h3Index: string, riskLevel: string, count: number): any[] {
  const templates = EVENT_TEMPLATES[riskLevel as keyof typeof EVENT_TEMPLATES] || EVENT_TEMPLATES.bajo;
  const events = [];
  for (let i = 0; i < count; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    events.push({
      h3_index: h3Index, h3_resolution: H3_RESOLUTION, event_type: template.type,
      severity: template.severity, event_date: randomRecentDate(),
      description: template.desc, source: 'CANACAR/SESNSP 2025', verified: Math.random() > 0.15,
    });
  }
  return events;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action } = await req.json();

    if (action === 'clear') {
      console.log('Clearing existing risk zone data...');
      await supabase.from('security_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('risk_zone_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('risk_zone_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      return new Response(
        JSON.stringify({ success: true, message: 'Risk zone data cleared' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Seeding risk zones along Mexican highways (H3 Resolution 6)...');

    const allZones: any[] = [];
    const allEvents: any[] = [];
    const corridorSummary: Record<string, number> = {};

    for (const [corridorId, corridor] of Object.entries(HIGHWAY_CORRIDORS)) {
      console.log(`Processing corridor: ${corridor.name}`);
      const hexagons = generateCorridorHexagons(corridor);
      corridorSummary[corridorId] = hexagons.size;
      console.log(`  - Generated ${hexagons.size} hexagons for ${corridor.name}`);
      
      for (const h3Index of hexagons) {
        const baseScore = Math.round(randomInRange(corridor.baseScoreRange[0], corridor.baseScoreRange[1]));
        const riskLevel = baseScore >= 70 ? 'extremo' : baseScore >= 40 ? 'alto' : baseScore >= 15 ? 'medio' : 'bajo';
        const priceMultiplier = riskLevel === 'extremo' ? 1.8 : riskLevel === 'alto' ? 1.4 : riskLevel === 'medio' ? 1.15 : 1.0;
        allZones.push({
          h3_index: h3Index, h3_resolution: H3_RESOLUTION, base_score: baseScore,
          manual_adjustment: 0, risk_level: riskLevel, price_multiplier: priceMultiplier,
          event_count: corridor.avgEventsPerHex,
          last_event_date: randomRecentDate(), last_calculated_at: new Date().toISOString(),
        });
        
        const eventCount = Math.max(1, Math.round(corridor.avgEventsPerHex * (0.5 + Math.random())));
        allEvents.push(...generateEvents(h3Index, corridor.riskLevel, eventCount));
      }
    }

    // Deduplicate zones
    const uniqueZonesMap = new Map<string, any>();
    for (const zone of allZones) {
      if (!uniqueZonesMap.has(zone.h3_index) || zone.base_score > uniqueZonesMap.get(zone.h3_index).base_score) {
        uniqueZonesMap.set(zone.h3_index, zone);
      }
    }
    const uniqueZones = Array.from(uniqueZonesMap.values());

    // Insert zones in batches
    console.log(`Inserting ${uniqueZones.length} unique risk zones...`);
    for (let i = 0; i < uniqueZones.length; i += 50) {
      const batch = uniqueZones.slice(i, i + 50);
      const { error: zonesError } = await supabase
        .from('risk_zone_scores')
        .upsert(batch, { onConflict: 'h3_index' });
      if (zonesError) console.error('Error inserting zones batch:', zonesError);
    }

    // Insert events in batches
    console.log(`Inserting ${allEvents.length} security events...`);
    for (let i = 0; i < allEvents.length; i += 100) {
      const batch = allEvents.slice(i, i + 100);
      const { error: eventsError } = await supabase
        .from('security_events')
        .insert(batch);
      if (eventsError) console.error('Error inserting events batch:', eventsError);
    }

    const summary = {
      h3_resolution: H3_RESOLUTION,
      corridors_processed: Object.keys(HIGHWAY_CORRIDORS).length,
      total_zones: uniqueZones.length,
      total_events: allEvents.length,
      zones_by_corridor: corridorSummary,
      risk_distribution: {
        extremo: uniqueZones.filter(z => z.base_score >= 85).length,
        alto: uniqueZones.filter(z => z.base_score >= 65 && z.base_score < 85).length,
        medio: uniqueZones.filter(z => z.base_score >= 40 && z.base_score < 65).length,
        bajo: uniqueZones.filter(z => z.base_score < 40).length,
      },
    };

    console.log('Seeding complete:', JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify({ success: true, message: 'Risk zones seeded successfully along Mexican highways (2025 data)', summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error seeding risk zones:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});