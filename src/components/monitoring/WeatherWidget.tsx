
import { useState, useEffect } from 'react';
import { CloudRain, CloudSun, Thermometer, Wind } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

// Mock weather data - In production this would come from a weather API
const mockWeatherData = [
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
];

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'rainy':
      return <CloudRain className="h-5 w-5 text-blue-500" />;
    case 'sunny':
      return <CloudSun className="h-5 w-5 text-yellow-500" />;
    case 'partly-cloudy':
      return <CloudSun className="h-5 w-5 text-gray-500" />;
    default:
      return <CloudSun className="h-5 w-5 text-gray-500" />;
  }
};

export const WeatherWidget = () => {
  const [weather, setWeather] = useState(mockWeatherData);
  
  // In a real app, we would fetch data from a weather API
  useEffect(() => {
    // Fetch weather data here
  }, []);
  
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
      {weather.map((item, index) => (
        <Card key={index} className="min-w-[200px] bg-white border shadow-sm">
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{item.location}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Thermometer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{item.temperature}°C</span>
                </div>
              </div>
              <div>
                {getWeatherIcon(item.condition)}
                {item.condition === 'rainy' && (
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-blue-600 font-medium">{item.precipitation}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <Wind className="h-3 w-3" />
              <span>{item.windSpeed} km/h</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WeatherWidget;
