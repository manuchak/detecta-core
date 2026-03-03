
## Diagnóstico del problema

### Causa 1 — `profiles` no es legible por `customer_success` (ROOT CAUSE principal)
`useCSMOptions` en `useAssignCSM.ts` hace un SELECT a `profiles` para obtener nombres de CSMs. La tabla `profiles` NO tiene política RLS que permita a `customer_success` leer otros perfiles. Solo pueden leer su propio perfil (`profiles_users_view_own`). Resultado: el dropdown de CSMs en Cartera falla o queda vacío, y la pestaña puede verse rota.

`useCSCartera` también hace un JOIN con `profiles` para obtener `csm_nombre`. Si falla, los nombres de CSMs asignados no aparecen → la tabla de Cartera se ve incompleta.

### Causa 2 — UPDATE en `pc_clientes` bloqueado para `customer_success`
La policy `pc_clientes_update` usa la función `es_planificador()` que solo incluye `admin, owner, planificador, coordinador_operaciones, supply_admin`. El rol `customer_success` NO está incluido. Cuando un CSM asigna un cliente en Cartera, el UPDATE falla silenciosamente (RLS rechaza).

### Causa 3 — `role_permissions` falta entrada para Staff CSM
La tabla `role_permissions` tiene `customer_success_cartera` y `customer_success_analisis` pero **NO** `customer_success_staff`. Si algún guard de permisos se aplica (futuro), la pestaña Staff quedaría bloqueada.

## Solución: Migración SQL con 3 fixes

### Fix 1: Agregar policy SELECT en `profiles` para `customer_success`
```sql
CREATE POLICY "customer_success_view_profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin','owner','customer_success','ejecutivo_ventas','coordinador_operaciones')
    AND (is_active IS NULL OR is_active = true)
  )
);
```

### Fix 2: Agregar policy UPDATE en `pc_clientes` para `customer_success`
Crear una policy UPDATE específica para `customer_success` que solo permita actualizar la columna `csm_asignado` (para asignación de cartera):
```sql
CREATE POLICY "customer_success_assign_csm_pc_clientes"
ON public.pc_clientes FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('customer_success')
    AND (is_active IS NULL OR is_active = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('customer_success')
    AND (is_active IS NULL OR is_active = true)
  )
);
```

### Fix 3: Insertar permiso faltante `customer_success_staff` en `role_permissions`
```sql
INSERT INTO role_permissions (role, permission_type, permission_id)
VALUES ('customer_success', 'page', 'customer_success_staff')
ON CONFLICT DO NOTHING;
```

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `supabase/migrations/...sql` | Las 3 políticas RLS arriba descritas |

Sin cambios de código frontend — el problema es 100% en base de datos.
