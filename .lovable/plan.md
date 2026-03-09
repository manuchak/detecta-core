

# Revertir Entrega de Turno — Coordinador Ops

## Concepto

El coordinador puede ver las entregas de turno recientes y revertir una entrega errónea. Revertir significa: desactivar las asignaciones nuevas creadas por el handoff y restaurar las asignaciones originales de los monitoristas salientes.

## Cambios

### 1. Migración SQL

- Agregar columna `estado` a `bitacora_entregas_turno` (`activa`, `revertida`) con default `activa`
- Agregar columna `revertida_por` (uuid, nullable) y `revertida_at` (timestamptz, nullable)
- Agregar política UPDATE para `has_monitoring_write_role()` (solo coordinadores pueden revertir)

### 2. Nuevo hook: `src/hooks/useRevertHandoff.ts`

- **Query**: Obtiene las últimas entregas de turno del día con `estado = 'activa'`
- **Mutation `revertirEntrega(entregaId)`**:
  1. Lee el registro de `bitacora_entregas_turno` (tiene `servicios_transferidos` y `monitoristas_salientes` en JSONB)
  2. Para cada servicio transferido: desactiva la asignación actual del monitorista entrante (`activo = false`)
  3. Crea nueva asignación activa para el monitorista saliente original (restaura)
  4. Para servicios cerrados por inactividad: reabre si aplica (actualiza `estado_planeacion` y limpia `hora_fin_real`)
  5. Marca la entrega como `estado = 'revertida'`, `revertida_por`, `revertida_at`
  6. Invalida queries del board

### 3. Nuevo componente: `src/components/monitoring/coordinator/HandoffRevertSection.tsx`

- Card similar a `DestinoCorrectionSection`
- Lista entregas de turno del día con estado `activa`
- Cada fila muestra: hora, salientes → entrantes, cantidad de servicios, botón "Revertir"
- `ConfirmTransitionDialog` con `requireDoubleConfirm` y label destructivo
- Solo visible si hay entregas activas recientes

### 4. Integrar en `CoordinatorCommandCenter.tsx`

- Importar y renderizar `HandoffRevertSection` después de `DestinoCorrectionSection`
- Agregar conteo de entregas revertibles al `CoordinatorAlertBar` (nuevo prop `handoffCount`)

### 5. Actualizar `CoordinatorAlertBar.tsx`

- Nuevo prop `handoffCount` con badge e icono `ArrowRightLeft`

| Archivo | Cambio |
|---------|--------|
| Migración SQL | ALTER TABLE `bitacora_entregas_turno` + UPDATE policy |
| `src/hooks/useRevertHandoff.ts` | Nuevo: query entregas activas, mutation revertir |
| `src/components/monitoring/coordinator/HandoffRevertSection.tsx` | Nuevo: card con lista y botón revertir |
| `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` | Integrar sección |
| `src/components/monitoring/coordinator/CoordinatorAlertBar.tsx` | Nuevo badge handoff |

