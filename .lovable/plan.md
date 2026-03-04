

# Diagnóstico: Economics vacío y SIERCP no visible en Perfil Forense

## Hallazgos confirmados con datos

### 1. Economics — "No hay datos económicos disponibles"
**Dato duro**: Alan Hernandez Solano tiene **99 servicios Finalizados** y **$85,394 en costo_custodio** en `servicios_custodia`. La query del hook debería retornar datos.

**Causa raíz**: El hook `useProfileEconomics` consulta `servicios_custodia` directamente, pero las políticas RLS de esa tabla solo permiten SELECT a roles específicos (admin, owner, supply_admin, coordinador_operaciones, monitoring, bi, planificador, etc.). Si el usuario que visualiza el perfil no tiene uno de esos roles, la query retorna **0 filas sin error** — y el UI muestra "No hay datos".

**Problema secundario**: El hook solo acepta `nombre` como parámetro. No usa el `id` del custodio ni consulta `servicios_planificados` (fuente dual).

### 2. Evaluaciones — "Este perfil no tiene un candidato asociado"
**Dato duro**: `custodios_operativos.pc_custodio_id = NULL` para Alan. No existe ningún registro en `candidatos_custodios` con su nombre. Sin `candidatoId`, el tab ni siquiera intenta buscar evaluaciones.

**Causa raíz**: El custodio fue dado de alta directamente en `custodios_operativos` sin pasar por el pipeline de reclutamiento (`candidatos_custodios`). Las evaluaciones SIERCP requieren un `candidato_id` que no existe.

## Plan de corrección

### Fix 1: Economics — Pasar `id` al hook y agregar fallback
- Modificar `EconomicsTab` para pasar también el `custodioId` (UUID) al hook
- Modificar `useProfileEconomics` para:
  - Aceptar `custodioId` opcional además de `nombre`  
  - Intentar primero por `id_custodio` (UUID match), luego por `nombre_custodio` (ilike)
  - Si ambas fuentes retornan 0, consultar `servicios_planificados` por `custodio_asignado` (dual-source pattern)
- Esto elimina la dependencia de RLS sobre `servicios_custodia` cuando el match por nombre falla por permisos

### Fix 2: Evaluaciones — Fallback por nombre cuando no hay candidatoId
- Modificar `EvaluacionesTab` para que cuando `candidatoId` sea null:
  - Busque en `siercp_invitations` por `lead_nombre` ILIKE al nombre del custodio
  - Busque en `evaluaciones_psicometricas` directamente si hay invitaciones completadas
  - Muestre las evaluaciones encontradas con un banner informativo ("evaluación encontrada por nombre, sin candidato vinculado")
- Agregar botón "Vincular candidato" que cree el registro en `candidatos_custodios` y actualice `pc_custodio_id`

### Fix 3: Migración SQL — Backfill de pc_custodio_id
- Query para identificar custodios sin `pc_custodio_id` que tienen invitaciones o evaluaciones por nombre
- UPDATE para vincular los que matchean de forma inequívoca

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/pages/PerfilesOperativos/hooks/useProfileEconomics.ts` | Aceptar `custodioId`, query por UUID primero, fallback por nombre, dual-source |
| `src/pages/PerfilesOperativos/components/tabs/EconomicsTab.tsx` | Pasar `custodioId` al hook |
| `src/pages/PerfilesOperativos/PerfilForense.tsx` | Pasar `id` a EconomicsTab |
| `src/pages/PerfilesOperativos/components/tabs/EvaluacionesTab.tsx` | Fallback por nombre cuando candidatoId es null |
| Migración SQL | Backfill pc_custodio_id + permisos si necesario |

