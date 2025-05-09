
import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock Twitter feed data with traffic and weather alerts
const mockTweets = [
  {
    id: "1",
    username: "TraficoMX",
    content: "⚠️ Manifestación bloquea Autopista México-Cuernavaca a la altura del km 24. Se recomienda tomar vías alternas.",
    time: "15 min",
    type: "blockade"
  },
  {
    id: "2",
    content: "⛈️ Alerta por lluvia intensa en tramo San Martín-Puebla. Precaución por posibles deslaves en la carretera.",
    username: "ProteccionCivilMX",
    time: "25 min",
    type: "weather"
  },
  {
    id: "3",
    content: "🚨 Accidente en la México-Querétaro a la altura del km 32. Tráfico detenido en dirección norte.",
    username: "TraficoMX",
    time: "40 min",
    type: "accident"
  },
  {
    id: "4",
    content: "ℹ️ Obras de mantenimiento en la México-Toluca. Un carril cerrado desde las 10:00 hasta las 16:00 hrs.",
    username: "SCT_mx",
    time: "1 h",
    type: "roadwork"
  },
  {
    id: "5",
    content: "⚠️ Zona de neblina en la carretera Amecameca-Cuautla. Reduzca velocidad y encienda luces bajas.",
    username: "ClimaVial",
    time: "1.5 h",
    type: "weather"
  }
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'blockade':
      return <Badge variant="outline" className="bg-red-100 text-red-800">Bloqueo</Badge>;
    case 'weather':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Clima</Badge>;
    case 'accident':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Accidente</Badge>;
    case 'roadwork':
      return <Badge variant="outline" className="bg-orange-100 text-orange-800">Obras</Badge>;
    default:
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Alerta</Badge>;
  }
};

export const TwitterFeed = () => {
  const [tweets, setTweets] = useState(mockTweets);
  
  // In a real app, we would fetch tweets from an API or use Twitter's SDK
  useEffect(() => {
    // Fetch tweets here
  }, []);
  
  return (
    <Card className="bg-white shadow-sm border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-base font-medium">
          <MessageSquare className="h-4 w-4 mr-2" />
          Alertas de Ruta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[180px] pr-4">
          <div className="space-y-3">
            {tweets.map((tweet) => (
              <div key={tweet.id} className="flex items-start gap-2 pb-2 border-b border-gray-100">
                <div className="rounded-full bg-gray-100 w-8 h-8 flex items-center justify-center text-gray-500 shrink-0 text-xs">
                  {tweet.username.substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">@{tweet.username}</p>
                    <span className="text-xs text-gray-500">Hace {tweet.time}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{tweet.content}</p>
                  <div className="mt-2">
                    {getTypeIcon(tweet.type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TwitterFeed;
