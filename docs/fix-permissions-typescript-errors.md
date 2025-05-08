
# Resolving TypeScript Error in usePermissions Hook

This document outlines the step-by-step process to fix the TypeScript error `Property 'role' does not exist on type 'never'` occurring in the `usePermissions.ts` hook.

## Problem Description

The error occurs in `src/hooks/usePermissions.ts` on line 143:
```typescript
if (isRoleObject(role)) {
  setUserRole(role.role); // Error here: Property 'role' does not exist on type 'never'
  return;
}
```

TypeScript is not correctly narrowing the type of `role` even after using the `isRoleObject` type guard.

## Root Causes

1. **Type Inference Issues**: TypeScript doesn't correctly track type narrowing through our conditional checks.
2. **Supabase Response Ambiguity**: The `get_user_role_safe` RPC function returns data in formats that cause type issues.
3. **Recursive RLS Policy**: Console logs show an "infinite recursion detected in policy for relation user_roles" error.
4. **Complex Control Flow**: Multiple conditional branches make it hard for TypeScript to follow type narrowing.

## Step-by-Step Solution

### 1. Fix the Infinite Recursion in Supabase RLS Policy

- Review the Row Level Security (RLS) policy on the `user_roles` table
- Identify policies that reference the same table they're applied to
- Replace direct table references with a security definer function
- Example fix pattern:
  ```sql
  -- Create a security definer function
  CREATE OR REPLACE FUNCTION public.get_user_role_safe(user_uid UUID) 
  RETURNS TEXT
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    found_role TEXT;
  BEGIN
    -- Directly query user_roles without going through RLS
    SELECT role INTO found_role 
    FROM public.user_roles 
    WHERE user_id = user_uid
    LIMIT 1;
    
    RETURN COALESCE(found_role, 'unverified');
  END;
  $$;
  ```

### 2. Improve Type Definitions and Guards

- Strengthen the `isRoleObject` type guard function with more explicit checks
- Ensure all edge cases are handled properly

### 3. Fix Type Handling in `useQuery` Result

- Add explicit type annotation to the `useQuery` hook result
- Properly handle the various possible return types from Supabase

### 4. Refactor the `useEffect` Logic

- Restructure the effect to handle all possible role value types correctly
- Use early returns for cleaner type narrowing
- Add additional safety checks to prevent TypeScript confusion

### 5. Add Debug Logging

- Add strategic console logs to verify actual data shapes at runtime
- Confirm that the expected data structure is being received from Supabase

### 6. Test the Changes

- Verify login/authentication flows still work
- Check that role-based permissions are correctly enforced
- Test the Settings page specifically
- Ensure there are no regressions in other components using this hook

### 7. Additional Code Improvements

- Consider refactoring large files like `useRoles.ts` (231 lines) and `PermissionsManager.tsx` (256 lines)
- Split complex logic into smaller, more focused functions
- Improve error handling for Supabase operations

## Implementation Notes

When fixing this issue, remember:

1. The `usePermissions` hook is critical for application security
2. Always provide a valid fallback role (typically 'owner')
3. Handle loading states appropriately
4. Maintain consistent behavior with the current implementation
5. Understand how data flows from Supabase through the application

## Related Files

- `src/hooks/usePermissions.ts` - Main file with the error
- `src/hooks/useRoles.ts` - Related permissions functionality
- `src/pages/Settings/Settings.tsx` - Page using the permissions hook
- `src/components/settings/PermissionsManager.tsx` - Component using roles/permissions
- `src/components/settings/UserRoleManager.tsx` - Component for managing user roles
