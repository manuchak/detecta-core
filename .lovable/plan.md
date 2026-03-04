
# Auditoría RLS — Estado Completo del Sistema

## ✅ Módulos Corregidos (LMS + Customer Success)

### LMS — Completamente migrado a SECURITY DEFINER
- `has_lms_admin_role()` → admin, owner, supply_admin, capacitacion_admin
- 21 policies migradas (cursos, modulos, contenidos, preguntas, inscripciones, progreso, certificados_plantillas)
- 3 RPCs actualizados (archive/delete/reactivate) con roles ampliados
- Old policies eliminadas, sin subqueries directas restantes
- `capacitacion_admin` tiene acceso full al LMS (sidebar, roleHomeConfig, accessControl)

### Customer Success — Completamente migrado a SECURITY DEFINER
- `has_cs_management_role()` → admin, owner, customer_success, ejecutivo_ventas, coordinador_operaciones, planificador, bi
- 10 policies CS migradas (quejas, touchpoints, capa, health_scores)
- 12 policies NPS/CSAT endurecidas (de acceso abierto → restringido por rol)

### Supply — Previamente migrado
- `has_supply_role()` y `has_supply_eval_role()` ya existían
- ~40 policies legacy eliminadas en migración anterior

---

## 🔴 Módulos Pendientes — Auditoría de Subqueries Directas

### Hallazgo: ~120+ policies con subqueries directas a `user_roles` en ~90 tablas

### Prioridad 1 — Riesgos de Seguridad Críticos

| Tabla | Problema | Severidad |
|---|---|---|
| `facturas` | **COMPLETAMENTE ABIERTA** (SELECT/INSERT/UPDATE con `true`) | 🔴 CRÍTICO |
| `servicios_monitoreo` | ALL policy abierta a todos los autenticados | 🔴 CRÍTICO |
| `zonas_operacion_nacional` | **15 policies duplicadas**, mix de funciones y subqueries | 🟡 ALTO |

### Prioridad 2 — Roles Obsoletos Detectados

Roles referenciados en policies que **NO existen** en el enum `app_role`:
- `manager` → en tickets, points_history, points_system_config, redemptions, rewards, forecast_config, patrones_demanda, presupuestos_zona, servicios_custodia
- `director` → en periodos_ajuste_operativo
- `bi_analyst` → en forecast_accuracy_history
- `c4` → en proveedores_armados
- `monitoreo` → en proveedores_armados (debería ser `monitoring`)

### Prioridad 3 — Tablas por Módulo con Subqueries Directas

#### Monitoreo (parcialmente migrado)
| Tabla | Policies con subqueries | Usa funciones DEFINER |
|---|---|---|
| `activos_monitoreo` | 0 | ✅ `user_has_role_direct()` |
| `alertas_sistema_nacional` | 0 | ✅ `check_admin_secure()` + `user_has_role_direct()` |
| `servicios_monitoreo` | 0 | ⚠️ Abierto a todos + `current_user_is_coordinator_or_admin()` |
| `zonas_operacion_nacional` | 12 directas | 🔴 15 policies totales, muchas duplicadas |

#### WMS (~10 tablas)
| Tabla | Policies | Roles |
|---|---|---|
| `categorias_productos` | 1 ALL | owner, admin, supply_admin |
| `configuraciones_producto` | 1 ALL | owner, admin, supply_admin |
| `configuracion_wms` | 1 ALL | admin, owner |
| `productos_inventario` | 1 ALL | owner, admin, supply_admin, coordinador_operaciones |
| `productos_serie` | 1 ALL | owner, admin, supply_admin |
| `ordenes_compra` | 1 ALL | owner, admin, supply_admin |
| `detalles_orden_compra` | 1 ALL | owner, admin, supply_admin |
| `recepciones_mercancia` | 1 ALL | owner, admin, supply_admin, coordinador_operaciones |
| `detalles_recepcion` | 1 ALL | owner, admin, supply_admin, coordinador_operaciones |
| `movimientos_inventario` | 2 (ALL + DELETE) | owner, admin, supply_admin, coordinador_operaciones |
| `proveedores` | 1 ALL | owner, admin, supply_admin |
| `stock_productos` | 1 | owner, admin, supply_admin |

#### Facturación
| Tabla | Policies | Problema |
|---|---|---|
| `facturas` | 3 (SELECT/INSERT/UPDATE) | **Todas abiertas con `true`** |
| `audit_facturacion_accesos` | 1 SELECT | admin, owner, bi, finanzas_admin |
| `pagos_proveedores_armados` | 5 | Subqueries directas |
| `pagos_instaladores` | 1 ALL | admin, owner, supply_admin |

#### CRM
| Tabla | Policies | Roles |
|---|---|---|
| `crm_activities` | 1 SELECT | admin, owner, ejecutivo_ventas, coordinador_operaciones, supply_admin, bi |
| `crm_deals` | 1 SELECT | Mismos roles |
| `crm_deal_stage_history` | 1 SELECT | Mismos roles |
| `crm_webhook_logs` | 1 SELECT | admin, owner |

#### Tickets
| Tabla | Policies | Problema |
|---|---|---|
| `tickets` | 5 con subqueries | Usa rol obsoleto `manager` |
| `ticket_business_hours` | 1 | admin, owner |
| `ticket_categorias_custodio` | 1 | admin, owner, soporte |
| `ticket_escalation_rules` | 1 | admin, owner |
| `ticket_response_templates` | 1 | admin, owner, soporte |
| `ticket_respuestas` | 1 | admin, owner, soporte |
| `ticket_subcategorias_custodio` | 1 | admin, owner, soporte |

#### Otros módulos con subqueries
- `profiles` (5 policies)
- `instaladores` y relacionadas (8+ policies)
- `programacion_instalaciones` (4 policies)
- `inventario_gps/sim/microsd` (3 policies)
- `servicios_planificados` (3 policies)
- `rewards/redemptions/points` (6+ policies con rol `manager`)
- `proveedores_armados` (3 policies con roles obsoletos `c4`, `monitoreo`)

---

## Plan de Corrección Propuesto

### Fase 1 — Seguridad Crítica (Inmediata)
1. Endurecer `facturas` — restringir de `true` a roles de facturación
2. Limpiar `zonas_operacion_nacional` — consolidar 15 policies en ~3
3. Restringir `servicios_monitoreo` ALL policy

### Fase 2 — Crear funciones SECURITY DEFINER faltantes
```text
has_wms_admin_role() → admin, owner, supply_admin
has_ticket_admin_role() → admin, owner, soporte
has_ops_admin_role() → admin, owner, coordinador_operaciones
has_crm_role() → admin, owner, ejecutivo_ventas, coordinador_operaciones, supply_admin, bi, customer_success
has_facturacion_role() → admin, owner, facturacion_admin, finanzas_admin, bi
```

### Fase 3 — Migrar ~120 policies por módulo
- WMS: ~12 policies
- Tickets: ~10 policies
- CRM: ~4 policies
- Facturación: ~6 policies
- Monitoreo/Zonas: ~15 policies
- Instaladores: ~8 policies
- Otros: ~60+ policies

### Fase 4 — Eliminar roles obsoletos
- Reemplazar `manager` → `coordinador_operaciones` o eliminar
- Reemplazar `director` → `owner`
- Reemplazar `bi_analyst` → `bi`
- Reemplazar `c4` → `monitoring`
- Reemplazar `monitoreo` → `monitoring`
