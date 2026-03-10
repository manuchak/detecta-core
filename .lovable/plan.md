

# Correcciones del módulo de Planeación — 4 observaciones

## Problema 1: "No podemos colocar en sitio a los servicios"

**Diagnóstico**: El botón `StatusUpdateButton` existe y funciona técnicamente. El problema es que solo se muestra cuando el estado operativo es `programado`, `armado_pendiente` o `pendiente_inicio`. Sin embargo, hay un estado adicional `en_curso` que se activa cuando monitoreo establece `hora_inicio_real` — en ese punto el botón desaparece incluso si planeación nunca marcó "en sitio". Además, el botón solo aparece dentro de las acciones de la tarjeta que son visibles al hacer hover, lo cual puede pasar desapercibido.

**Solución**: 
- Incluir `en_curso` en la lista de estados que permiten marcar "En sitio" (el custodio puede haber llegado a sitio aunque monitoreo ya haya iniciado seguimiento)
- Hacer el botón siempre visible (no solo en hover) para estados pendientes de arribar

**Archivo**: `src/components/planeacion/StatusUpdateButton.tsx`, `src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx`

---

## Problema 2: "La asignación no sale actualizada al día — último servicio, locales/foráneos"

**Diagnóstico**: En el flujo de asignación de custodio (CustodianStep), la lista de candidatos no muestra de manera prominente: fecha del último servicio, conteo de servicios locales vs foráneos en los últimos 15 días. Estos datos existen parcialmente en los indicadores de equidad pero no como un resumen claro "Conteo/Historial".

**Solución**: Agregar un mini-panel informativo "Historial 15d" en cada tarjeta de custodio candidato que muestre:
- Fecha del último servicio asignado
- Conteo Local / Foráneo en los últimos 15 días
- Esto se obtiene de `servicios_planificados` agrupando por `tipo_servicio` o campo local/foráneo

**Archivos**: 
- Nuevo hook o extensión de `useCustodiosConProximidad` para traer stats de 15 días
- `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianCard.tsx` (o equivalente) para mostrar los datos

---

## Problema 3: "Consultas — fechas incorrectas, modal en blanco, falta referencia"

**Diagnóstico**: Tres sub-problemas:

1. **Modal en blanco**: `TimelineItem` usa `format(new Date(timestamp))` con valores que pueden ser time-only strings (`HH:mm:ss`) sin fecha, causando un crash silencioso. Además, el color `'indigo'` usado en la Cita Programada no existe en el mapa `colorClasses`, resultando en `className undefined`.

2. **Fechas incorrectas**: Las tarjetas `ServiceQueryCard` usan `formatCDMXTime` correctamente, pero el campo `fecha_hora_cita` de `servicios_custodia` puede tener discrepancias con la fecha real del servicio cuando el servicio cruza medianoche UTC.

3. **Falta referencia del cliente**: El campo `id_interno_cliente` no está mapeado en `ServiceQueryResult` ni se muestra en la tarjeta de consultas ni en el modal de detalles.

**Solución**:
- Agregar `'indigo'` al mapa de colores en `TimelineItem`
- Envolver `TimelineItem` en try/catch o validar que el timestamp sea parseable
- Agregar `id_interno_cliente` al interface `ServiceQueryResult` y a los 3 mappers (searchById custodia, searchById planificados, searchByClient)
- Mostrar `id_interno_cliente` como "Ref. Cliente" en `ServiceQueryCard` y en la pestaña General del `ServiceDetailsModal`

**Archivos**: `src/hooks/useServiceQuery.ts`, `src/pages/Planeacion/components/ServiceQueryCard.tsx`, `src/pages/Planeacion/components/ServiceDetailsModal.tsx`

---

## Problema 4: "Ya no salen los rechazos — solo por trimestre"

**Diagnóstico**: El panel `RechazosVigentesPanel` solo es accesible desde dentro del wizard de creación de servicio (CustodianStep). Fuera de ese contexto, no hay forma de consultar los rechazos activos ni su historial. La consulta `useRechazosVigentes` solo trae rechazos con `vigencia_hasta > now()`, así que rechazos expirados no se ven.

**Solución**: Agregar un acceso directo a rechazos desde la vista principal de Planeación (ScheduledServicesTab):
- Botón "Rechazos" en la barra de herramientas superior con badge del conteo de vigentes
- Al hacer click, abre el `RechazosVigentesPanel` existente
- Agregar una pestaña/toggle "Historial" dentro del panel que muestre rechazos expirados de los últimos 30 días (con `vigencia_hasta <= now()`) para trazabilidad

**Archivos**: `src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx`, `src/components/planeacion/RechazosVigentesPanel.tsx`, `src/hooks/useCustodioRechazos.ts`

---

## Resumen de archivos afectados

| Archivo | Cambio |
|---------|--------|
| `StatusUpdateButton.tsx` | Incluir `en_curso` como estado válido para "En sitio" |
| `ScheduledServicesTabSimple.tsx` | Botón visible sin hover + acceso a Rechazos |
| `useServiceQuery.ts` | Mapear `id_interno_cliente` en los 3 flujos de búsqueda |
| `ServiceQueryCard.tsx` | Mostrar referencia del cliente |
| `ServiceDetailsModal.tsx` | Fix crash de colores/timestamps + mostrar referencia |
| `RechazosVigentesPanel.tsx` | Agregar pestaña de historial de rechazos |
| `useCustodioRechazos.ts` | Nuevo hook `useRechazosHistorial` para rechazos expirados |
| CustodianStep/cards | Mini-stats de 15 días (último servicio, local/foráneo) |

