
# Plan: Corregir RLS de custodian_invitations para coordinador_operaciones

## Diagnóstico

### Causa Raíz
Las políticas RLS de la tabla `custodian_invitations` solo incluyen estos roles:
```sql
role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'supply')
```

**Falta: `coordinador_operaciones`**

### Impacto Actual
- Daniela (coordinador_operaciones) puede ver la página de invitaciones
- Pero al hacer INSERT, la base de datos rechaza con: "new row violates row-level security policy"

### Políticas Afectadas
| Política | Operación | Estado |
|----------|-----------|--------|
| Admin and supply can view invitations | SELECT | Falta coordinador_operaciones |
| Admin and supply can create invitations | INSERT | Falta coordinador_operaciones |
| Admin and supply can update invitations | UPDATE | Falta coordinador_operaciones |

---

## Solución

### Migración SQL

Crear una nueva migración que actualice las 3 políticas RLS para incluir `coordinador_operaciones`:

```sql
-- =====================================================
-- FIX: Add coordinador_operaciones to custodian_invitations RLS
-- Bug: Users with this role could access the UI but not create invitations
-- =====================================================

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Admin and supply can view invitations" ON public.custodian_invitations;
DROP POLICY IF EXISTS "Admin and supply can create invitations" ON public.custodian_invitations;
DROP POLICY IF EXISTS "Admin and supply can update invitations" ON public.custodian_invitations;

-- 2. Recreate with coordinador_operaciones included

-- SELECT policy
CREATE POLICY "Admin, supply and ops can view invitations"
ON public.custodian_invitations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'supply', 'coordinador_operaciones')
  )
);

-- INSERT policy
CREATE POLICY "Admin, supply and ops can create invitations"
ON public.custodian_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'supply', 'coordinador_operaciones')
  )
);

-- UPDATE policy
CREATE POLICY "Admin, supply and ops can update invitations"
ON public.custodian_invitations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'supply', 'coordinador_operaciones')
  )
);
```

---

## Verificación Post-Despliegue

1. **Probar con Daniela** - Login como coordinador_operaciones y crear invitación
2. **Verificar SELECT** - La lista de invitaciones debe cargar
3. **Verificar INSERT** - "Generar Link de Invitación" debe funcionar
4. **Verificar UPDATE** - Reenviar emails debe funcionar

---

## Archivos Afectados

| Tipo | Archivo |
|------|---------|
| Nueva migración | `supabase/migrations/[timestamp]_fix_custodian_invitations_rls_coordinador.sql` |

**Sin cambios en código frontend** - el hook `useCustodianInvitations.ts` ya está correcto.

---

## Impacto

| Antes | Después |
|-------|---------|
| coordinador_operaciones: ❌ INSERT bloqueado | coordinador_operaciones: ✓ Puede crear invitaciones |
| Solo 5 roles con acceso | 6 roles con acceso |
