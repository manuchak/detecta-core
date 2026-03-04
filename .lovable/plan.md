

# Bitácora: Auto-poblar servicios "En Sitio" para monitoristas

## Problema actual
La tab Bitácora requiere que el monitorista escriba manualmente el ID del servicio. Esto es ineficiente y propenso a errores. El sistema ya sabe qué servicios tienen custodio en sitio (`hora_inicio_real IS NOT NULL` en `servicios_planificados`).

## Solución
Reemplazar el campo de texto manual por un selector automático que muestre solo los servicios activos del turno (los que tienen `hora_inicio_real` y no están completados/cancelados). El monitorista solo tiene que hacer click en el servicio que quiere monitorear.

## Cambios

### 1. Nuevo componente `BitacoraServiceSelector`
- Query a `servicios_planificados` filtrando: `hora_inicio_real IS NOT NULL`, `estado_planeacion NOT IN (cancelado, completado)`, ventana de turno (16h)
- Lista de tarjetas compactas mostrando: cliente, custodio, ruta (origen → destino), hora de inicio, tiempo transcurrido desde `hora_inicio_real`
- Click en tarjeta → selecciona el servicio y carga su bitácora
- Indicador visual del servicio seleccionado
- Badge con conteo de eventos registrados por servicio
- Refetch cada 30s para captar nuevos servicios que se posicionen

### 2. Modificar `MonitoringPage.tsx` — Tab Bitácora
- Reemplazar el `Input` de texto por `BitacoraServiceSelector`
- El selector va en el panel izquierdo (1/3), arriba del `EventTracker`
- Al seleccionar servicio, `EventTracker`, `EventTimeline` y `BitacoraMap` se cargan automáticamente
- Mantener el `id_servicio` como referencia (no el UUID) para que el `useEventosRuta` funcione igual

### 3. Layout actualizado
```text
┌─────────────┬──────────────────────┐
│ Selector    │  EventTimeline       │
│ (servicios  │  (cronología)        │
│  en sitio)  │                      │
│─────────────│──────────────────────│
│ EventTracker│  BitacoraMap         │
│ (counter)   │  (traza ruta)        │
└─────────────┴──────────────────────┘
```

## Archivos a crear
- `src/components/monitoring/bitacora/BitacoraServiceSelector.tsx`

## Archivos a modificar
- `src/components/monitoring/bitacora/index.ts` (agregar export)
- `src/pages/Monitoring/MonitoringPage.tsx` (reemplazar Input por selector, usar `id_servicio` del servicio seleccionado)

