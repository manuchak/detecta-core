import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { latLngToCell } from "https://esm.sh/h3-js@4.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, lat, lng, resolution = 8 } = await req.json();
    
    // MODO 1: Coordenadas directas - solo calcular H3
    if (lat !== undefined && lng !== undefined) {
      console.log(`Direct coordinates mode: (${lat}, ${lng})`);
      const h3Index = latLngToCell(lat, lng, resolution);
      console.log(`Calculated H3 index: ${h3Index}`);
      
      return new Response(
        JSON.stringify({ lat, lng, h3Index, h3Resolution: resolution }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // MODO 2: Geocodificar dirección
    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address or coordinates are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_SECRET_TOKEN') || Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!MAPBOX_TOKEN) {
      console.error('MAPBOX token not configured');
      return new Response(
        JSON.stringify({ error: 'Geocoding service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=MX`;
    
    console.log('Geocoding address:', address);
    const geocodeResponse = await fetch(geocodeUrl);
    
    if (!geocodeResponse.ok) {
      console.error('Mapbox geocoding failed:', geocodeResponse.status);
      return new Response(
        JSON.stringify({ error: 'Geocoding failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geocodeData = await geocodeResponse.json();
    
    if (!geocodeData.features || geocodeData.features.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Address not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const feature = geocodeData.features[0];
    const [geoLng, geoLat] = feature.center;
    const formattedAddress = feature.place_name;
    const h3Index = latLngToCell(geoLat, geoLng, resolution);

    console.log(`Geocoded "${address}" to (${geoLat}, ${geoLng}), H3: ${h3Index}`);

    return new Response(
      JSON.stringify({ address: formattedAddress, lat: geoLat, lng: geoLng, h3Index, h3Resolution: resolution }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in geocode-to-h3:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});