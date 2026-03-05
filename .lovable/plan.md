

# Permisos de Monitoristas en Bitácora — Diagnóstico y Corrección

## Diagnóstico

La bitácora opera sobre 3 tablas principales. El estado actual de permisos para `monitoring` y `monitoring_supervisor`:

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `servicio_eventos_ruta` | ✅ via `has_monitoring_role()` | ✅ | ✅ | ❌ (solo write_role) |
| `bitacora_asignaciones_monitorista` | ✅ via `has_monitoring_role()` | ✅ | ✅ | ❌ (solo write_role) |
| `servicios_planificados` | ✅ (abierto a autenticados) | ❌ | ❌ **PROBLEMA** | ❌ |

**El problema**: `servicios_planificados` solo permite UPDATE a `admin, owner, coordinador_operaciones, planificador, supply_admin`. Los roles `monitoring` y `monitoring_supervisor` **no pueden ejecutar** las acciones core de bitácora:

- Iniciar servicio (`hora_inicio_real`)
- Marcar "En Destino" (`en_destino = true`)
- Liberar servicio (`hora_fin_real`, `estado_planeacion`)

Estas 3 operaciones hacen UPDATE a `servicios_planificados` y fallarán silenciosamente por RLS.

## Plan de corrección

### 1. Actualizar `has_monitoring_write_role()` — Agregar monitoring y monitoring_supervisor

Actualmente solo incluye `admin, owner, coordinador_operaciones`. Los monitoristas necesitan poder ejecutar acciones en la bitácora (no solo leer). Actualizar a:

```sql
role IN ('admin', 'owner', 'coordinador_operaciones', 'monitoring', 'monitoring_supervisor')
```

### 2. Agregar monitoring/monitoring_supervisor al UPDATE policy de `servicios_planificados`

Modificar la policy "Authorized users can update planned services" para incluir estos roles:

```sql
role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin', 'monitoring', 'monitoring_supervisor')
```

### Archivos a modificar

| Capa | Cambio |
|---|---|
| DB (migración SQL) | Recrear `has_monitoring_write_role()` con monitoring + monitoring_supervisor |
| DB (migración SQL) | Recrear policy UPDATE en `servicios_planificados` incluyendo estos roles |

No se requieren cambios en frontend — el problema es puramente de permisos RLS en base de datos.

