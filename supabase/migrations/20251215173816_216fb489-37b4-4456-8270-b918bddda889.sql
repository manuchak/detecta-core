-- =====================================================
-- CUSTODIAN INVITATIONS SYSTEM
-- Allows admin/supply to generate invitation links 
-- with pre-assigned custodio role
-- =====================================================

-- Create custodian invitations table
CREATE TABLE public.custodian_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(255),
  nombre VARCHAR(255),
  telefono VARCHAR(50),
  candidato_id UUID REFERENCES public.candidatos_custodios(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for token lookups
CREATE INDEX idx_custodian_invitations_token ON public.custodian_invitations(token);
CREATE INDEX idx_custodian_invitations_created_by ON public.custodian_invitations(created_by);
CREATE INDEX idx_custodian_invitations_expires_at ON public.custodian_invitations(expires_at);

-- Enable RLS
ALTER TABLE public.custodian_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admin and supply roles can view all invitations
CREATE POLICY "Admin and supply can view invitations"
ON public.custodian_invitations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'supply')
  )
);

-- Admin and supply roles can create invitations
CREATE POLICY "Admin and supply can create invitations"
ON public.custodian_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'supply')
  )
);

-- Admin and supply roles can update invitations
CREATE POLICY "Admin and supply can update invitations"
ON public.custodian_invitations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'supply')
  )
);

-- Function to validate invitation token (public access for registration)
CREATE OR REPLACE FUNCTION public.validate_invitation_token(p_token VARCHAR)
RETURNS TABLE (
  is_valid BOOLEAN,
  invitation_id UUID,
  email VARCHAR,
  nombre VARCHAR,
  telefono VARCHAR,
  candidato_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Find the invitation
  SELECT * INTO v_invitation
  FROM public.custodian_invitations
  WHERE token = p_token;
  
  -- Check if invitation exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN, 
      NULL::UUID, 
      NULL::VARCHAR, 
      NULL::VARCHAR, 
      NULL::VARCHAR, 
      NULL::UUID,
      'Token de invitación no válido'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already used
  IF v_invitation.used_at IS NOT NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN, 
      v_invitation.id, 
      v_invitation.email, 
      v_invitation.nombre, 
      v_invitation.telefono, 
      v_invitation.candidato_id,
      'Esta invitación ya fue utilizada'::TEXT;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_invitation.expires_at < NOW() THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN, 
      v_invitation.id, 
      v_invitation.email, 
      v_invitation.nombre, 
      v_invitation.telefono, 
      v_invitation.candidato_id,
      'Esta invitación ha expirado'::TEXT;
    RETURN;
  END IF;
  
  -- Valid invitation
  RETURN QUERY SELECT 
    TRUE::BOOLEAN, 
    v_invitation.id, 
    v_invitation.email, 
    v_invitation.nombre, 
    v_invitation.telefono, 
    v_invitation.candidato_id,
    NULL::TEXT;
END;
$$;

-- Function to use invitation and assign custodio role
CREATE OR REPLACE FUNCTION public.use_invitation_and_assign_role(
  p_token VARCHAR,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Validate the token first
  SELECT * INTO v_invitation
  FROM public.custodian_invitations
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Invitación no válida, expirada o ya utilizada'::TEXT;
    RETURN;
  END IF;
  
  -- Mark invitation as used
  UPDATE public.custodian_invitations
  SET 
    used_at = NOW(),
    used_by = p_user_id,
    updated_at = NOW()
  WHERE id = v_invitation.id;
  
  -- Assign custodio role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'custodio')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log in audit trail
  INSERT INTO public.user_role_audit (
    user_id,
    old_role,
    new_role,
    changed_by,
    change_reason
  ) VALUES (
    p_user_id,
    NULL,
    'custodio',
    v_invitation.created_by,
    'Auto-assigned via invitation token: ' || p_token
  );
  
  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_invitation_token(VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.use_invitation_and_assign_role(VARCHAR, UUID) TO authenticated;