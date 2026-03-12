

# Fix: Badge "Arribado" muestra --:-- en vez de la hora real

## Problema

`hora_llegada_custodio` es tipo `time without time zone` en PostgreSQL (valor: `"04:30:00"`). Se pasa a `formatCDMXTime()` que espera un ISO timestamp completo (`2026-03-12T04:30:00-06:00`). `formatInTimeZone` falla silenciosamente y el `catch` retorna `"--:--"`.

## Solución

No se necesita conversión timezone — el valor ya está en hora CDMX (se guarda así en `useServiciosPlanificados.ts` línea 1008). Solo hay que extraer `HH:mm` del string `"HH:mm:ss"` directamente.

### Archivos a modificar

**`src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx`** (~línea 1032)
- Reemplazar `formatCDMXTime(service.hora_llegada_custodio, 'HH:mm')` por `service.hora_llegada_custodio.substring(0, 5)` (extrae "04:30" de "04:30:00")

**`src/components/planeacion/StatusUpdateButton.tsx`** (~línea 101)
- Reemplazar `formatCDMXTime(horaLlegadaCustodio, 'HH:mm')` por `horaLlegadaCustodio.substring(0, 5)`

Dos cambios puntuales, sin riesgo de regresión.

