import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RouteRequest {
  origin: [number, number]; // [lon, lat]
  destination: [number, number];
  waypoints?: [number, number][];
  max_width_m?: number;
  max_weight_tons?: number;
  alley_bias?: number;
  exclude?: string[]; // ["unpaved","ferry","toll","tunnel"]
}

interface DirectionsRoute {
  geometry: { type: string; coordinates: number[][] };
  distance: number;
  duration: number;
  weight_name: string;
}

async function callDirections(
  coords: [number, number][],
  params: {
    alley_bias: number;
    max_width: number;
    max_weight: number;
    exclude: string[];
  },
  token: string
): Promise<{ routes: DirectionsRoute[] }> {
  const coordStr = coords.map((c) => `${c[0]},${c[1]}`).join(";");

  const searchParams = new URLSearchParams({
    access_token: token,
    geometries: "geojson",
    overview: "full",
    steps: "false",
    alternatives: "true",
    continue_straight: "true",
  });

  // Truck-realistic params
  if (params.alley_bias !== 0) {
    searchParams.set("alley_bias", params.alley_bias.toString());
  }
  if (params.max_width > 0) {
    searchParams.set("max_width", params.max_width.toString());
  }
  if (params.max_weight > 0) {
    searchParams.set("max_weight", params.max_weight.toString());
  }
  if (params.exclude.length > 0) {
    searchParams.set("exclude", params.exclude.join(","));
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordStr}?${searchParams.toString()}`;
  console.log(`[calculate-truck-route] Calling Directions API with ${coords.length} coordinates`);

  const resp = await fetch(url);
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Mapbox Directions error ${resp.status}: ${errText}`);
  }
  return resp.json();
}

function mergeGeometries(segments: DirectionsRoute[]): {
  geometry: { type: string; coordinates: number[][] };
  distance: number;
  duration: number;
} {
  const allCoords: number[][] = [];
  let totalDistance = 0;
  let totalDuration = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const coords = seg.geometry.coordinates;
    // Remove first 2 points from subsequent segments (overlap)
    const startIdx = i === 0 ? 0 : 2;
    allCoords.push(...coords.slice(startIdx));
    totalDistance += seg.distance;
    totalDuration += seg.duration;
  }

  return {
    geometry: { type: "LineString", coordinates: allCoords },
    distance: totalDistance,
    duration: totalDuration,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
    if (!MAPBOX_TOKEN) {
      throw new Error("MAPBOX_ACCESS_TOKEN not configured");
    }

    const body: RouteRequest = await req.json();
    const { origin, destination, waypoints = [] } = body;
    const alley_bias = body.alley_bias ?? -1;
    const max_width = body.max_width_m ?? 2.6;
    const max_weight = body.max_weight_tons ?? 40;
    const exclude = body.exclude ?? ["unpaved", "ferry"];

    if (!origin || !destination || origin.length !== 2 || destination.length !== 2) {
      throw new Error("origin and destination must be [lon, lat] arrays");
    }

    // Build full coordinate list
    const allCoords: [number, number][] = [origin, ...waypoints, destination];
    const params = { alley_bias, max_width, max_weight, exclude };

    let bestRoute: DirectionsRoute;
    let altRoute: DirectionsRoute | null = null;
    const warnings: string[] = [];

    if (allCoords.length <= 25) {
      // Single request
      const result = await callDirections(allCoords, params, MAPBOX_TOKEN);
      if (!result.routes || result.routes.length === 0) {
        throw new Error("Mapbox returned no routes");
      }
      bestRoute = result.routes[0];

      // Pick alternative if available and reasonable
      if (result.routes.length > 1) {
        const alt = result.routes[1];
        const durationRatio = alt.duration / bestRoute.duration;
        if (durationRatio <= 1.15) {
          altRoute = alt;
        } else {
          warnings.push(`Alternative route rejected: ${(durationRatio * 100 - 100).toFixed(0)}% slower`);
        }
      }
    } else {
      // Chunking: split into segments of max 25 with 2-point overlap
      console.log(`[calculate-truck-route] Chunking ${allCoords.length} coords`);
      const CHUNK_SIZE = 25;
      const OVERLAP = 2;
      const chunks: [number, number][][] = [];

      for (let i = 0; i < allCoords.length; i += CHUNK_SIZE - OVERLAP) {
        const chunk = allCoords.slice(i, i + CHUNK_SIZE);
        if (chunk.length >= 2) {
          chunks.push(chunk);
        }
        if (i + CHUNK_SIZE >= allCoords.length) break;
      }

      warnings.push(`Route chunked into ${chunks.length} segments (${allCoords.length} total coords)`);

      const segmentRoutes: DirectionsRoute[] = [];
      for (const chunk of chunks) {
        const result = await callDirections(chunk, params, MAPBOX_TOKEN);
        if (!result.routes || result.routes.length === 0) {
          throw new Error(`Mapbox returned no routes for chunk of ${chunk.length} coords`);
        }
        segmentRoutes.push(result.routes[0]);
      }

      const merged = mergeGeometries(segmentRoutes);
      bestRoute = {
        geometry: merged.geometry,
        distance: merged.distance,
        duration: merged.duration,
        weight_name: "auto",
      } as DirectionsRoute;
    }

    const distance_km = Math.round((bestRoute.distance / 1000) * 100) / 100;
    const duration_min = Math.round((bestRoute.duration / 60) * 100) / 100;

    const response = {
      route_geojson: bestRoute.geometry,
      alt_route_geojson: altRoute?.geometry || null,
      distance_km,
      duration_min,
      warnings,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[calculate-truck-route] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
