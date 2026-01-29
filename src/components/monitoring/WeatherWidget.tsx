import { CloudRain, CloudSun, Sun, Cloud, CloudFog, Snowflake, Thermometer, Wind, Droplets } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeatherData, WeatherData } from '@/hooks/useWeatherData';

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'rainy':
      return <CloudRain className="h-6 w-6 text-blue-500" />;
    case 'sunny':
      return <Sun className="h-6 w-6 text-yellow-500" />;
    case 'partly-cloudy':
      return <CloudSun className="h-6 w-6 text-gray-500" />;
    case 'foggy':
      return <CloudFog className="h-6 w-6 text-gray-400" />;
    case 'snowy':
      return <Snowflake className="h-6 w-6 text-blue-300" />;
    default:
      return <Cloud className="h-6 w-6 text-gray-500" />;
  }
};

const getConditionLabel = (condition: string): string => {
  const labels: Record<string, string> = {
    'sunny': 'Despejado',
    'partly-cloudy': 'Parcialmente nublado',
    'rainy': 'Lluvia',
    'foggy': 'Neblina',
    'snowy': 'Nieve',
  };
  return labels[condition] || 'Variable';
};

const WeatherCard = ({ item, isFallback }: { item: WeatherData; isFallback: boolean }) => (
  <Card className="min-w-[200px] bg-card border shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{item.location}</p>
            {item.error && (
              <Badge variant="outline" className="text-xs">Sin conexión</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <span className="text-xl font-semibold">{item.temperature}°C</span>
          </div>
          {item.feelsLike !== undefined && item.feelsLike !== item.temperature && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Sensación {item.feelsLike}°C
            </p>
          )}
        </div>
        <div className="flex flex-col items-center">
          {getWeatherIcon(item.condition)}
          <span className="text-xs text-muted-foreground mt-1 text-center">
            {item.description || getConditionLabel(item.condition)}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Wind className="h-3 w-3" />
          <span>{item.windSpeed} km/h</span>
        </div>
        {item.humidity !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Droplets className="h-3 w-3" />
            <span>{item.humidity}%</span>
          </div>
        )}
        {item.precipitation > 0 && (
          <div className="flex items-center gap-1">
            <CloudRain className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-blue-600 font-medium">{item.precipitation}%</span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const LoadingSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto pb-1">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="min-w-[200px] bg-card border shadow-sm">
        <CardContent className="p-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="flex gap-3 mt-2 pt-2 border-t">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const WeatherWidget = () => {
  const { data: weatherResponse, isLoading, error } = useWeatherData();
  
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  const weatherData = weatherResponse?.data || [];
  const isFallback = weatherResponse?.isFallback ?? true;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <CloudSun className="h-4 w-4" />
          Condiciones Climáticas
        </h3>
        {isFallback && (
          <Badge variant="outline" className="text-xs">Demo</Badge>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
        {weatherData.map((item, index) => (
          <WeatherCard key={item.location || index} item={item} isFallback={isFallback} />
        ))}
      </div>
    </div>
  );
};

export default WeatherWidget;
