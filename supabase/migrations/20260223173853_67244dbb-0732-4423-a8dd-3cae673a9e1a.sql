CREATE POLICY "Authenticated users can delete midot evaluations"
ON public.evaluaciones_midot
FOR DELETE
TO authenticated
USING (true);