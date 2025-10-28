-- ============================================
-- HIGH PRIORITY FIX 5/5: Require authentication for ticket creation
-- ============================================

-- Drop public insert policy
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;

-- Require authentication for ticket creation
CREATE POLICY "authenticated_create_tickets"
ON tickets FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (created_by = auth.uid() OR created_by IS NULL)
);

-- Users can view their own tickets (support roles see all)
CREATE POLICY "users_view_own_tickets"
ON tickets FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'soporte', 'supply_admin')
  )
);

-- Only support roles can update tickets
CREATE POLICY "support_update_tickets"
ON tickets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'soporte')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'soporte')
  )
);

-- Only admins can delete tickets
CREATE POLICY "admins_delete_tickets"
ON tickets FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Add trigger to auto-set created_by
CREATE OR REPLACE FUNCTION set_ticket_creator()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_ticket_creator_on_insert ON tickets;
CREATE TRIGGER set_ticket_creator_on_insert
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_creator();

COMMENT ON TABLE tickets IS 'SECURITY: Requires authentication. Users see only their own tickets.';