
-- Custodians can insert their own requests
CREATE POLICY "custodian_insert_own_apoyo"
ON public.solicitudes_apoyo_extraordinario
FOR INSERT TO authenticated
WITH CHECK (solicitado_por = auth.uid());

-- Custodians can view their own requests
CREATE POLICY "custodian_read_own_apoyo"
ON public.solicitudes_apoyo_extraordinario
FOR SELECT TO authenticated
USING (solicitado_por = auth.uid() OR custodio_id = auth.uid());
