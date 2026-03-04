

# Evaluacion del Modulo de Planificacion - Accesos y RLS

## Estado Actual

### Frontend (Rutas) -- OK
Todas las rutas de planeacion incluyen los roles correctos:
- `/planeacion` → `admin, owner, coordinador_operaciones, planificador`
- `/planeacion/nuevo-servicio` → mismos roles
- `/planeacion/reportes` → mismos roles
- `/planeacion/sanciones` → `admin, owner, coordinador_operaciones`

### Backend (Funciones SECURITY DEFINER) -- OK
Todas las funciones criticas son SECURITY DEFINER con `search_path=public`:
- `puede_acceder_planeacion()` → `admin, owner, planificador, coordinador_operaciones, supply_admin, c4, monitoreo`
- `es_planificador()` → `admin, owner, planificador, coordinador_operaciones, supply_admin`
- `get_custodios_activos_disponibles()` → mismos roles que `puede_acceder_planeacion()`

### RLS por Tabla Critica

| Tabla | SELECT | INSERT | UPDATE | DELETE | Estado |
|---|---|---|---|---|---|
| `servicios_planificados` | `auth.uid() IS NOT NULL` (open read) | `auth` (open insert) | admin/owner/coord/planificador/supply_admin | admin/owner only | OK |
| `asignacion_armados` | admin/owner/coord/planificador/supply_admin | via ALL policy | via ALL policy | via ALL policy | **RIESGO: subquery directa a user_roles** |
| `custodios_operativos` | `auth.uid() IS NOT NULL` (open read) | via ALL admin | via ALL admin | via ALL admin | OK |
| `pc_clientes` | `puede_acceder_planeacion()` | open insert | `es_planificador()` | admin only | OK |
| `pc_custodios` | `puede_acceder_planeacion()` | open insert | `es_planificador()` | admin only | OK |
| `pc_rutas_frecuentes` | `puede_acceder_planeacion()` | open insert | `es_planificador()` | `es_planificador()` | OK |
| `pc_servicios` | `puede_acceder_planeacion()` | open insert | `es_planificador()` | admin only | OK |
| `pc_asignaciones` | `puede_acceder_planeacion()` | open insert | `es_planificador()` | -- | OK |
| `matriz_precios_rutas` | admin/owner/supply_admin/coord/planificador | open insert | same as select | admin only | **RIESGO: subquery directa** |
| `custodio_rechazos` | `puede_acceder_planeacion()` | `puede_acceder_planeacion()` | `puede_acceder_planeacion()` | -- | OK |
| `checklist_servicio` | staff roles (subquery directa) | -- | -- | -- | **RIESGO: subquery directa** |
| `armados` | subquery directa | via ALL subquery | via ALL subquery | -- | **RIESGO: subquery directa** |
| `armados_operativos` | subquery directa | -- | subquery directa | -- | **RIESGO: subquery directa** |
| `armados_indisponibilidades` | subquery directa | via ALL | via ALL | -- | **RIESGO: subquery directa** |

## Hallazgos

### Problema 1: Policies con subqueries directas a `user_roles` (riesgo de recursion)
Hay **~15 tablas de planeacion** cuyas policies hacen `EXISTS (SELECT 1 FROM user_roles WHERE ...)` directamente, sin usar funciones SECURITY DEFINER. Aunque la recursion se resolvio en la policy `cs_roles_read_user_roles`, las subqueries directas siguen siendo un anti-patron que:
- Genera mas evaluaciones RLS en cascada (cada subquery evalua las policies de `user_roles`)
- Puede volver a causar recursion si se agrega otra policy self-referencing a `user_roles`

**Tablas afectadas en planeacion:**
- `asignacion_armados` (SELECT y ALL)
- `armados` (SELECT y ALL)
- `armados_operativos` (SELECT y UPDATE)
- `armados_indisponibilidades` (SELECT y ALL)
- `armados_performance_metrics` (SELECT y ALL)
- `checklist_servicio` (SELECT staff)
- `matriz_precios_rutas` (SELECT y UPDATE — ya migradas pero coexisten con block_field_operators)

### Problema 2: Sidebar de Planeacion no tiene `roles` restrictivo
El modulo `planeacion` en `navigationConfig.ts` no tiene propiedad `roles` a nivel del modulo padre (linea 280), lo que significa que **todos los roles autenticados ven el menu**, aunque luego las rutas los bloquean. No es un bug funcional pero genera confusion.

## Plan de Correccion

### Fase 1 — Migracion: Convertir subqueries directas a funciones SECURITY DEFINER

Crear una funcion generica `has_planning_role()` SECURITY DEFINER que reemplace las subqueries directas en las policies de tablas de planeacion:

```sql
CREATE OR REPLACE FUNCTION public.has_planning_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin','owner','coordinador_operaciones','planificador','supply_admin'])
    AND (is_active IS NULL OR is_active = true)
  )
$$;
```

Luego recrear las policies de:
- `asignacion_armados` — SELECT y ALL
- `armados` — SELECT y ALL
- `armados_operativos` — SELECT y UPDATE
- `armados_indisponibilidades` — SELECT y ALL
- `armados_performance_metrics` — SELECT y ALL
- `checklist_servicio` — SELECT staff (agregar monitoring al helper o crear funcion separada)

### Fase 2 — Frontend: Agregar `roles` al modulo planeacion en sidebar

Agregar `roles: ['admin', 'owner', 'coordinador_operaciones', 'planificador']` al modulo padre en `navigationConfig.ts` para que solo los roles con acceso vean el menu.

### Archivos a modificar

| Capa | Archivo | Cambio |
|---|---|---|
| DB | Nueva migracion SQL | Crear `has_planning_role()`, recrear ~12 policies |
| Frontend | `src/config/navigationConfig.ts` | Agregar `roles` al modulo planeacion |

