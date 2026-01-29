import { MessageSquare, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useIncidentesRRSS, IncidenteRRSS } from '@/hooks/useIncidentesRRSS';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Mapeo de tipos de incidente a tipos visuales
const mapTipoToType = (tipo: string): string => {
  const mapping: Record<string, string> = {
    'bloqueo_carretera': 'blockade',
    'accidente_trailer': 'accident',
    'robo_carga': 'robbery',
    'robo_unidad': 'robbery',
    'asalto_transporte': 'assault',
    'clima_adverso': 'weather',
    'otro': 'alert'
  };
  return mapping[tipo] || 'alert';
};

// Función para formatear tiempo relativo
const formatRelativeTime = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: false, 
      locale: es 
    });
  } catch {
    return 'Reciente';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'blockade':
      return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Bloqueo</Badge>;
    case 'weather':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Clima</Badge>;
    case 'accident':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Accidente</Badge>;
    case 'roadwork':
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Obras</Badge>;
    case 'robbery':
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Robo</Badge>;
    case 'assault':
      return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Asalto</Badge>;
    default:
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">Alerta</Badge>;
  }
};

const getSeverityBadge = (severidad: string | null) => {
  if (!severidad) return null;
  
  switch (severidad) {
    case 'critica':
      return <Badge variant="destructive" className="text-xs">Crítico</Badge>;
    case 'alta':
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">Alta</Badge>;
    case 'media':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">Media</Badge>;
    default:
      return null;
  }
};

// Interfaz unificada para alertas
interface AlertaDisplay {
  id: string;
  username: string;
  content: string;
  time: string;
  type: string;
  carretera?: string | null;
  severidad?: string | null;
  url?: string;
}

// Datos mock como fallback
const mockTweets: AlertaDisplay[] = [
  {
    id: "mock-1",
    username: "TraficoMX",
    content: "⚠️ Manifestación bloquea Autopista México-Cuernavaca a la altura del km 24. Se recomienda tomar vías alternas.",
    time: "15 min",
    type: "blockade",
    carretera: "México-Cuernavaca"
  },
  {
    id: "mock-2",
    content: "⛈️ Alerta por lluvia intensa en tramo San Martín-Puebla. Precaución por posibles deslaves en la carretera.",
    username: "ProteccionCivilMX",
    time: "25 min",
    type: "weather",
    carretera: "San Martín-Puebla"
  },
  {
    id: "mock-3",
    content: "🚨 Accidente en la México-Querétaro a la altura del km 32. Tráfico detenido en dirección norte.",
    username: "TraficoMX",
    time: "40 min",
    type: "accident",
    carretera: "México-Querétaro"
  }
];

export const TwitterFeed = () => {
  const { data: incidentes, isLoading, error } = useIncidentesRRSS({
    dias_atras: 1, // Últimas 24 horas
  });
  
  // Mapear incidentes a formato del widget
  const alertas: AlertaDisplay[] = incidentes?.map((inc: IncidenteRRSS) => ({
    id: inc.id,
    username: inc.autor || inc.red_social || 'AlertaMX',
    content: inc.resumen_ai || inc.texto_original.substring(0, 200),
    time: formatRelativeTime(inc.fecha_publicacion),
    type: mapTipoToType(inc.tipo_incidente),
    carretera: inc.carretera,
    severidad: inc.severidad,
    url: inc.url_publicacion
  })) || [];

  // Usar datos mock si no hay datos reales o hay error
  const displayData: AlertaDisplay[] = alertas.length > 0 ? alertas : (error ? mockTweets : []);
  const showingMock = alertas.length === 0 && !isLoading;
  
  return (
    <Card className="bg-card shadow-sm border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-medium">
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Alertas de Ruta
          </div>
          {showingMock && displayData.length > 0 && (
            <Badge variant="outline" className="text-xs">Demo</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2 pb-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : displayData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No hay alertas recientes</p>
            <p className="text-xs">Las alertas aparecerán aquí cuando se detecten</p>
          </div>
        ) : (
          <ScrollArea className="h-[180px] pr-4">
            <div className="space-y-3">
              {displayData.map((alerta) => (
                <div key={alerta.id} className="flex items-start gap-2 pb-2 border-b border-border last:border-0">
                  <div className="rounded-full bg-muted w-8 h-8 flex items-center justify-center text-muted-foreground shrink-0 text-xs font-medium">
                    {alerta.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">@{alerta.username}</p>
                      <span className="text-xs text-muted-foreground shrink-0">Hace {alerta.time}</span>
                    </div>
                    <p className="text-sm text-foreground/80 mt-1 line-clamp-3">{alerta.content}</p>
                    {alerta.carretera && (
                      <p className="text-xs text-muted-foreground mt-1">📍 {alerta.carretera}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {getTypeIcon(alerta.type)}
                      {alerta.severidad && getSeverityBadge(alerta.severidad as string)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default TwitterFeed;
