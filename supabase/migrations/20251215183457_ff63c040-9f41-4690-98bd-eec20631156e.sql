-- Fix Bug #1, #2, #3: Sincronizar phone desde invitación y metadata durante registro

-- 1. Modificar handle_new_user para incluir phone desde metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    display_name, 
    phone,
    is_verified,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 2. Modificar use_invitation_and_assign_role para actualizar profile con datos de invitación
CREATE OR REPLACE FUNCTION public.use_invitation_and_assign_role(
  p_token TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_candidato_id UUID;
BEGIN
  -- Buscar invitación válida
  SELECT * INTO v_invitation
  FROM custodian_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitación no válida o expirada';
  END IF;

  -- Obtener candidato_id de la invitación
  v_candidato_id := v_invitation.candidato_id;

  -- Marcar invitación como usada
  UPDATE custodian_invitations
  SET 
    status = 'used',
    used_at = NOW(),
    used_by_user_id = p_user_id
  WHERE token = p_token;

  -- Asignar rol de custodio
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'custodio')
  ON CONFLICT (user_id) DO UPDATE SET role = 'custodio';

  -- ✅ FIX BUG #3: Actualizar profile con phone y display_name de la invitación
  UPDATE public.profiles
  SET 
    phone = COALESCE(v_invitation.telefono, phone, ''),
    display_name = COALESCE(v_invitation.nombre, display_name),
    is_verified = TRUE,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Vincular usuario al custodio operativo si existe
  UPDATE custodios_operativos
  SET 
    user_id = p_user_id,
    updated_at = NOW()
  WHERE candidato_id = v_candidato_id;

  -- También actualizar pc_custodios
  UPDATE pc_custodios
  SET 
    user_id = p_user_id,
    updated_at = NOW()
  WHERE candidato_id = v_candidato_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;