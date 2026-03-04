

# Tablero de Bitácora en Ruta — Fase 1 (Plan Actualizado)

## Contexto
Los custodios reportan eventos en ruta vía WhatsApp. El monitorista los registra en el sistema. Al final del turno se genera una bitácora automática con cronología, fotos y traza de ruta.

## 1. Migración SQL — Tabla `servicio_eventos_ruta`

- ENUM `tipo_evento_ruta`: `inicio_servicio`, `fin_servicio`, `combustible`, `baño`, `descanso`, `pernocta`, `checkpoint`, `incidencia`, `foto_evidencia`, `otro`
- Tabla con: `servicio_id`, `tipo_evento`, `descripcion`, `hora_inicio`, `hora_fin`, `duracion_segundos`, `lat`, `lng`, `ubicacion_texto`, `foto_urls text[]`, `registrado_por`
- RLS con `has_monitoring_role()` existente

## 2. Componentes UI — Tab "Bitácora" en Centro de Monitoreo

- **EventTracker**: Botón counter tap-to-start/stop con selector de tipo por iconos (⛽🚻😴🛏️📍⚠️📸). Campo descripción + pegar URL de foto
- **EventTimeline**: Cronología vertical con iconos, duración, fotos inline
- **BitacoraMap**: Mini-mapa con traza de ruta y markers por evento
- **BitacoraGenerator**: PDF con `@react-pdf/renderer` — cronología, fotos, mapa

## 3. Trazado de ruta — Reutilizar motor de Rutas Seguras (Seguridad)

La traza de ruta en `BitacoraMap` debe usar las mismas mejoras ya implementadas en el módulo de Seguridad (Truck Route Builder):

- **Road-snapping via Mapbox Directions API** con perfil `driving` y parámetros de carga pesada (`alley_bias=-1`, `max_width`, `max_weight`)
- **Chunking automático** para rutas con >25 puntos (split en segmentos con overlap y merge de LineStrings)
- **Geometrías pre-calculadas** de `segment_geometries` cuando los puntos coincidan con corredores conocidos, para evitar llamadas API en tiempo real
- **Reutilizar** `useRouteCalculation` y la edge function `calculate-truck-route` existentes para generar la polyline entre los puntos GPS registrados en los eventos
- Resultado: la traza de la bitácora sigue carreteras reales validadas para carga pesada, no líneas rectas punto-a-punto

## 4. Hook `useEventosRuta`
- `startEvent(servicioId, tipo, coords?, descripcion?)` → INSERT
- `stopEvent(eventoId)` → UPDATE hora_fin + calcular duración
- `generateTraza(servicioId)` → llama `calculate-truck-route` con los puntos ordenados cronológicamente
- Query de eventos por servicio con realtime subscription

## 5. Integración
- Nueva tab "Bitácora" en `MonitoringPage.tsx`
- Layout: izquierda EventTracker + selector servicio, derecha EventTimeline + BitacoraMap

## Archivos a crear
| Archivo | Propósito |
|---|---|
| `supabase/migrations/xxx_create_servicio_eventos_ruta.sql` | Schema + RLS |
| `src/hooks/useEventosRuta.ts` | CRUD + realtime + generación de traza |
| `src/components/monitoring/bitacora/EventTracker.tsx` | Botón counter |
| `src/components/monitoring/bitacora/EventTimeline.tsx` | Cronología |
| `src/components/monitoring/bitacora/BitacoraMap.tsx` | Mapa con traza road-snapped |
| `src/components/monitoring/bitacora/BitacoraGenerator.tsx` | PDF |
| `src/components/monitoring/bitacora/index.ts` | Barrel exports |

## Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/pages/Monitoring/MonitoringPage.tsx` | Agregar tab "Bitácora" |

