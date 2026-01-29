import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 6 ciudades estratégicas ordenadas por volumen logístico
const ciudades = [
  { name: 'CDMX', lat: 19.4326, lon: -99.1332 },
  { name: 'Guadalajara', lat: 20.6597, lon: -103.3496 },
  { name: 'Monterrey', lat: 25.6866, lon: -100.3161 },
  { name: 'Puebla', lat: 19.0414, lon: -98.2063 },
  { name: 'Querétaro', lat: 20.5888, lon: -100.3899 },
  { name: 'León', lat: 21.1250, lon: -101.6860 },
];

// Mapear condición de OpenWeatherMap a nuestro formato
const mapCondition = (condition: string): string => {
  const mapping: Record<string, string> = {
    'Clear': 'sunny',
    'Clouds': 'partly-cloudy',
    'Rain': 'rainy',
    'Drizzle': 'rainy',
    'Thunderstorm': 'rainy',
    'Snow': 'snowy',
    'Mist': 'foggy',
    'Fog': 'foggy',
    'Haze': 'foggy',
  };
  return mapping[condition] || 'partly-cloudy';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const WEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
    
    if (!WEATHER_API_KEY) {
      console.error('OPENWEATHER_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Weather API not configured', fallback: true }),
        { 
          status: 200, // Return 200 so frontend can show fallback
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching weather data for ${ciudades.length} cities...`);

    const weatherData = await Promise.all(
      ciudades.map(async (ciudad) => {
        try {
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${ciudad.lat}&lon=${ciudad.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
          
          const response = await fetch(url);
          
          if (!response.ok) {
            console.error(`Error fetching weather for ${ciudad.name}: ${response.status}`);
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          
          return {
            location: ciudad.name,
            temperature: Math.round(data.main.temp),
            condition: mapCondition(data.weather[0]?.main || 'Clouds'),
            precipitation: data.rain?.['1h'] ? Math.round((data.rain['1h'] / 10) * 100) : 0,
            windSpeed: Math.round(data.wind.speed * 3.6), // m/s a km/h
            humidity: data.main.humidity,
            description: data.weather[0]?.description || 'Sin datos',
            feelsLike: Math.round(data.main.feels_like),
          };
        } catch (error) {
          console.error(`Failed to fetch weather for ${ciudad.name}:`, error);
          // Return fallback data for this city
          return {
            location: ciudad.name,
            temperature: 22,
            condition: 'partly-cloudy',
            precipitation: 0,
            windSpeed: 10,
            humidity: 50,
            description: 'Sin conexión',
            feelsLike: 22,
            error: true
          };
        }
      })
    );

    console.log('Weather data fetched successfully');

    return new Response(
      JSON.stringify({ 
        data: weatherData, 
        timestamp: new Date().toISOString(),
        source: 'openweathermap'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Weather function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        fallback: true 
      }),
      { 
        status: 200, // Return 200 so frontend can handle gracefully
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
