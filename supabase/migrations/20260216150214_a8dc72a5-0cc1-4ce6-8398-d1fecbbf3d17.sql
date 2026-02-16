
-- Fix: Corregir normalizacion de telefono en RLS policy de servicios_custodia
-- La policy actual usa replace() que no quita el codigo de pais (+52)
-- La nueva usa RIGHT(regexp_replace(...), 10) para extraer los ultimos 10 digitos

DROP POLICY IF EXISTS "servicios_custodia_select_custodio_own" ON public.servicios_custodia;

CREATE POLICY "servicios_custodia_select_custodio_own"
ON public.servicios_custodia
FOR SELECT
USING (
  user_has_role_direct('custodio') AND (
    telefono = RIGHT(regexp_replace((SELECT phone FROM public.profiles WHERE id = auth.uid()), '[^0-9]', '', 'g'), 10)
    OR telefono_operador = RIGHT(regexp_replace((SELECT phone FROM public.profiles WHERE id = auth.uid()), '[^0-9]', '', 'g'), 10)
  )
);
