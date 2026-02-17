

## Mejoras al Formulario de Incidentes Operativos

Se abordan los 3 problemas reportados:

### 1. Mapa no visible en el formulario

**Problema:** El `LocationPicker` solo muestra el mapa cuando ya hay coordenadas (`lat` y `lng`). Si no se ha seleccionado una ubicacion mediante busqueda de texto, el mapa nunca aparece. El usuario espera ver un mapa desde el inicio para poder hacer clic y seleccionar ubicacion.

**Solucion:** Modificar `LocationPicker.tsx` para que siempre muestre un mapa inline (centrado en Mexico City por defecto) incluso cuando no hay coordenadas seleccionadas. Cuando el usuario haga clic en el mapa, se colocara un marcador y se hara geocodificacion inversa para obtener la direccion.

**Archivo:** `src/components/monitoring/incidents/LocationPicker.tsx`
- Cambiar la condicion `{lat && lng && (` (linea 299) para mostrar el mapa siempre
- Inicializar el mapa con coordenadas por defecto (CDMX: -99.1332, 19.4326) cuando no hay lat/lng
- Agregar el marcador al hacer clic en el mapa (cuando no hay marcador previo)
- Mantener toda la funcionalidad existente de busqueda, drag, doble-clic para expandir

### 2. UX de firma: Aclarar cuando firmar

**Problema:** El pad de firma aparece al final del formulario sin contexto claro. El usuario no sabe que la firma es requerida solo al hacer clic en "Registrar" (no al guardar borrador).

**Solucion:** Mejorar la UX de la seccion de firma en `IncidentReportForm.tsx`:
- Agregar un titulo de seccion claro: "Firma de Creacion" con un icono
- Agregar texto explicativo prominente: "La firma es requerida para cambiar el estado de borrador a abierto. Puedes guardar borrador sin firmar."
- Resaltar visualmente que "Guardar borrador" no requiere firma vs "Registrar" si la requiere
- Agregar un indicador visual junto al boton "Registrar" si falta la firma

**Archivo:** `src/components/monitoring/incidents/IncidentReportForm.tsx`
- Lineas 739-746: Agregar CardHeader con titulo y descripcion clara a la tarjeta de firma
- Linea 564: Agregar indicador visual al boton "Registrar" cuando falta firma

### 3. Eliminar incidentes (rol owner/admin)

**Problema:** No existe funcionalidad de eliminar incidentes. Como owner, se necesita poder eliminar incidentes de prueba.

**Solucion:** Agregar hook `useDeleteIncidente` y boton de eliminar en la lista y en el formulario, restringido a roles `admin` y `owner`.

**Archivo:** `src/hooks/useIncidentesOperativos.ts`
- Agregar `useDeleteIncidente()` que elimina de `incidentes_operativos` y sus entradas de cronologia asociadas

**Archivo:** `src/components/monitoring/incidents/IncidentListPanel.tsx`
- Agregar boton de eliminar (icono Trash2) en cada tarjeta de incidente, visible solo para admin/owner
- Agregar AlertDialog de confirmacion con texto claro ("Esta accion es irreversible")
- No requiere firma, solo confirmacion

**Archivo:** `src/components/monitoring/incidents/IncidentReportForm.tsx`
- Agregar boton "Eliminar" en el header del formulario cuando se esta editando, visible solo para admin/owner
- AlertDialog de confirmacion antes de eliminar

### Resumen de archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/monitoring/incidents/LocationPicker.tsx` | Mostrar mapa siempre, no solo cuando hay coords |
| `src/components/monitoring/incidents/IncidentReportForm.tsx` | UX de firma mejorada + boton eliminar |
| `src/hooks/useIncidentesOperativos.ts` | Agregar `useDeleteIncidente` hook |
| `src/components/monitoring/incidents/IncidentListPanel.tsx` | Boton eliminar en lista (admin/owner) |

