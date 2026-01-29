import { CloudRain, CloudSun, Sun, Cloud, CloudFog, Snowflake, Wind } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeatherData, WeatherData } from '@/hooks/useWeatherData';

const getWeatherIcon = (condition: string) => {
  const iconClass = "h-5 w-5 shrink-0";
  switch (condition) {
    case 'rainy':
      return <CloudRain className={`${iconClass} text-blue-500`} />;
    case 'sunny':
      return <Sun className={`${iconClass} text-yellow-500`} />;
    case 'partly-cloudy':
      return <CloudSun className={`${iconClass} text-gray-500`} />;
    case 'foggy':
      return <CloudFog className={`${iconClass} text-gray-400`} />;
    case 'snowy':
      return <Snowflake className={`${iconClass} text-blue-300`} />;
    default:
      return <Cloud className={`${iconClass} text-gray-500`} />;
  }
};

const WeatherCard = ({ item }: { item: WeatherData }) => (
  <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground truncate max-w-[80px]">
          {item.location}
        </span>
        {getWeatherIcon(item.condition)}
      </div>
      <div className="text-lg font-semibold text-foreground">
        {item.temperature}°
      </div>
      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
        <Wind className="h-3 w-3 shrink-0" />
        <span>{item.windSpeed} km/h</span>
      </div>
    </CardContent>
  </Card>
);

const LoadingSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Card key={i} className="bg-card border shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <Skeleton className="h-6 w-10 mb-1" />
          <Skeleton className="h-3 w-14" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const WeatherWidget = () => {
  const { data: weatherResponse, isLoading } = useWeatherData();
  
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {weatherData.map((item, index) => (
          <WeatherCard key={item.location || index} item={item} />
        ))}
      </div>
    </div>
  );
};

export default WeatherWidget;
