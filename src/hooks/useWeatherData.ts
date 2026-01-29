import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeatherData {
  location: string;
  temperature: number;
  condition: 'sunny' | 'partly-cloudy' | 'rainy' | 'snowy' | 'foggy';
  precipitation: number;
  windSpeed: number;
  humidity?: number;
  description?: string;
  feelsLike?: number;
  error?: boolean;
}

interface WeatherResponse {
  data?: WeatherData[];
  timestamp?: string;
  source?: string;
  error?: string;
  fallback?: boolean;
}

// Datos mock como fallback
const mockWeatherData: WeatherData[] = [
  {
    location: "Ciudad de México",
    temperature: 22,
    condition: "partly-cloudy",
    precipitation: 0,
    windSpeed: 12
  },
  {
    location: "Puebla",
    temperature: 19,
    condition: "rainy",
    precipitation: 65,
    windSpeed: 8
  },
  {
    location: "Querétaro",
    temperature: 24,
    condition: "sunny",
    precipitation: 0,
    windSpeed: 5
  },
  {
    location: "Guadalajara",
    temperature: 26,
    condition: "sunny",
    precipitation: 0,
    windSpeed: 10
  },
];

export const useWeatherData = () => {
  return useQuery({
    queryKey: ['weather-data'],
    queryFn: async (): Promise<{ data: WeatherData[]; isFallback: boolean; timestamp?: string }> => {
      try {
        const { data, error } = await supabase.functions.invoke<WeatherResponse>('weather-data');
        
        if (error) {
          console.error('Error fetching weather:', error);
          return { data: mockWeatherData, isFallback: true };
        }
        
        // Si la API indica fallback o no hay datos, usar mock
        if (data?.fallback || !data?.data || data.data.length === 0) {
          console.warn('Weather API returned fallback flag or no data');
          return { data: mockWeatherData, isFallback: true };
        }
        
        return { 
          data: data.data, 
          isFallback: false,
          timestamp: data.timestamp 
        };
      } catch (err) {
        console.error('Failed to fetch weather data:', err);
        return { data: mockWeatherData, isFallback: true };
      }
    },
    staleTime: 60 * 60 * 1000, // Cache 1 hora
    refetchInterval: 2 * 60 * 60 * 1000, // Refetch cada 2 horas
    retry: 2,
    retryDelay: 1000,
  });
};

export default useWeatherData;
