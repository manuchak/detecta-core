CREATE POLICY "Planeacion puede actualizar rechazos" 
ON public.custodio_rechazos
FOR UPDATE USING (puede_acceder_planeacion());