

# Corrección RLS — Monitoreo, WMS, Facturación, CRM, Tickets

## Roles confirmados por módulo

| Módulo | Lectura | Escritura/Gestión |
|---|---|---|
| **Monitoreo** | admin, owner, monitoring, monitoring_supervisor, coordinador_operaciones, jefe_seguridad, analista_seguridad, planificador | admin, owner, coordinador_operaciones |
| **WMS** | admin, owner, supply_admin, supply_lead, monitoring_supervisor, coordinador_operaciones | admin, owner, supply_admin, coordinador_operaciones |
| **Tickets** | admin, owner, soporte, coordinador_operaciones, planificador, monitoring, monitoring_supervisor + own tickets | admin, owner, soporte, coordinador_operaciones |
| **CRM** | admin, owner, ejecutivo_ventas, coordinador_operaciones, supply_admin, bi, customer_success | admin, owner (service role for inserts) |
| **Facturación** | admin, owner, facturacion_admin, finanzas_admin, bi, coordinador_operaciones | admin, owner, facturacion_admin, finanzas_admin |

---

## Hallazgos actuales

### Seguridad critica
- **`facturas`**: 3 policies con `true` — abierta a todos
- **`servicios_monitoreo`**: ALL policy abierta a todos los autenticados
- **`ordenes_compra`**, **`recepciones_mercancia`**, **`proveedores`**, **`stock_productos`**: ALL policies abiertas a todos los autenticados (redundantes con las nuevas)
- **`zonas_operacion_nacional`**: 15 policies duplicadas (mezcla de subqueries directas y funciones DEFINER)

### Roles obsoletos
- `manager` en tickets → eliminar (reemplazado por `coordinador_operaciones`)
- `manager` en `is_admin_bypass_rls()` → eliminar

### Policies duplicadas
- WMS: cada tabla tiene ~3 policies superpuestas (legacy ALL + nuevas granulares + read via `user_has_wms_access()`)
- Zonas: 15 policies donde con 2 bastaría

---

## Plan de corrección

### Fase 1 — Crear/actualizar funciones SECURITY DEFINER

```text
has_monitoring_role()     → admin, owner, monitoring, monitoring_supervisor, coordinador_operaciones, jefe_seguridad, analista_seguridad, planificador
has_monitoring_write_role() → admin, owner, coordinador_operaciones
has_wms_role()            → (actualizar user_has_wms_access) admin, owner, supply_admin, supply_lead, monitoring_supervisor, coordinador_operaciones
has_wms_write_role()      → (actualizar can_manage_wms) admin, owner, supply_admin, coordinador_operaciones
has_ticket_role()         → admin, owner, soporte, coordinador_operaciones, planificador, monitoring, monitoring_supervisor
has_ticket_admin_role()   → admin, owner, soporte, coordinador_operaciones
has_crm_role()            → admin, owner, ejecutivo_ventas, coordinador_operaciones, supply_admin, bi, customer_success
has_facturacion_role()    → admin, owner, facturacion_admin, finanzas_admin, bi, coordinador_operaciones
has_facturacion_write_role() → admin, owner, facturacion_admin, finanzas_admin
```

Actualizar `is_admin_bypass_rls()` para eliminar rol obsoleto `manager`.

### Fase 2 — Migrar policies por módulo

**Monitoreo (6 tablas, ~17 policies → ~6)**
- `servicios_monitoreo`: Drop ALL abierta, crear SELECT con `has_monitoring_role()`, UPDATE con `has_monitoring_write_role()`
- `zonas_operacion_nacional`: Drop las 15 policies, crear SELECT con `has_monitoring_role()` + ALL con `has_monitoring_write_role()`
- `activos_monitoreo`: Ya usa `user_has_role_direct()` — dejar como está
- `alertas_sistema_nacional`: Ya usa `check_admin_secure()` — dejar como está

**WMS (12 tablas, ~36 policies → ~24)**
- Drop legacy ALL policies abiertas (`ordenes_compra`, `recepciones_mercancia`, `proveedores`, `stock_productos`)
- Drop legacy `wms_admins_*` subquery policies (duplicadas con las granulares que ya usan `is_admin_bypass_rls`)
- Mantener estructura: SELECT vía `user_has_wms_access()`, INSERT/UPDATE/DELETE vía `can_manage_wms()`

**Facturación (4 tablas, ~9 policies)**
- `facturas`: Drop 3 policies abiertas, crear SELECT/INSERT/UPDATE con `has_facturacion_role()`, UPDATE con `has_facturacion_write_role()`
- `audit_facturacion_accesos`: Migrar subquery a `has_facturacion_role()`
- `pagos_proveedores_armados`: Migrar 5 subqueries a funciones DEFINER
- `pagos_instaladores`: Migrar subquery a función

**CRM (4 tablas, ~8 policies)**
- `crm_activities`, `crm_deals`, `crm_deal_stage_history`: Migrar SELECT subqueries a `has_crm_role()`
- `crm_webhook_logs`: Migrar subquery a `check_admin_secure()`
- Mantener INSERT/UPDATE con `true` (service role)

**Tickets (7 tablas, ~14 policies)**
- `tickets`: Reemplazar `manager` con `coordinador_operaciones`, migrar subqueries a `has_ticket_role()` / `has_ticket_admin_role()`
- `ticket_business_hours`, `ticket_escalation_rules`: Migrar subqueries a `check_admin_secure()`
- `ticket_categorias_custodio`, `ticket_subcategorias_custodio`: Migrar a `has_ticket_admin_role()`
- `ticket_response_templates`: Migrar a `has_ticket_admin_role()`
- `ticket_respuestas`: Migrar subquery interna a `has_ticket_admin_role()`

### Fase 3 — Frontend: Sidebar ajustes menores

- `monitoring` module (L444): Agregar `roles` al padre con los roles de monitoreo
- `tickets` module (L490): Agregar `roles` al padre con los roles de tickets
- `wms` module (L369): Ya tiene roles, sin cambios
- Eliminar `manager` del módulo `recruitment` (L217)

### Archivos a modificar

| Capa | Archivo | Cambio |
|---|---|---|
| DB | Nueva migración SQL | Crear ~9 funciones DEFINER, recrear ~80 policies, eliminar ~50 legacy |
| Frontend | `src/config/navigationConfig.ts` | Agregar `roles` a monitoring y tickets parent; eliminar `manager` de recruitment |

