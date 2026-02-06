
# Plan: Resolver Flujo de Registro de Custodios - Conflicto de Roles Duplicados

## Resumen del Problema

Cuando un custodio se registra via invitación, termina con **DOS roles** (`pending` + `custodio`), y el sistema devuelve `pending` porque ambos tienen la misma prioridad en la función de rol.

### Flujo Actual (Bug)

```text
1. Edge function crea usuario con email_confirm: true
2. Supabase dispara trigger handle_email_confirmation
3. Trigger inserta rol 'pending' en user_roles
4. Edge function inserta rol 'custodio' en user_roles
5. Usuario tiene roles: [pending, custodio]
6. get_current_user_role_secure() → devuelve 'pending' (prioridad 10)
7. Usuario ve pantalla "Cuenta Pendiente de Activación"
```

### Usuarios Afectados (Confirmado)

| Email | Roles |
|-------|-------|
| sanchezperezcristiandavid96@gmail.com | [pending, custodio] |
| csjs078208@gmail.com | [pending, custodio] |
| test-validation-flow@test.com | [pending, custodio] |

---

## Solución Propuesta (3 Cambios)

### Cambio 1: Actualizar Prioridad de Roles en SQL

**Archivo:** Nueva migración SQL

La función `get_current_user_role_secure()` necesita priorizar `custodio` sobre `pending`:

```sql
CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  found_role TEXT;
BEGIN
  SELECT role INTO found_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
    AND is_active = true
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'planificador' THEN 4
      WHEN 'coordinador_operaciones' THEN 5
      WHEN 'supply_lead' THEN 6
      WHEN 'ejecutivo_ventas' THEN 7
      WHEN 'instalador' THEN 8
      WHEN 'custodio' THEN 9        -- NUEVO: Prioridad antes de pending
      WHEN 'monitoring' THEN 10
      WHEN 'pending' THEN 98        -- MODIFICADO: Casi última prioridad
      WHEN 'unverified' THEN 99     -- NUEVO: Última prioridad
      ELSE 50
    END
  LIMIT 1;
  
  RETURN COALESCE(found_role, 'unverified');
END;
$$;
```

### Cambio 2: Edge Function - Eliminar Rol Pending al Asignar Custodio

**Archivo:** `supabase/functions/create-custodian-account/index.ts`

Después de asignar el rol `custodio`, eliminar cualquier rol `pending` residual:

```typescript
// Assign custodio role
const { error: roleErr } = await supabaseAdmin
  .from('user_roles')
  .insert({
    user_id: userData.user.id,
    role: 'custodio'
  });

// NUEVO: Limpiar rol pending si existe (evitar duplicados)
if (!roleErr) {
  await supabaseAdmin
    .from('user_roles')
    .delete()
    .eq('user_id', userData.user.id)
    .eq('role', 'pending');
  
  console.log(`[create-custodian-account] Cleaned up pending role for ${email}`);
}
```

### Cambio 3: Migración de Limpieza de Datos Existentes

**Archivo:** Nueva migración SQL

Eliminar el rol `pending` de usuarios que ya tienen `custodio`:

```sql
-- Limpiar roles duplicados: usuarios con pending + custodio
DELETE FROM public.user_roles
WHERE role = 'pending'
AND user_id IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'custodio'
);

-- Log de limpieza
DO $$
DECLARE
  deleted_count INT;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % duplicate pending roles from custodians', deleted_count;
END $$;
```

---

## Archivos a Modificar/Crear

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `supabase/migrations/YYYYMMDD_fix_custodian_role_priority.sql` | Crear | Actualizar función de prioridad + limpiar datos |
| `supabase/functions/create-custodian-account/index.ts` | Modificar | Eliminar rol pending tras asignar custodio |

---

## Flujo Corregido

```text
1. Edge function crea usuario con email_confirm: true
2. Supabase dispara trigger (inserta 'pending')
3. Edge function inserta 'custodio'
4. Edge function ELIMINA 'pending' ← NUEVO
5. Usuario tiene solo rol: [custodio]
6. get_current_user_role_secure() → devuelve 'custodio'
7. Usuario accede directamente al portal de custodios
```

---

## Verificación Post-Implementación

1. **Test de nuevo registro:**
   - Generar nueva invitación
   - Completar registro
   - Verificar que usuario tiene SOLO rol `custodio`
   - Confirmar redirección a `/custodian/onboarding`

2. **Test de usuarios existentes:**
   - Verificar que Cristian, Jaime y otros solo tienen rol `custodio`
   - Confirmar que pueden acceder al portal

3. **Query de verificación:**
```sql
SELECT user_id, array_agg(role) as roles
FROM user_roles
WHERE user_id IN (SELECT user_id FROM user_roles WHERE role = 'custodio')
GROUP BY user_id
HAVING COUNT(*) > 1;
-- Debe retornar 0 filas
```

---

## Impacto

- **Riesgo:** Bajo - solo afecta priorización de roles y limpieza de datos redundantes
- **Usuarios afectados:** ~4 custodios con roles duplicados
- **Tiempo de implementación:** ~15 minutos
- **Rollback:** Revertir función de prioridad (no destructivo)
