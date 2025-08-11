-- PHASE 3: Fix conflicting function and remove email bypasses in security definer functions

-- 1) Ensure user_has_role_direct exists with stable signature
DROP FUNCTION IF EXISTS public.user_has_role_direct(text);
CREATE OR REPLACE FUNCTION public.user_has_role_direct(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = role_name
  );
END;
$$;

-- 2) Remove email bypass from is_admin_bypass_rls
CREATE OR REPLACE FUNCTION public.is_admin_bypass_rls()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager')
  );
END;
$$;

-- 3) Update reward bypass functions to rely on roles only
CREATE OR REPLACE FUNCTION public.create_reward_bypass_rls(
  reward_name text,
  reward_description text,
  reward_point_cost integer,
  reward_image_url text,
  reward_category_id uuid,
  reward_availability integer,
  reward_featured boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_reward_id uuid;
BEGIN
  -- Require admin/owner/manager role
  IF NOT (public.is_admin_user_secure() OR public.user_has_role_direct('manager')) THEN
    RAISE EXCEPTION 'Sin permisos para crear recompensas';
  END IF;
  
  INSERT INTO public.rewards (
    name, description, point_cost, image_url, category_id, availability, featured
  ) VALUES (
    reward_name, reward_description, reward_point_cost, reward_image_url,
    reward_category_id, reward_availability, reward_featured
  ) RETURNING id INTO new_reward_id;
  
  RETURN new_reward_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_reward_bypass_rls(
  reward_id uuid,
  reward_name text,
  reward_description text,
  reward_point_cost integer,
  reward_image_url text,
  reward_category_id uuid,
  reward_availability integer,
  reward_featured boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.is_admin_user_secure() OR public.user_has_role_direct('manager')) THEN
    RAISE EXCEPTION 'Sin permisos para actualizar recompensas';
  END IF;
  
  UPDATE public.rewards SET
    name = reward_name,
    description = reward_description,
    point_cost = reward_point_cost,
    image_url = reward_image_url,
    category_id = reward_category_id,
    availability = reward_availability,
    featured = reward_featured,
    updated_at = now()
  WHERE id = reward_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recompensa no encontrada';
  END IF;
  
  RETURN reward_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_reward_bypass_rls(reward_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.is_admin_user_secure() OR public.user_has_role_direct('manager')) THEN
    RAISE EXCEPTION 'Sin permisos para eliminar recompensas';
  END IF;
  
  DELETE FROM public.rewards WHERE id = reward_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recompensa no encontrada';
  END IF;
  RETURN true;
END;
$$;