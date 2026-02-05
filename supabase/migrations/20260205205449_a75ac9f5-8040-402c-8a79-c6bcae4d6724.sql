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