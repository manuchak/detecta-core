
-- =====================================================
-- Portal de Armados: tabla de invitaciones + rol armado
-- =====================================================

-- 1. Tabla armado_invitations (misma estructura que custodian_invitations)
CREATE TABLE IF NOT EXISTS public.armado_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  email TEXT,
  nombre TEXT,
  telefono TEXT,
  armado_operativo_id UUID REFERENCES public.armados_operativos(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id)
);

-- 2. Enable RLS
ALTER TABLE public.armado_invitations ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: admin, supply, coordinador can manage
CREATE POLICY "Admin, supply and ops can view armado invitations"
ON public.armado_invitations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones')
    AND is_active = true
  )
);

CREATE POLICY "Admin, supply and ops can create armado invitations"
ON public.armado_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones')
    AND is_active = true
  )
);

CREATE POLICY "Admin, supply and ops can update armado invitations"
ON public.armado_invitations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones')
    AND is_active = true
  )
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_armado_invitations_token ON public.armado_invitations(token);
CREATE INDEX IF NOT EXISTS idx_armado_invitations_email ON public.armado_invitations(email);
CREATE INDEX IF NOT EXISTS idx_armado_invitations_status ON public.armado_invitations(status);
