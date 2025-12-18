-- Fix profiles_table_public_exposure: Restrict profile access
-- Remove overly permissive policy that exposes all profiles to operational roles

-- Drop the problematic policy
DROP POLICY IF EXISTS "profiles_lead_managers_view" ON profiles;

-- Create restrictive replacement: operational roles can see display_name only via view
-- They should NOT have direct SELECT access to emails/phones of all users

-- For legitimate needs (e.g., seeing assigned custodian names), 
-- use existing views like custodios_operativos which expose only necessary fields

-- Summary of remaining policies:
-- profiles_users_view_own: Users see their own profile ✓
-- profiles_admins_view_all: Admin/Owner see all profiles ✓
-- profiles_users_insert_own: Users insert their own profile ✓
-- profiles_users_update_own: Users update their own profile ✓
-- profiles_admins_insert_all: Admin/Owner insert any profile ✓
-- profiles_admins_update_all: Admin/Owner update any profile ✓
-- profiles_admins_delete_all: Admin/Owner delete any profile ✓