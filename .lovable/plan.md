

# Service Radar Videowall — Nuevo módulo independiente

## Enfoque

Crear una ruta `/monitoring/radar` con su propia página y componentes dedicados, copiando la estructura visual del videowall actual (`/monitoring/tv`) pero alimentándose de datos operativos en tiempo real. El videowall original queda intacto en `/monitoring/tv`.

## Arquitectura

```text
/monitoring/tv     → MonitoringTVPage (sin cambios, planeación)
/monitoring/radar  → ServiceRadarPage (nuevo, operativo en vivo)
```

## Archivos a crear

| Archivo | Descripción |
|---|---|
| `src/hooks/useServiciosTurnoLive.ts` | Hook read-only: combina servicios activos + pendientes + eventos ruta + safe points. Reutiliza `computePhaseAndTimers` del board. Calcula `lastGPS` (lat/lng del último checkpoint con coords, fallback geocodificación), `phase`, `alertLevel`, `activeEvent`, `minutesSinceLastAction`. Query de completados hoy (count). Safe points tipo 'alerta' + certificación oro/plata cacheados 5min. Refetch 15s + realtime. |
| `src/pages/Monitoring/ServiceRadarPage.tsx` | Página fullscreen dark, misma estructura que `MonitoringTVPage` (zoom override, reloj, header, KPIs, mapa+lista, weather+ticker). Título "RADAR OPERATIVO". Consume `useServiciosTurnoLive`. |
| `src/components/monitoring/radar/RadarSummaryBar.tsx` | 5 KPIs operativos: En Ruta (verde), En Evento (morado), Alerta (rojo pulsante), Por Iniciar (azul), Completados (gris). Grid 5 cols, misma estética visual que `TVSummaryBar`. |
| `src/components/monitoring/radar/RadarMapDisplay.tsx` | Mapa Mapbox dark-v11, no-interactivo. Marcadores por `lastGPS` con color por alertLevel (verde/amarillo/rojo pulsante/morado/gris). Capa de safe points: triángulos rojos (tipo alerta) y círculos verdes (oro/plata) a opacidad 0.3-0.4, solo visibles zoom ≥ 7. Leyenda actualizada. |
| `src/components/monitoring/radar/RadarServicesList.tsx` | Lista agrupada por urgencia (Alerta → En Evento → En Ruta → Por Iniciar). Cada tarjeta: barra lateral por alertLevel, folio, cliente, ruta, custodio, timer monoespaciado de inactividad, badge de evento activo (⛽/☕/🛏️). Auto-scroll lento como el actual. |

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | Agregar lazy import de `ServiceRadarPage` y ruta `/monitoring/radar` (fullscreen, sin layout, como `/monitoring/tv`). |

## Datos del hook `useServiciosTurnoLive`

Queries (todas read-only, sin mutations):
- **Q1**: `servicios_planificados` activos (hora_inicio_real NOT NULL, hora_fin_real NULL, últimas 24h)
- **Q2**: `servicios_planificados` pendientes en ventana ±2h
- **Q3**: `servicio_eventos_ruta` para todos los IDs activos (checkpoints con lat/lng)
- **Q4**: Count de completados hoy
- **Q5**: `safe_points` activos, tipo 'alerta' o certificación oro/plata (cacheada 5min)

Tipos de salida:
```typescript
interface RadarService {
  // Datos base
  id: string; id_servicio: string; nombre_cliente: string;
  custodio_asignado: string | null; origen: string; destino: string;
  fecha_hora_cita: string; tipo_servicio: string | null;
  // Operativos (computados)
  phase: ServicePhase; alertLevel: AlertLevel;
  minutesSinceLastAction: number;
  activeEvent: { tipo: string; minutosActivo: number } | null;
  // GPS
  lat: number | null; lng: number | null;
  positionSource: 'gps' | 'geocoded';
}

interface RadarResumen {
  enRuta: number; enEvento: number; alerta: number;
  porIniciar: number; completados: number;
}
```

## Capa de seguridad en mapa (sin recargar)

- Safe points tipo `alerta` → triángulo rojo 10px, opacidad 0.4
- Safe points certificación `oro`/`plata` → círculo verde 8px, opacidad 0.3
- Solo visibles a zoom ≥ 7 (listener en `map.on('zoom')`)
- Sin popups, sin labels, sin interactividad
- No afectan fitBounds (solo los marcadores de unidades)

## Componentes reutilizados sin cambio

- `TVWeatherStrip` y `TVAlertTicker` se importan directamente desde `monitoring/tv/` en `ServiceRadarPage` — son componentes puros sin dependencia del hook de planeación.

