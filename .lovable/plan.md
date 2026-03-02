
# Fix: Dos problemas reportados por Planeacion (Daniela Castaneda)

## Problema 1: Posicionamiento Falso no aparece en Consultas

### Diagnostico

Cuando un servicio se marca como "Posicionamiento en Falso" (PF) desde el dashboard de planeacion, se establece `posicionamiento_falso = true` y `estado_planeacion = 'cancelado'` en `servicios_planificados`. Sin embargo, cuando se busca ese servicio en la pestaña de Consultas:

1. **El tipo `ServiceQueryResult`** no incluye los campos `posicionamiento_falso`, `cobro_posicionamiento`, ni `motivo_posicionamiento_falso`
2. **El mapeo de `servicios_planificados`** en `useServiceQuery.ts` no extrae estos campos de la BD
3. **`ServiceQueryCard`** no muestra el badge "Pos. Falso" (a diferencia de `CompactServiceCard` y `ScheduledServicesTabSimple` que si lo hacen)
4. **`ServiceDetailsModal`** no muestra ningun indicador de PF

Resultado: el servicio aparece como "Cancelado" generico sin indicar que fue un PF.

### Solucion

**Archivo `src/hooks/useServiceQuery.ts`**:
- Agregar `posicionamiento_falso`, `cobro_posicionamiento`, y `motivo_posicionamiento_falso` a la interfaz `ServiceQueryResult`
- Incluir estos campos en los dos mapeos de `planificadosResults` (en `searchByServiceId` y `searchByClientAndDate`)

**Archivo `src/pages/Planeacion/components/ServiceQueryCard.tsx`**:
- Agregar deteccion de `posicionamiento_falso` y mostrar badge violeta "Pos. Falso" (mismo estilo que `CompactServiceCard`)
- Ajustar el `getStatusConfig` para que PF tenga un color/label diferenciado de cancelado generico

**Archivo `src/pages/Planeacion/components/ServiceDetailsModal.tsx`**:
- Mostrar un banner/badge de "Posicionamiento en Falso" en el header cuando aplique
- Mostrar el `motivo_posicionamiento_falso` y si hubo `cobro_posicionamiento` en la pestaña General

## Problema 2: No se pueden levantar rechazos (error silencioso)

### Diagnostico

Daniela reporta un toast: "Error al levantar penalidad — No se pudo suspender el rechazo." El analisis revela:

- RLS: OK. `coordinador_operaciones` esta incluido en `puede_acceder_planeacion()` y el rol esta activo
- Schema: OK. No hay constraints ni triggers que bloqueen el UPDATE
- Datos: OK. Los 2 rechazos vigentes existen y son accesibles

**Causa raiz**: El componente `AlertDialogAction` de Radix auto-cierra el dialogo al hacer click. Esto dispara `onOpenChange(false)` que ejecuta `setConfirmTarget(null)` ANTES de que el `await suspenderRechazo.mutateAsync(...)` termine. Al cerrarse el dialogo, el componente `AlertDialogContent` se desmonta. Si React procesa el unmount durante la mutacion asincrona, el `mutateAsync` puede lanzar un error de "component unmounted" que dispara el `onError`.

Adicionalmente, en `ExcludedCustodiansAlert`, el mismo patron existe y tiene el mismo bug.

### Solucion

**Archivo `src/components/planeacion/RechazosVigentesPanel.tsx`**:
- Prevenir el auto-close del `AlertDialogAction` usando `e.preventDefault()` en el `onClick`
- Solo cerrar el dialogo (`setConfirmTarget(null)`) DESPUES de que la mutacion complete (en el `.then()` o despues del `await`)

**Archivo `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/ExcludedCustodiansAlert.tsx`**:
- Aplicar el mismo patron: `e.preventDefault()` en el `AlertDialogAction` onClick
- Solo cerrar tras completar la mutacion

**Archivo `src/hooks/useCustodioRechazos.ts`**:
- Agregar logging del error real en `onError` para facilitar diagnostico futuro: `console.error('Suspension error:', error)`

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useServiceQuery.ts` | Agregar campos PF a interfaz y mapeos |
| `src/pages/Planeacion/components/ServiceQueryCard.tsx` | Badge "Pos. Falso" + status diferenciado |
| `src/pages/Planeacion/components/ServiceDetailsModal.tsx` | Banner PF en header + motivo en General |
| `src/components/planeacion/RechazosVigentesPanel.tsx` | Fix async dialog close race condition |
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/ExcludedCustodiansAlert.tsx` | Fix async dialog close race condition |
| `src/hooks/useCustodioRechazos.ts` | Agregar error logging en onError |

Total: 6 archivos, correcciones quirurgicas.
