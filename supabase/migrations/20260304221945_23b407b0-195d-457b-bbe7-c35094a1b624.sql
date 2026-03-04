CREATE POLICY "Supply puede eliminar referencias"
ON public.referencias_candidato
FOR DELETE
TO authenticated
USING (has_supply_role());