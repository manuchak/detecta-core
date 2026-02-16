

# Plan de Mejoras al Modulo de Incidentes Operativos

El usuario identifico 4 problemas/oportunidades concretas. Se aborda cada uno como un bloque independiente.

---

## Bloque 1: Auto-llenado desde ID de Servicio

**Problema**: El formulario pide datos manualmente (cliente, custodio, zona) que ya existen en `servicios_planificados`.

**Solucion**: Agregar un campo "ID Servicio" al inicio del formulario. Al ingresarlo (ej. `YOCOYTM-273`), buscar en `servicios_planificados` por `id_servicio` y auto-llenar:

| Campo incidente | Fuente en servicios_planificados |
|---|---|
| cliente_nombre | nombre_cliente |
| custodio (nuevo campo visual) | custodio_asignado |
| custodio_id | custodio_id |
| servicio_planificado_id | id (UUID) |
| zona (origen) | origen |
| tipo_servicio (visual) | tipo_servicio |
| vehiculo (visual) | auto, placa |
| tarifa (visual) | tarifa_acordada |
| armado (visual) | armado_asignado |

Se creara un campo `id_servicio_texto` en la tabla `incidentes_operativos` (TEXT) para guardar el ID comercial legible, y se mostrara un panel resumen con los datos cargados.

**Archivos**:
- `supabase/migrations/xxx.sql` -- ALTER TABLE agregar `id_servicio_texto`
- `src/hooks/useIncidentesOperativos.ts` -- nuevo hook `useServicioLookup(idServicio)` para buscar y devolver datos
- `src/components/monitoring/incidents/IncidentReportForm.tsx` -- agregar campo ID servicio con busqueda + panel resumen de datos cargados
- `src/components/monitoring/incidents/ServiceDataSummary.tsx` -- nuevo componente que muestra los datos del servicio vinculado (cliente, custodio, vehiculo, tarifa)

---

## Bloque 2: Zona como ubicacion georreferenciada con Mapbox

**Problema**: El campo "Zona" es texto libre sin referencia util. La tabla ya tiene `ubicacion_lat` y `ubicacion_lng` pero no se usan.

**Solucion**: Reemplazar el input de texto "Zona" por un componente de direccion con autocompletado via Mapbox (`geocodeAddress` de `src/lib/mapbox.ts`). Al seleccionar una sugerencia, se guardan latitud/longitud en `ubicacion_lat`/`ubicacion_lng` y la direccion legible en `zona`. Opcionalmente mostrar un mini-mapa con el pin de la ubicacion.

**Archivos**:
- `src/components/monitoring/incidents/LocationPicker.tsx` -- nuevo componente con input autocomplete + mini-mapa Mapbox
- `src/components/monitoring/incidents/IncidentReportForm.tsx` -- reemplazar input "Zona" por LocationPicker, pasar lat/lng al formulario
- `src/hooks/useIncidentesOperativos.ts` -- agregar `ubicacion_lat` y `ubicacion_lng` al IncidenteFormData

---

## Bloque 3: Cronologia - clarificar workflow y permitir entradas antes de guardar

**Problema**: La cronologia actual requiere guardar el incidente en BD antes de poder agregar entradas. Esto es confuso porque el usuario espera documentar el evento desde el inicio.

**Solucion**: Permitir agregar entradas de cronologia en memoria (estado local) antes de que el incidente se guarde en BD. Al hacer "Guardar borrador" o "Registrar", primero se crea/actualiza el incidente y luego se insertan todas las entradas pendientes en `incidente_cronologia`. Esto elimina la friccion del workflow actual.

Flujo mejorado:
1. Usuario abre formulario nuevo
2. Agrega entradas a la cronologia (se mantienen en estado local)
3. Al guardar borrador o registrar, se persisten incidente + cronologia juntos

**Archivos**:
- `src/components/monitoring/incidents/IncidentTimeline.tsx` -- aceptar entradas locales (sin ID de BD) ademas de las de BD
- `src/components/monitoring/incidents/IncidentReportForm.tsx` -- mantener `localEntries[]` en estado, al guardar insertar batch

---

## Bloque 4: Persistencia robusta - corregir perdida de datos al cambiar pantalla

**Problema**: El usuario reporta que al cambiar de pantalla por mas de 1 segundo pierde todo lo hecho en el formulario.

**Diagnostico**: El hook `useFormPersistence` esta configurado con `enabled: !isEditing`, lo cual significa que solo persiste para incidentes NUEVOS. Ademas, la persistencia depende del `form.watch()` con debounce, pero el componente se desmonta antes de que el save se ejecute.

**Solucion**:
1. Habilitar persistencia tambien para edicion (`enabled: true` siempre)
2. Agregar `beforeunload` y `visibilitychange` listeners para forzar guardado inmediato al salir
3. Incluir las entradas de cronologia locales en los datos persistidos
4. Reducir el debounce de 800ms a 300ms para este formulario
5. Agregar `onBlur` save en campos criticos

**Archivos**:
- `src/components/monitoring/incidents/IncidentReportForm.tsx` -- enabled: true, debounceMs: 300, incluir cronologia local en datos persistidos, listener beforeunload
- `src/hooks/useIncidentesOperativos.ts` -- actualizar IncidenteFormData para incluir cronologia local

---

## Bloque 5: PDF - incluir datos del servicio vinculado

**Archivo**: `src/components/monitoring/incidents/IncidentPDFExporter.ts`
- Agregar seccion "Servicio Vinculado" con ID, cliente, custodio, vehiculo, tarifa
- Agregar coordenadas/direccion de ubicacion

---

## Resumen de archivos

| Archivo | Accion | Bloque |
|---|---|---|
| `supabase/migrations/xxx.sql` | ALTER TABLE agregar id_servicio_texto | 1 |
| `src/components/monitoring/incidents/ServiceDataSummary.tsx` | Nuevo - panel resumen servicio | 1 |
| `src/components/monitoring/incidents/LocationPicker.tsx` | Nuevo - autocomplete + mini mapa | 2 |
| `src/components/monitoring/incidents/IncidentReportForm.tsx` | Modificar - integrar bloques 1-4 | 1,2,3,4 |
| `src/components/monitoring/incidents/IncidentTimeline.tsx` | Modificar - entradas locales | 3 |
| `src/hooks/useIncidentesOperativos.ts` | Modificar - lookup, form data ampliada | 1,2,4 |
| `src/components/monitoring/incidents/IncidentPDFExporter.ts` | Modificar - seccion servicio | 5 |
| `src/components/monitoring/incidents/index.ts` | Actualizar exports | 1,2 |

