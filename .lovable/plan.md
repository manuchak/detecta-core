
## Soporte para Multiples Armados por Servicio

### Estado de Implementación

#### FASE 1 — Modelo de Datos + Flujo de Creación ✅ COMPLETADA
- Columna `cantidad_armados_requeridos` en `servicios_planificados`
- Índice en `asignacion_armados(servicio_custodia_id, estado_asignacion)`
- `ServiceFormData` con array `armados: ArmadoSeleccionado[]`
- `ArmedStep` con multi-selección y puntos de encuentro individuales
- `ConfirmationStep` con inserción bulk en `asignacion_armados`
- Selector de cantidad en `ServiceTypeSection` (1-4 armados)

#### FASE 2 — Lectura Unificada (Hook + Lógica Crítica) ✅ COMPLETADA
- `useArmadosDelServicio` hook centralizado + `countArmadosAsignados` utility
- `usePendingArmadoServices` actualizado: compara asignados vs requeridos
- `useServiciosPlanificados.assignCustodian`: valida armados contra tabla relacional
- `useServiciosPlanificados.reassignArmedGuard`: siempre inserta en `asignacion_armados` (no solo proveedores)
- `useStarMapKPIs`: incluye `cantidad_armados_requeridos` en query

#### FASE 2 — Lectura Unificada (Dashboards, Monitoreo, Reportes) ⏳ PENDIENTE

Archivos pendientes de migrar:

| Módulo | Archivos clave | Cambio |
|--------|---------------|--------|
| Dashboard Planeación | `ScheduledServicesTab.tsx`, `ServiceQueryCard.tsx` | Badge "2 armados" |
| Edición | `EditServiceForm.tsx`, `SmartEditModal.tsx`, `PendingAssignmentModal.tsx` | Agregar/remover armados |
| Monitoreo | `CompactServiceCard.tsx`, `AdditionalArmedGuard.tsx`, `ServiceDetailsModal.tsx` | Iterar lista |
| Reportes/PDFs | `usePlanningResourcesMetrics.ts` | Contar correctamente |
| Conflictos | `armadosConflictDetection.ts` | Verificar todos los armados |

#### FASE 3 — Deprecación de campos escalares ⏳ FUTURA
