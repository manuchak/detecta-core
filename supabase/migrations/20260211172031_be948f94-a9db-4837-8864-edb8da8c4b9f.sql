
-- Helper function to normalize phone numbers for matching
CREATE OR REPLACE FUNCTION public.normalize_phone(phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF phone IS NULL THEN RETURN NULL; END IF;
  phone := regexp_replace(phone, '[^0-9]', '', 'g');
  IF length(phone) > 10 AND phone LIKE '52%' THEN
    phone := substring(phone from 3);
  END IF;
  IF length(phone) = 11 AND phone LIKE '1%' THEN
    phone := substring(phone from 2);
  END IF;
  RETURN phone;
END;
$$;

-- RPC to get custodian adoption status
CREATE OR REPLACE FUNCTION public.get_custodian_adoption_status()
RETURNS TABLE(
  id uuid,
  nombre text,
  telefono text,
  estado text,
  tiene_cuenta boolean,
  profile_id uuid,
  display_name text,
  email text,
  tiene_rol_custodio boolean,
  ultimo_checklist timestamptz,
  ultimo_ticket timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    co.id,
    co.nombre,
    co.telefono,
    co.estado,
    (p.id IS NOT NULL) as tiene_cuenta,
    p.id as profile_id,
    p.display_name,
    p.email,
    (ur.role IS NOT NULL) as tiene_rol_custodio,
    (SELECT MAX(cs.created_at) FROM checklist_servicio cs WHERE cs.custodio_telefono = co.telefono) as ultimo_checklist,
    (SELECT MAX(t.created_at) FROM tickets t WHERE t.custodio_telefono = co.telefono) as ultimo_ticket
  FROM custodios_operativos co
  LEFT JOIN profiles p ON normalize_phone(p.phone) = normalize_phone(co.telefono)
  LEFT JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'custodio'
  WHERE co.estado IN ('activo', 'suspendido')
  ORDER BY co.nombre;
$$;
