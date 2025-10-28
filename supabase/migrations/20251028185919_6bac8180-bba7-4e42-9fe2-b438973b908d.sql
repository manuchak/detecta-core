-- ============================================
-- HIGH PRIORITY FIX 4/5: Add ownership isolation to referidos
-- ============================================

-- Step 1: Add referrer_id column to track who made the referral
ALTER TABLE referidos 
ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES auth.users(id);

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_referidos_referrer_id ON referidos(referrer_id);

-- Step 3: Backfill existing records (assign to first admin/owner)
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find first admin/owner user
  SELECT user_id INTO admin_user_id
  FROM user_roles
  WHERE role IN ('owner', 'admin')
  ORDER BY created_at
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    UPDATE referidos
    SET referrer_id = admin_user_id
    WHERE referrer_id IS NULL;
    
    RAISE NOTICE 'Backfilled % referidos records with admin user', 
      (SELECT COUNT(*) FROM referidos WHERE referrer_id = admin_user_id);
  END IF;
END $$;

-- Step 4: Make referrer_id NOT NULL for data integrity
ALTER TABLE referidos 
ALTER COLUMN referrer_id SET NOT NULL;

-- Step 5: Drop permissive policies
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver referidos" ON referidos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear referidos" ON referidos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar referidos" ON referidos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar referidos" ON referidos;

-- Step 6: Create ownership-based policies

-- Users can only see their own referrals (admins see all)
CREATE POLICY "users_view_own_referidos"
ON referidos FOR SELECT
TO authenticated
USING (
  referrer_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin')
  )
);

-- Users can only create referrals for themselves
CREATE POLICY "users_create_own_referidos"
ON referidos FOR INSERT
TO authenticated
WITH CHECK (referrer_id = auth.uid());

-- Users can only update their own referrals (admins can update all)
CREATE POLICY "users_update_own_referidos"
ON referidos FOR UPDATE
TO authenticated
USING (
  referrer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  referrer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Only admins can delete referrals
CREATE POLICY "admins_delete_referidos"
ON referidos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Step 7: Add trigger to auto-set referrer_id on insert
CREATE OR REPLACE FUNCTION set_referrer_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referrer_id IS NULL THEN
    NEW.referrer_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_referrer_id_on_insert
  BEFORE INSERT ON referidos
  FOR EACH ROW
  EXECUTE FUNCTION set_referrer_id();

COMMENT ON TABLE referidos IS 'SECURITY: Users can only access their own referrals. Admins have full access.';
COMMENT ON COLUMN referidos.referrer_id IS 'User who created this referral. Auto-set by trigger.';