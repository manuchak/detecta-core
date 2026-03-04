

# Plan: Fix RLS Recursion on `user_roles` + Full Admin Access Hardening

## Root Cause

The console shows **`infinite recursion detected in policy for relation "user_roles"`** on multiple queries. This is caused by the policy `cs_roles_read_user_roles` on the `user_roles` table:

```sql
-- This policy ON user_roles does a subquery BACK to user_roles → infinite loop
EXISTS (SELECT 1 FROM user_roles ur2 WHERE ur2.user_id = auth.uid() AND ur2.role = ANY(...))
```

When ANY other table's policy does `EXISTS (SELECT FROM user_roles ...)`, Postgres evaluates RLS on `user_roles`, hits `cs_roles_read_user_roles`, which queries `user_roles` again → recursion → timeout/error.

This breaks the executive dashboard, holidays, routes-stats, and any query touching tables with `user_roles` subqueries in their policies.

## Fix — Single Migration

### Step 1: Replace recursive policy with SECURITY DEFINER function

Create a function `public.has_cs_management_role()` with `SECURITY DEFINER` (bypasses RLS on `user_roles`):

```sql
CREATE OR REPLACE FUNCTION public.has_cs_management_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin','owner','customer_success','ejecutivo_ventas',
                         'coordinador_operaciones','planificador','bi'])
    AND (is_active IS NULL OR is_active = true)
  )
$$;
```

### Step 2: Drop and recreate the recursive policy

```sql
DROP POLICY "cs_roles_read_user_roles" ON public.user_roles;

CREATE POLICY "cs_roles_read_user_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_cs_management_role());
```

This eliminates the self-referencing subquery. The `users_view_own_user_roles` policy (which uses `user_id = auth.uid()` — no recursion) remains untouched.

### Step 3: Verify no other self-referencing policies exist on `user_roles`

The remaining policies are:
- `users_view_own_user_roles` → `user_id = auth.uid()` — safe, no subquery
- `user_roles_manage_leads_read` → `can_manage_lead_assignments()` — already SECURITY DEFINER, safe
- `service_role_manage_user_roles` → `true` for service_role — safe

No other fixes needed.

## Files to Modify

| Layer | Change |
|---|---|
| Database migration | Create `has_cs_management_role()` SECURITY DEFINER, recreate `cs_roles_read_user_roles` policy |

No frontend changes needed — the recursion is purely a database-level issue.

