-- ============================================
-- Tabla: siercp_invitations
-- Sistema de invitaciones SIERCP on-demand para leads externos
-- ============================================

CREATE TABLE public.siercp_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vinculación con lead
  lead_id TEXT NOT NULL,
  candidato_custodio_id UUID REFERENCES public.candidatos_custodios(id) ON DELETE SET NULL,
  
  -- Token de acceso único (público, sin auth)
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  
  -- Control de estado
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'sent', 'opened', 'started', 'completed', 'expired', 'cancelled')),
  
  -- Expiración (default 72 horas)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours'),
  
  -- Tracking de envío
  sent_at TIMESTAMPTZ,
  sent_via TEXT CHECK (sent_via IN ('email', 'whatsapp', 'manual', 'sms')),
  
  -- Tracking de acceso y progreso
  opened_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Datos del lead (snapshot para mostrar en página pública)
  lead_nombre TEXT,
  lead_email TEXT,
  lead_telefono TEXT,
  
  -- Resultado (referencia a evaluacion cuando se complete)
  evaluacion_id UUID REFERENCES public.evaluaciones_psicometricas(id) ON DELETE SET NULL,
  
  -- Auditoría
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Notas internas
  notas TEXT
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_siercp_invitations_token ON public.siercp_invitations(token);
CREATE INDEX idx_siercp_invitations_lead_id ON public.siercp_invitations(lead_id);
CREATE INDEX idx_siercp_invitations_status ON public.siercp_invitations(status);
CREATE INDEX idx_siercp_invitations_expires_at ON public.siercp_invitations(expires_at) WHERE status IN ('pending', 'sent', 'opened', 'started');

-- Trigger para updated_at
CREATE TRIGGER update_siercp_invitations_updated_at
  BEFORE UPDATE ON public.siercp_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Habilitar
ALTER TABLE public.siercp_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Supply/Admin pueden gestionar invitaciones (usando user_roles)
CREATE POLICY "Supply roles can manage siercp invitations"
ON public.siercp_invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'supply', 'coordinador_operaciones')
  )
);

-- Policy: Acceso anónimo para validar tokens (solo SELECT con token válido)
CREATE POLICY "Anonymous can validate tokens"
ON public.siercp_invitations
FOR SELECT
TO anon
USING (
  status IN ('pending', 'sent', 'opened', 'started')
  AND expires_at > NOW()
);

-- Policy: Acceso anónimo para actualizar estado (opened, started, completed)
CREATE POLICY "Anonymous can update invitation status"
ON public.siercp_invitations
FOR UPDATE
TO anon
USING (
  status IN ('pending', 'sent', 'opened', 'started')
  AND expires_at > NOW()
)
WITH CHECK (
  status IN ('opened', 'started', 'completed')
);

-- Comentarios
COMMENT ON TABLE public.siercp_invitations IS 'Invitaciones para evaluación SIERCP enviadas a leads externos sin necesidad de registro';
COMMENT ON COLUMN public.siercp_invitations.token IS 'Token único para acceso público sin autenticación';
COMMENT ON COLUMN public.siercp_invitations.status IS 'Estado: pending=creada, sent=enviada, opened=vista, started=iniciada, completed=terminada, expired=expirada, cancelled=cancelada';