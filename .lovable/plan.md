
## Diagnóstico completo

Después de revisar todas las capas (hooks, componentes, migraciones, RLS), el estado actual es:

### ✅ Lo que YA funciona (no hay que cambiar)
- `cs_quejas` — policy `CS staff full access quejas` cubre SELECT/INSERT/UPDATE/DELETE para `customer_success`
- `cs_touchpoints` — `CS staff full access touchpoints` + políticas adicionales de INSERT/UPDATE
- `cs_capa`, `cs_health_scores` — full access para `customer_success`
- `pc_clientes` — SELECT policy `customer_success_select_pc_clientes` existe
- `profiles` — `customer_success_view_profiles` existe para ver nombres de CSM
- `pc_clientes` — UPDATE policy `customer_success_assign_csm_pc_clientes` para asignar CSM
- `servicios_custodia` y `servicios_planificados` — SELECT policies para `customer_success`
- `useCSCartera` — ya usa query desacoplada (fix previo)

### ❌ Problemas identificados que aún bloquean acceso total

**Problema 1 — `user_roles` SELECT**: `useCSMOptions` en `useAssignCSM.ts` hace una query directa a `user_roles` para obtener los IDs de los usuarios con rol `customer_success`. Si el rol que está logueado no tiene una política SELECT en `user_roles`, esta query falla silenciosamente y el dropdown de asignación de CSM aparece vacío.

**Problema 2 — `pc_clientes` UPDATE sin `is_active` filter**: La política `customer_success_assign_csm_pc_clientes` en la migración `20260303222023` usa `AND role = 'customer_success'` **sin** `AND (is_active IS NULL OR is_active = true)` en el `WITH CHECK`, lo que puede causar inconsistencias si hay roles inactivos.

**Problema 3 — `cs_touchpoints` INSERT WITH CHECK inconsistency**: La policy `customer_success_insert_cs_touchpoints` en la migración reciente tiene `WITH CHECK` pero NO tiene `USING` — esto es correcto para INSERT, pero la nueva `CS staff full access touchpoints` de la migración original puede entrar en conflicto.

**Problema 4 — `useCSCartera` `isLoading` infinito sin error state**: `CSPanorama` línea 88-97 muestra skeleton infinito si `carteraLoading` nunca termina. No hay manejo de `isError`. Si la query falla, el usuario ve skeletons para siempre.

### Plan de acción

**Fix 1 (DB migration)**: Agregar política SELECT en `user_roles` para que `customer_success` pueda leer los roles necesarios para poblar el dropdown CSM. Actualmente `useCSMOptions` falla porque no hay policy SELECT permisiva para `user_roles` para este rol.

```sql
-- Allow customer_success to read user_roles for CSM dropdown population
CREATE POLICY IF NOT EXISTS "customer_success_read_user_roles"
ON public.user_roles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = auth.uid()
    AND ur2.role IN ('admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones')
    AND (ur2.is_active IS NULL OR ur2.is_active = true)
  )
);
```

**Fix 2 (Frontend)**: En `CSPanorama.tsx`, agregar manejo de `isError` para que cuando falle `useCSCartera`, salga del skeleton y muestre un mensaje de error con botón de reintentar.

```tsx
const { data: cartera, isLoading: carteraLoading, isError: carteraError, refetch } = useCSCartera();
// ...
if (carteraError) return <ErrorState onRetry={refetch} />;
```

**Fix 3 (Frontend)**: Mismo manejo de `isError` en `CSCartera.tsx` para la tabla de cartera.

### Archivos a modificar
| Capa | Archivo | Cambio |
|---|---|---|
| DB | Nueva migración | Policy SELECT en `user_roles` para CS roles |
| Frontend | `CSPanorama.tsx` | Agregar `isError` + botón reintentar |
| Frontend | `CSCartera.tsx` | Agregar `isError` + mensaje de error en tabla |
