-- Allow finance roles to update pc_clientes (credit, billing rules, cobranza fields)
CREATE POLICY "facturacion_update_pc_clientes"
ON public.pc_clientes
FOR UPDATE
TO authenticated
USING (has_facturacion_write_role())
WITH CHECK (has_facturacion_write_role());