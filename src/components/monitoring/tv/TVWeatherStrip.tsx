import { CloudRain, Sun, CloudSun, CloudFog, Snowflake, Cloud } from 'lucide-react';
import { useWeatherData, WeatherData } from '@/hooks/useWeatherData';

const getIcon = (condition: string) => {
  const cls = "h-4 w-4 shrink-0";
  switch (condition) {
    case 'rainy': return <CloudRain className={`${cls} text-blue-400`} />;
    case 'sunny': return <Sun className={`${cls} text-yellow-400`} />;
    case 'partly-cloudy': return <CloudSun className={`${cls} text-gray-400`} />;
    case 'foggy': return <CloudFog className={`${cls} text-gray-500`} />;
    case 'snowy': return <Snowflake className={`${cls} text-blue-300`} />;
    default: return <Cloud className={`${cls} text-gray-500`} />;
  }
};

const TVWeatherStrip = () => {
  const { data: weatherResponse } = useWeatherData();
  const items = weatherResponse?.data || [];

  return (
    <div className="flex items-center gap-5 px-3 py-2 rounded-lg border border-white/10 bg-white/5">
      {items.map((item) => (
        <div key={item.location} className="flex items-center gap-1.5">
          {getIcon(item.condition)}
          <span className="text-sm text-gray-300 font-medium">{item.location}</span>
          <span className="text-sm text-white font-bold">{item.temperature}°</span>
        </div>
      ))}
    </div>
  );
};

export default TVWeatherStrip;
