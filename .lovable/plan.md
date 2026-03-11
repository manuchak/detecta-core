

# Habilitar eliminación de documentos para todo el equipo de Supply

## Problema

La política RLS de DELETE en `documentos_candidato` usa la función `has_supply_role()` que **no incluye el rol `supply`** básico:

```
Roles con acceso actual: admin, owner, supply_admin, supply_lead, coordinador_operaciones
Rol faltante: supply
```

El botón de eliminar (🗑️) se muestra en la UI para todos, pero al ejecutar el DELETE, Supabase lo bloquea silenciosamente para usuarios con rol `supply`.

## Corrección

**Migración SQL** — Actualizar la función `has_supply_role()` para incluir el rol `supply`:

```sql
CREATE OR REPLACE FUNCTION public.has_supply_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin','owner','supply_admin','supply_lead','supply','coordinador_operaciones'])
    AND (is_active IS NULL OR is_active = true)
  )
$$;
```

Un solo cambio en la función helper — se propaga automáticamente a todas las políticas que la usan (SELECT, UPDATE, DELETE en `documentos_candidato`).

