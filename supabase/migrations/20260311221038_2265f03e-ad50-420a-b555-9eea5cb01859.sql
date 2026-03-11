CREATE POLICY "Staff puede eliminar documentos candidato"
ON public.documentos_candidato
FOR DELETE TO authenticated
USING (public.has_supply_role());