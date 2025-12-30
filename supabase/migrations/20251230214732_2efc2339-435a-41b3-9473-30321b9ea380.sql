
-- Fix documentos_candidato table security
-- Contains identity documents with OCR data - extremely sensitive PII

-- Ensure anon role has no access
REVOKE ALL ON public.documentos_candidato FROM anon;

-- Enable FORCE ROW LEVEL SECURITY
ALTER TABLE public.documentos_candidato FORCE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "documentos_candidato_select_authenticated" ON public.documentos_candidato;
DROP POLICY IF EXISTS "documentos_candidato_insert_authenticated" ON public.documentos_candidato;
DROP POLICY IF EXISTS "documentos_candidato_update_authenticated" ON public.documentos_candidato;
DROP POLICY IF EXISTS "documentos_candidato_delete_authenticated" ON public.documentos_candidato;

-- Create new restrictive policies
-- SELECT: Only HR/admin roles can view identity documents
CREATE POLICY "documentos_candidato_select_hr_admin" ON public.documentos_candidato
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones')
    AND (ur.is_active IS NULL OR ur.is_active = true)
  )
);

-- INSERT: Only HR/admin roles can upload documents
CREATE POLICY "documentos_candidato_insert_hr_admin" ON public.documentos_candidato
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones')
    AND (ur.is_active IS NULL OR ur.is_active = true)
  )
);

-- UPDATE: Only HR/admin roles can update document records
CREATE POLICY "documentos_candidato_update_hr_admin" ON public.documentos_candidato
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones')
    AND (ur.is_active IS NULL OR ur.is_active = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones')
    AND (ur.is_active IS NULL OR ur.is_active = true)
  )
);

-- DELETE: Only admin/owner can delete documents
CREATE POLICY "documentos_candidato_delete_admin" ON public.documentos_candidato
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'owner')
    AND (ur.is_active IS NULL OR ur.is_active = true)
  )
);
