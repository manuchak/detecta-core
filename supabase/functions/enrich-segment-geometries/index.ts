import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
    if (!MAPBOX_TOKEN) throw new Error("MAPBOX_ACCESS_TOKEN not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { segments } = await req.json();
    // segments: [{ id: string, waypoints: [lng, lat][] }]

    if (!segments || !Array.isArray(segments)) {
      throw new Error("Expected { segments: [{ id, waypoints }] }");
    }

    const results: any[] = [];

    for (const seg of segments) {
      if (!seg.waypoints || seg.waypoints.length < 2) {
        results.push({ id: seg.id, status: "skipped", reason: "< 2 waypoints" });
        continue;
      }

      // Build coordinates string for Mapbox Directions API
      const coords = seg.waypoints.map((wp: number[]) => `${wp[0]},${wp[1]}`).join(";");
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

      const resp = await fetch(url);
      if (!resp.ok) {
        const errText = await resp.text();
        results.push({ id: seg.id, status: "error", reason: `Mapbox ${resp.status}: ${errText}` });
        continue;
      }

      const data = await resp.json();
      const route = data.routes?.[0];
      if (!route) {
        results.push({ id: seg.id, status: "error", reason: "No route found" });
        continue;
      }

      const coordinates = route.geometry.coordinates;
      const distance_km = Math.round((route.distance / 1000) * 10) / 10;
      const duration_minutes = Math.round(route.duration / 60);

      // Upsert into segment_geometries
      const { error: upsertErr } = await supabase
        .from("segment_geometries")
        .upsert({
          segment_id: seg.id,
          coordinates,
          distance_km,
          duration_minutes,
          enriched_at: new Date().toISOString(),
        }, { onConflict: "segment_id" });

      if (upsertErr) {
        results.push({ id: seg.id, status: "error", reason: upsertErr.message });
      } else {
        results.push({ id: seg.id, status: "ok", points: coordinates.length, distance_km, duration_minutes });
      }

      // Rate limit: ~2 req/s to stay safe
      await new Promise(r => setTimeout(r, 500));
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
