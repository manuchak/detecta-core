-- Update tickets RLS policies to include 'monitoring' role
-- This allows monitoristas to view and work with tickets

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Users can view tickets" ON tickets;
DROP POLICY IF EXISTS "Assigned users can update tickets" ON tickets;

-- Recreate SELECT policy including 'monitoring' role
CREATE POLICY "Users can view tickets" ON tickets
FOR SELECT USING (
  (assigned_to = auth.uid()) 
  OR (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'manager', 'soporte', 'monitoring', 'monitoring_supervisor'])
  ))
);

-- Recreate UPDATE policy including 'monitoring' role
CREATE POLICY "Assigned users can update tickets" ON tickets
FOR UPDATE USING (
  (assigned_to = auth.uid()) 
  OR (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'manager', 'soporte', 'monitoring', 'monitoring_supervisor'])
  ))
);