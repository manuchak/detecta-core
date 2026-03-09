

# Fix: Monitoristas invisibles por RLS en `user_roles`

## Causa raíz

La tabla `user_roles` tiene RLS que solo permite a cada usuario ver **su propio** rol (`users_view_own_user_roles: user_id = auth.uid()`). No existe una política que permita a usuarios con rol `monitoring` ver a otros monitoristas. Por eso Karla solo se ve a sí misma y al filtrarla como saliente, la lista de entrantes queda vacía.

El mismo problema causa el error de pausas: al intentar redistribuir servicios, el hook no encuentra otros monitoristas disponibles.

## Solución

Agregar una política RLS en `user_roles` que permita a usuarios con roles de monitoreo leer los registros de otros usuarios de monitoreo. Usaremos el helper `has_monitoring_role()` ya existente.

### Migración SQL

```sql
CREATE POLICY "monitoring_read_monitoring_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  has_monitoring_role(auth.uid())
  AND role IN ('monitoring', 'monitoring_supervisor')
);
```

Esto permite que cualquier usuario con rol de monitoreo pueda ver las filas de `user_roles` donde `role` es `monitoring` o `monitoring_supervisor`. No expone otros roles (admin, owner, etc).

### Archivos

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Nueva política RLS `monitoring_read_monitoring_roles` en `user_roles` |

No se requieren cambios en código frontend — el hook `useMonitoristaAssignment` ya hace la query correcta, solo falla por permisos.

