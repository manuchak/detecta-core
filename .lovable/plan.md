
# Dashboard de Videowall para Centro de Monitoreo (TV 50")

## Objetivo

Crear una ruta dedicada `/monitoring/tv` con un dashboard optimizado para visualizacion en pantalla de 50 pulgadas, siguiendo mejores practicas de diseno para videowalls en centros de operaciones (NOC/SOC).

## Principios de Diseno para Videowall

1. **Sin scroll** - Todo visible en una sola pantalla (100vh)
2. **Tipografia grande** - Minimo 18px para texto, 48-72px para KPIs, legible a 3-5 metros
3. **Alto contraste** - Fondo oscuro (dark mode forzado) para reducir fatiga visual y brillo en sala
4. **Sin interaccion** - No botones, no hover states, no modals. Solo lectura pasiva
5. **Auto-refresh** - Datos se actualizan automaticamente cada 30 segundos
6. **Densidad informativa** - Maximo de datos utiles sin ruido visual
7. **Reloj prominente** - Hora actual visible en todo momento

## Layout (1920x1080 optimizado)

```text
+------------------------------------------------------------------+
|  CONTROL DE POSICIONAMIENTO    [Reloj HH:MM:SS]    [Auto 30s]   |
+------------------------------------------------------------------+
|  [EN SITIO: 12] [PROXIMO: 8] [ASIGNADO: 5] [SIN ASIGNAR: 3]    |
+------------------------------------------------------------------+
|                                    |                              |
|                                    |   Lista de servicios         |
|        MAPA (grande)               |   (scroll automatico)        |
|        ~65% del ancho              |   Texto grande               |
|                                    |   Status + cliente + hora    |
|                                    |                              |
+------------------------------------+------------------------------+
|   Clima (compacto, 1 fila)         |   Alertas de Ruta (ticker)   |
+------------------------------------+------------------------------+
```

## Archivos a crear

### 1. `src/pages/Monitoring/MonitoringTVPage.tsx`
- Pagina principal del modo TV
- Forzar tema oscuro via clase `dark` en el contenedor
- Layout CSS Grid fijo a `100vh` sin scroll
- Auto-refresh cada 30 segundos usando `refetchInterval` en los hooks existentes
- Reloj en tiempo real (useEffect con setInterval)
- Reutiliza los mismos hooks: `useServiciosTurno`, `useWeatherData`, `useIncidentesRRSS`

### 2. `src/components/monitoring/tv/TVSummaryBar.tsx`
- Barra horizontal con las 4 metricas de posicionamiento
- Numeros grandes (text-6xl), colores de status (verde/ambar/azul/gris)
- Fondo semitransparente por tarjeta
- Animacion de pulso en "Sin Asignar" si > 0

### 3. `src/components/monitoring/tv/TVServicesList.tsx`
- Lista vertical de servicios sin interaccion
- Auto-scroll lento (CSS animation o setInterval) cuando hay mas items de los visibles
- Cada fila: indicador de color + hora + cliente + custodio
- Texto minimo 16px, filas de ~48px de alto
- Sin search, sin filtros (modo pasivo)

### 4. `src/components/monitoring/tv/TVMapDisplay.tsx`
- Wrapper del mapa Mapbox con estilo oscuro (`mapbox://styles/mapbox/dark-v11`)
- Marcadores mas grandes (48px vs 36px actual)
- Sin popups de hover (no hay mouse en TV)
- Leyenda con texto mas grande
- Sin controles de navegacion (zoom/pan innecesarios)

### 5. `src/components/monitoring/tv/TVWeatherStrip.tsx`
- Version compacta del WeatherWidget en una sola fila horizontal
- Solo: ciudad + icono + temperatura
- Texto 14-16px

### 6. `src/components/monitoring/tv/TVAlertTicker.tsx`
- Ticker horizontal tipo "noticias" con las alertas de ruta
- Scroll horizontal continuo (marquee CSS)
- Badge de severidad + texto resumido

### Cambio en routing

### 7. `src/App.tsx`
- Agregar ruta `/monitoring/tv` que renderiza `MonitoringTVPage` **sin** el AppShell/Sidebar/TopNav (fullscreen)

## Detalles tecnicos

- **Dark mode forzado**: El contenedor raiz tendra `className="dark"` y usara `bg-gray-950 text-white` independiente del tema global
- **Sin sidebar**: La ruta se monta fuera del layout principal para ocupar 100% de pantalla
- **Auto-refresh**: Pasar `refetchInterval: 30000` al hook `useServiciosTurno`
- **Zoom compensation**: Usar `var(--vh-full)` para altura del contenedor, o `100vh` directamente si la TV no tiene zoom aplicado
- **Acceso**: Reutilizar el mismo `ProtectedRoute` con roles de monitoring
