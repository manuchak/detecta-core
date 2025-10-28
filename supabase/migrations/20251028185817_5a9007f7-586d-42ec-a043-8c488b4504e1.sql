-- ============================================
-- CRITICAL FIX 1/5: Remove PUBLIC access from WhatsApp tables
-- ============================================

-- Drop dangerous PUBLIC policies
DROP POLICY IF EXISTS "Service can manage WhatsApp sessions" ON whatsapp_sessions;
DROP POLICY IF EXISTS "Service can manage messages" ON whatsapp_messages;

-- Restrict SELECT to authorized roles only
CREATE POLICY "authorized_view_whatsapp_sessions"
ON whatsapp_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'supply_admin', 'ejecutivo_ventas', 'soporte')
  )
);

CREATE POLICY "authorized_view_whatsapp_messages"
ON whatsapp_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'supply_admin', 'ejecutivo_ventas', 'soporte')
  )
);

-- Allow service_role (for webhooks/edge functions) to manage data
CREATE POLICY "service_role_manage_whatsapp_sessions"
ON whatsapp_sessions FOR ALL
TO service_role
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_manage_whatsapp_messages"
ON whatsapp_messages FOR ALL
TO service_role
USING (true) 
WITH CHECK (true);

COMMENT ON TABLE whatsapp_sessions IS 'SECURITY: Only service_role can write. Authorized roles can read.';
COMMENT ON TABLE whatsapp_messages IS 'SECURITY: Only service_role can write. Authorized roles can read.';