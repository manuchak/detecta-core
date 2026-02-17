
## Soporte para Multiples Armados por Servicio

### Estado de Implementación

#### FASE 1 — Modelo de Datos + Flujo de Creación ✅ COMPLETADA
- Columna `cantidad_armados_requeridos` en `servicios_planificados`
- Índice en `asignacion_armados(servicio_custodia_id, estado_asignacion)`
- `ServiceFormData` con array `armados: ArmadoSeleccionado[]`
- `ArmedStep` con multi-selección y puntos de encuentro individuales
- `ConfirmationStep` con inserción bulk en `asignacion_armados`
- Selector de cantidad en `ServiceTypeSection` (1-4 armados)

#### FASE 2 — Lectura Unificada ✅ COMPLETADA

**Hook + Lógica Crítica:**
- `useArmadosDelServicio` hook centralizado + `countArmadosAsignados` utility
- `usePendingArmadoServices` actualizado: compara asignados vs requeridos
- `useServiciosPlanificados.assignCustodian`: valida armados contra tabla relacional
- `useServiciosPlanificados.reassignArmedGuard`: siempre inserta en `asignacion_armados`
- `useStarMapKPIs`: incluye `cantidad_armados_requeridos` en query

**Interfaces + Tipos:**
- `ScheduledService`: campo `cantidad_armados_requeridos` agregado
- `EditableService`: campo `cantidad_armados_requeridos` agregado

**Dashboard Planeación:**
- `AssignmentStatusBadges`: muestra "N armados" cuando cantidad > 1
- `SmartEditModal`: campo `cantidadRequeridos` para mostrar en resumen
- `CompactServiceCard`: ya usa armado_nombre (sin cambio necesario por ahora)

**Monitoreo:**
- `ServiceDetailModal`: nuevo sub-componente `ArmadosSection` que consulta `useArmadosDelServicio` y muestra lista de armados con tipo (Interno/Proveedor)
- `AdditionalArmedGuard`: acepta `servicioId` prop para consultar multi-armados desde tabla relacional con fallback a campo escalar

**Pendiente menor (no bloqueante):**
- `ServiceDataSummary.tsx` (incidentes): muestra campo escalar — funcional pero no multi-armado
- `PDFLinkedService.tsx`: muestra campo escalar — funcional pero no multi-armado
- `armadosConflictDetection.ts`: ya usa `asignacion_armados` — sin cambio necesario


#### FASE 3 — Deprecación de campos escalares (lectura) ✅ COMPLETADA

**Lecturas migradas a `asignacion_armados`:**
- `useServicioLookup`: enriquece `ServicioVinculado` con array `armados[]` desde tabla relacional
- `ServiceDataSummary`: muestra nombres de armados desde relacional con fallback escalar
- `PDFLinkedService`: ídem para PDFs de incidentes
- `useServiceTransformations`: comentado como legacy, pendiente de remover en deprecación de escritura

**Pendiente (deprecación escritura — futura):**
- Dejar de escribir `armado_asignado` / `armado_id` en `servicios_planificados`
- Migración SQL para limpiar campos escalares
