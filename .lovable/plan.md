

# Revertir "En Destino" → "En Ruta" desde el Coordinador

## Problema
Si un monitorista marca por error que un custodio llegó a destino, no hay forma de revertirlo. El coordinador necesita poder devolver el servicio a estado "en ruta".

## Cambios

### 1. `src/hooks/useBitacoraBoard.ts` — Nueva mutación `revertirEnDestino`
- Verificar que el servicio está `en_destino === true` y NO tiene `hora_fin_real` (no liberado)
- Actualizar `servicios_planificados`: `en_destino = false`
- Eliminar el evento `llegada_destino` más reciente de `servicio_eventos_ruta` para ese `servicio_id`
- Insertar un evento de auditoría tipo `reversion_destino` con descripción indicando quién revirtió
- Invalidar queries
- Exponer en el return

### 2. `src/components/monitoring/bitacora/ServiceCardEnDestino.tsx` — Botón "Devolver a En Ruta"
- Agregar prop `onRevertir` opcional (solo visible cuando el coordinador lo provee)
- Botón secundario/outline con icono `RotateCcw` debajo del botón "Liberar Custodio"
- Abre `ConfirmTransitionDialog` con `requireDoubleConfirm` y mensaje claro de que es una corrección

### 3. `src/components/monitoring/bitacora/BoardColumnEnCurso.tsx`
- Pasar `onRevertir` al `ServiceCardEnDestino` conectándolo a la mutación del hook

### 4. `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx`
- Opcionalmente, agregar visibilidad de servicios "en destino" con acción de revertir desde el panel del coordinador

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useBitacoraBoard.ts` | Nueva mutación `revertirEnDestino` |
| `src/components/monitoring/bitacora/ServiceCardEnDestino.tsx` | Botón "Devolver a En Ruta" con confirmación |
| `src/components/monitoring/bitacora/BoardColumnEnCurso.tsx` | Conectar nueva prop `onRevertir` |

