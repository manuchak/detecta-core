-- Update RLS policies on manual_call_logs to allow supply roles to insert/update and ensure creator tracking

-- Ensure RLS is enabled
ALTER TABLE public.manual_call_logs ENABLE ROW LEVEL SECURITY;

-- Create helper trigger to auto-set created_by on insert when missing
CREATE OR REPLACE FUNCTION public.set_created_by_manual_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  IF NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_created_by_manual_call ON public.manual_call_logs;
CREATE TRIGGER trg_set_created_by_manual_call
BEFORE INSERT OR UPDATE ON public.manual_call_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_created_by_manual_call();

-- Drop existing policies to replace with unified, role-safe ones
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='manual_call_logs' AND policyname='manual_call_logs_select_sales') THEN
    EXECUTE 'DROP POLICY "manual_call_logs_select_sales" ON public.manual_call_logs';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='manual_call_logs' AND policyname='manual_call_logs_insert_sales') THEN
    EXECUTE 'DROP POLICY "manual_call_logs_insert_sales" ON public.manual_call_logs';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='manual_call_logs' AND policyname='manual_call_logs_update_sales') THEN
    EXECUTE 'DROP POLICY "manual_call_logs_update_sales" ON public.manual_call_logs';
  END IF;
END $$;

-- Keep admin delete policy if it exists
-- Create new SELECT policy based on recruitment access (includes supply roles)
CREATE POLICY manual_call_logs_select_recruitment
ON public.manual_call_logs
FOR SELECT
USING (public.can_access_recruitment_data());

-- Allow inserts for authorized recruitment roles; enforce creator is current user
CREATE POLICY manual_call_logs_insert_recruitment
ON public.manual_call_logs
FOR INSERT
WITH CHECK (
  public.can_access_recruitment_data()
  AND (created_by = auth.uid())
);

-- Allow updates by creator or admins/managers with recruitment access
CREATE POLICY manual_call_logs_update_own_or_admin
ON public.manual_call_logs
FOR UPDATE
USING (
  (created_by = auth.uid())
  OR public.is_admin_user_secure()
  OR public.user_has_role_direct('manager')
)
WITH CHECK (
  (created_by = auth.uid())
  OR public.is_admin_user_secure()
  OR public.user_has_role_direct('manager')
);
