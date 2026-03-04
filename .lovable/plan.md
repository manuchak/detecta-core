

# Auditoría del Módulo Supply — RLS, Permisos y Workflow

## Resumen

Audité **18 tablas críticas** del pipeline de Supply (Candidatos → Evaluaciones → Liberación → Operativos) y encontré **~35 policies con subqueries directas a `user_roles`** (mismo anti-patrón de recursión que ya corregimos en Planeación) más **3 policies con roles obsoletos** que bloquean acceso silenciosamente.

---

## Hallazgos

### Hallazgo 1: 35 policies con subqueries directas a `user_roles` (riesgo recursión)

Las siguientes tablas del workflow de Supply hacen `EXISTS (SELECT 1 FROM user_roles WHERE ...)` directamente en sus policies, sin usar funciones SECURITY DEFINER:

| Tabla | # Policies afectadas | Etapa del pipeline |
|---|---|---|
| `candidatos_custodios` | 4 | Candidatos |
| `documentos_candidato` | 3 | Candidatos |
| `documentos_custodio` | 2 | Candidatos/Operativos |
| `entrevistas_estructuradas` | 2 | Evaluaciones |
| `evaluaciones_psicometricas` | 3 | Evaluaciones |
| `evaluaciones_toxicologicas` | 3 | Evaluaciones |
| `evaluaciones_normas` | 1 | Evaluaciones |
| `candidato_risk_checklist` | 2 | Evaluaciones |
| `referencias_candidato` | 3 | Evaluaciones |
| `siercp_results` | 3 | Evaluaciones SIERCP |
| `siercp_invitations` | 1 | Evaluaciones SIERCP |
| `lead_approval_process` | 1 | Aprobaciones |
| `custodio_liberacion` | 1 | Liberación |
| `custodio_state_transitions` | 1 | Liberación |
| `custodian_invitations` | 2 | Invitaciones |
| `armado_invitations` | 2 | Invitaciones |
| `custodios_operativos` | 1 | Operativos |
| `workflow_validation_config` | 1 | Config |

### Hallazgo 2: 3 policies con roles obsoletos (acceso roto)

Policies que usan nombres de rol que **no existen en el sistema**:

| Tabla | Policy | Rol obsoleto | Rol correcto |
|---|---|---|---|
| `documentos_custodio` | "Staff ve todos los documentos" | `planeacion`, `monitoreo`, `coordinador` | `planificador`, `monitoring`, `coordinador_operaciones` |
| `documentos_custodio` | "Staff actualiza documentos" | `planeacion`, `monitoreo`, `coordinador` | mismos |
| `candidatos_custodios` | "Candidatos visibles para supply y admin" | `coordinador_operativo` | `coordinador_operaciones` |
| `contactos_empresa` | "Contactos visibles para roles operativos" | `coordinador_operativo` | `coordinador_operaciones` |
| `inventario_gps` | "Inventario GPS para roles de supply chain" | `coordinador_operativo`, `instalador_coordinador` | `coordinador_operaciones` |
| `personal_proveedor_armados` | "Personal armados visible..." | `coordinador_operativo` | `coordinador_operaciones` |

Estos roles nunca hacen match → las policies **nunca autorizan** a los coordinadores/planificadores aunque deberían.

### Hallazgo 3: Sidebar de Supply Pipeline sin `roles` en el módulo padre

Similar al hallazgo de Planeación: el módulo `leads` (Pipeline) en `navigationConfig.ts` no tiene propiedad `roles` en el nivel padre, lo que hace que todos los autenticados vean el menú.

---

## Plan de Corrección

### Fase 1 — Crear funciones SECURITY DEFINER para Supply

Crear 3 funciones helper que cubran los distintos niveles de acceso del pipeline:

```text
has_supply_role()        → admin, owner, supply_admin, supply_lead, coordinador_operaciones
has_supply_read_role()   → + supply, ejecutivo_ventas, analista_seguridad, jefe_seguridad
has_supply_eval_role()   → admin, owner, supply_admin, supply_lead, supply, coordinador_operaciones (SIERCP)
```

### Fase 2 — Migrar ~35 policies

Recrear cada policy reemplazando la subquery directa con la función SECURITY DEFINER correspondiente. Esto incluye corregir simultáneamente los roles obsoletos (`planeacion` → `planificador`, `coordinador_operativo` → `coordinador_operaciones`, etc.).

Tablas en scope:
- `candidatos_custodios` (4 policies)
- `documentos_custodio` (2 policies — fix roles obsoletos)
- `documentos_candidato` (3 policies)
- `entrevistas_estructuradas` (2 policies)
- `evaluaciones_psicometricas` (3 policies)
- `evaluaciones_toxicologicas` (3 policies)
- `evaluaciones_normas` (1 policy)
- `candidato_risk_checklist` (2 policies)
- `referencias_candidato` (3 policies)
- `siercp_results` (3 policies)
- `siercp_invitations` (1 policy)
- `lead_approval_process` (1 policy)
- `custodio_liberacion` (1 policy)
- `custodio_state_transitions` (1 policy)
- `custodian_invitations` (2 policies)
- `armado_invitations` (2 policies)
- `custodios_operativos` (1 policy — admin manage)
- `workflow_validation_config` (1 policy)

También corregir las policies con roles obsoletos en:
- `contactos_empresa`
- `inventario_gps`
- `personal_proveedor_armados`

### Fase 3 — Frontend: Agregar `roles` al módulo Pipeline en sidebar

Agregar roles restrictivos al módulo padre `leads` en `navigationConfig.ts`.

### Archivos a modificar

| Capa | Archivo | Cambio |
|---|---|---|
| DB | Nueva migración SQL | Crear 3 funciones SECURITY DEFINER + recrear ~38 policies |
| Frontend | `src/config/navigationConfig.ts` | Agregar `roles` al módulo Pipeline |

