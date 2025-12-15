-- Add email tracking columns to custodian_invitations
ALTER TABLE public.custodian_invitations
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resend_email_id TEXT,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS bounce_type TEXT,
ADD COLUMN IF NOT EXISTS bounce_reason TEXT,
ADD COLUMN IF NOT EXISTS delivery_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resent_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_resent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resent_by UUID[],
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS import_row_number INT,
ADD COLUMN IF NOT EXISTS import_validation_errors TEXT[];

-- Create invitation_batches table for bulk imports
CREATE TABLE IF NOT EXISTS public.invitation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  filename TEXT,
  total_rows INT DEFAULT 0,
  valid_rows INT DEFAULT 0,
  invalid_rows INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  bounced_count INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'partial', 'failed'))
);

-- Add foreign key for batch_id
ALTER TABLE public.custodian_invitations
ADD CONSTRAINT fk_invitation_batch 
FOREIGN KEY (batch_id) REFERENCES public.invitation_batches(id) ON DELETE SET NULL;

-- Add constraint for delivery_status
ALTER TABLE public.custodian_invitations
ADD CONSTRAINT valid_delivery_status 
CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'bounced', 'complained', 'opened'));

-- Add constraint for bounce_type
ALTER TABLE public.custodian_invitations
ADD CONSTRAINT valid_bounce_type 
CHECK (bounce_type IS NULL OR bounce_type IN ('hard', 'soft'));

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invitations_batch_id ON public.custodian_invitations(batch_id);
CREATE INDEX IF NOT EXISTS idx_invitations_delivery_status ON public.custodian_invitations(delivery_status);
CREATE INDEX IF NOT EXISTS idx_invitations_resend_email_id ON public.custodian_invitations(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_batches_created_by ON public.invitation_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.invitation_batches(status);

-- Enable RLS on invitation_batches
ALTER TABLE public.invitation_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies for invitation_batches
CREATE POLICY "Authenticated users can view batches"
ON public.invitation_batches FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create batches"
ON public.invitation_batches FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update their batches"
ON public.invitation_batches FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Function to update batch stats
CREATE OR REPLACE FUNCTION public.update_batch_stats(p_batch_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE invitation_batches
  SET 
    sent_count = (SELECT COUNT(*) FROM custodian_invitations WHERE batch_id = p_batch_id AND email_sent_at IS NOT NULL),
    delivered_count = (SELECT COUNT(*) FROM custodian_invitations WHERE batch_id = p_batch_id AND delivery_status = 'delivered'),
    bounced_count = (SELECT COUNT(*) FROM custodian_invitations WHERE batch_id = p_batch_id AND delivery_status = 'bounced')
  WHERE id = p_batch_id;
END;
$$;

-- Function to renew invitation token
CREATE OR REPLACE FUNCTION public.renew_invitation_token(p_invitation_id UUID)
RETURNS TABLE(new_token TEXT, new_expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_token TEXT;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate new token
  v_new_token := encode(gen_random_bytes(32), 'hex');
  v_new_expires_at := NOW() + INTERVAL '30 days';
  
  -- Update invitation
  UPDATE custodian_invitations
  SET 
    token = v_new_token,
    expires_at = v_new_expires_at,
    used_at = NULL,
    used_by = NULL
  WHERE id = p_invitation_id
  RETURNING token, expires_at INTO v_new_token, v_new_expires_at;
  
  RETURN QUERY SELECT v_new_token, v_new_expires_at;
END;
$$;

-- Function to update invitation email
CREATE OR REPLACE FUNCTION public.update_invitation_email(p_invitation_id UUID, p_new_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE custodian_invitations
  SET 
    email = p_new_email,
    delivery_status = 'pending',
    bounce_type = NULL,
    bounce_reason = NULL,
    delivery_updated_at = NOW()
  WHERE id = p_invitation_id;
END;
$$;