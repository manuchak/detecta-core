
# Plan: Widgets de Clima y Alertas con Datos Reales

## Objetivo
Conectar los widgets de clima y alertas de ruta a fuentes de datos reales, eliminando los datos mock actuales.

---

## Situacion Actual

### Widget de Clima (`WeatherWidget.tsx`)
- Usa datos mock hardcodeados
- No hay API de clima configurada (no existe `WEATHER_API_KEY` en secrets)
- Las ciudades son relevantes: CDMX, Puebla, Queretaro

### Widget de Alertas (`TwitterFeed.tsx`)
- Usa tweets mock hardcodeados
- YA EXISTE infraestructura de incidentes RRSS:
  - Tabla `incidentes_rrss` (actualmente vacia pero funcional)
  - Edge function `apify-data-fetcher` para obtener tweets
  - Edge function `procesar-incidente-rrss` para clasificar con AI
  - Hook `useIncidentesRRSS` listo para consumir datos
- Tiene clasificacion AI: tipo_incidente, severidad, resumen

---

## Parte 1: Alertas de Ruta (Implementacion Rapida)

Ya existe toda la infraestructura. Solo hay que conectar los datos.

### Cambios en TwitterFeed.tsx

```typescript
// Antes: datos mock
const [tweets, setTweets] = useState(mockTweets);

// Despues: datos reales desde Supabase
import { useIncidentesRRSS } from '@/hooks/useIncidentesRRSS';

const { data: incidentes, isLoading } = useIncidentesRRSS({
  dias_atras: 1, // Ultimas 24 horas
});

// Mapear incidentes a formato del widget
const alertas = incidentes?.map(inc => ({
  id: inc.id,
  username: inc.autor || 'AlertaMX',
  content: inc.resumen_ai || inc.texto_original.substring(0, 200),
  time: formatRelativeTime(inc.fecha_publicacion),
  type: mapTipoToType(inc.tipo_incidente), // bloqueo, accidente, clima, etc.
  carretera: inc.carretera,
  severidad: inc.severidad
}));
```

### Mapeo de Tipos de Incidente
```typescript
function mapTipoToType(tipo: string): string {
  const mapping = {
    'bloqueo_carretera': 'blockade',
    'accidente_trailer': 'accident',
    'robo_carga': 'robbery',
    'robo_unidad': 'robbery',
    'asalto_transporte': 'assault',
    'otro': 'weather' // Clima u otros
  };
  return mapping[tipo] || 'alert';
}
```

### Agregar Badge de Severidad
```typescript
// Indicador visual segun severidad
{incidente.severidad === 'critica' && (
  <Badge variant="destructive">Critico</Badge>
)}
```

---

## Parte 2: Widget de Clima (Requiere API Externa)

### Opcion A: OpenWeatherMap (Recomendada)
- Gratis: 1000 llamadas/dia
- Cubre Mexico con precision
- API simple y documentada

### Opcion B: WeatherAPI.com
- Gratis: 1M llamadas/mes
- Alertas de clima incluidas
- Forecast 3 dias

### Implementacion Propuesta

#### 1. Crear Edge Function `weather-data`
```typescript
// supabase/functions/weather-data/index.ts
serve(async (req) => {
  const WEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
  
  const ciudades = [
    { name: 'Ciudad de México', lat: 19.4326, lon: -99.1332 },
    { name: 'Puebla', lat: 19.0414, lon: -98.2063 },
    { name: 'Querétaro', lat: 20.5888, lon: -100.3899 },
    { name: 'Guadalajara', lat: 20.6597, lon: -103.3496 }
  ];
  
  const weatherData = await Promise.all(
    ciudades.map(async (ciudad) => {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${ciudad.lat}&lon=${ciudad.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`
      );
      const data = await response.json();
      
      return {
        location: ciudad.name,
        temperature: Math.round(data.main.temp),
        condition: mapCondition(data.weather[0].main),
        precipitation: data.rain?.['1h'] ? 100 : 0,
        windSpeed: Math.round(data.wind.speed * 3.6), // m/s a km/h
        humidity: data.main.humidity,
        description: data.weather[0].description
      };
    })
  );
  
  return new Response(JSON.stringify(weatherData), { ... });
});
```

#### 2. Crear Hook `useWeatherData`
```typescript
// src/hooks/useWeatherData.ts
export const useWeatherData = () => {
  return useQuery({
    queryKey: ['weather-data'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('weather-data');
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // Cache 10 minutos
    refetchInterval: 30 * 60 * 1000 // Refetch cada 30 min
  });
};
```

#### 3. Actualizar WeatherWidget
```typescript
import { useWeatherData } from '@/hooks/useWeatherData';

export const WeatherWidget = () => {
  const { data: weather, isLoading, error } = useWeatherData();
  
  if (isLoading) return <Skeleton />;
  if (error) return <FallbackMockData />;
  
  return (
    <div className="flex gap-3 overflow-x-auto">
      {weather.map((item) => (
        <WeatherCard key={item.location} {...item} />
      ))}
    </div>
  );
};
```

---

## Arquitectura de Datos

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         MonitoringPage                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────┐    ┌────────────────────────────┐   │
│  │     WeatherWidget         │    │      TwitterFeed            │   │
│  │                           │    │      (Alertas de Ruta)      │   │
│  │  useWeatherData() ───────►│    │  useIncidentesRRSS() ─────►│   │
│  │         │                 │    │         │                   │   │
│  └─────────┼─────────────────┘    └─────────┼───────────────────┘   │
│            │                                │                       │
│            ▼                                ▼                       │
│   ┌──────────────────┐             ┌──────────────────────────┐    │
│   │  Edge Function   │             │    incidentes_rrss       │    │
│   │  weather-data    │             │    (Supabase table)       │    │
│   └────────┬─────────┘             └────────────────────────────┘    │
│            │                                     ▲                  │
│            ▼                                     │                  │
│   ┌──────────────────┐             ┌─────────────┴──────────────┐   │
│   │  OpenWeatherMap  │             │  apify-data-fetcher        │   │
│   │  API             │             │  procesar-incidente-rrss   │   │
│   └──────────────────┘             └────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/monitoring/TwitterFeed.tsx` | Modificar | Conectar a `useIncidentesRRSS` |
| `supabase/functions/weather-data/index.ts` | Crear | Edge function para clima |
| `src/hooks/useWeatherData.ts` | Crear | Hook para consumir datos de clima |
| `src/components/monitoring/WeatherWidget.tsx` | Modificar | Usar hook en vez de mock |

---

## Dependencias y Secretos

### Para Alertas de Ruta
- YA CONFIGURADO: Solo conectar componente a hook existente

### Para Clima
- REQUIERE: Configurar `OPENWEATHER_API_KEY` en secrets
  - Registro gratis en openweathermap.org
  - Plan gratuito: 1000 llamadas/dia (suficiente para cache de 30 min)

---

## Fallback y Manejo de Errores

1. **Sin datos de incidentes**: Mostrar mensaje "No hay alertas recientes"
2. **Error en API de clima**: Usar datos mock como fallback
3. **Loading states**: Skeleton loaders para ambos widgets
4. **Sin API key de clima**: Widget muestra datos mock con indicador

---

## Prioridad de Implementacion

**Fase 1 (Inmediata - Solo Frontend)**
- Conectar `TwitterFeed` a `useIncidentesRRSS`
- Agregar estado vacio y loading
- Tiempo estimado: 30 minutos

**Fase 2 (Requiere API Key)**
- Crear edge function `weather-data`
- Crear hook `useWeatherData`
- Actualizar `WeatherWidget`
- Tiempo estimado: 1 hora

---

## Beneficios

| Beneficio | Impacto |
|-----------|---------|
| **Datos reales de incidentes** | Alertas actuales del feed de Twitter/X |
| **Clasificacion AI** | Tipo, severidad y resumen automatico |
| **Clima actualizado** | Condiciones reales cada 30 minutos |
| **Sin costo adicional** | APIs gratuitas para el volumen esperado |
| **Fallback robusto** | Datos mock si falla la API |
