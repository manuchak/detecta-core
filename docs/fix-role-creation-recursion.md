
# To-Do: Resolving Supabase Role Creation Infinite Recursion Issue

## Problem Overview
The current implementation of role creation in the application is failing due to an infinite recursion error in the Row Level Security (RLS) policies for the `user_roles` table. When attempting to create a new role through the Supabase client, the RLS policies trigger a recursive loop that causes the operation to fail.

## Root Cause Analysis
1. The RLS policies on the `user_roles` table likely include checks that reference the same table, creating a circular dependency
2. When using the Supabase client to create a role, these policies are triggered and cause infinite recursion
3. The error logs consistently show: "infinite recursion detected in policy for relation 'user_roles'"
4. The relationship between `user_roles` and `role_permissions` tables requires a specific insertion order that isn't being properly followed

## Solution Strategy
Bypass the Supabase client and its associated RLS policies by implementing a direct database connection within the Edge Function.

## Detailed Implementation Steps

### 1. Update the Edge Function (`create-role/index.ts`)

- [x] Remove the Supabase client initialization that uses the auth header
- [x] Add input validation to verify that `new_role` is a valid string
- [ ] Implement direct database connection using Deno's PostgreSQL client:
  - [ ] Get the database URL from environment variables (`SUPABASE_DB_URL`)
  - [ ] Create a connection pool with limited connections
  - [ ] Establish a connection to PostgreSQL
- [ ] Add validation to check if the role already exists in the database:
  - [ ] Query the `role_permissions` table to check for existing role
  - [ ] Return an appropriate error message if the role exists
- [ ] Implement the role creation operation:
  - [ ] Insert default permissions into the `role_permissions` table for the new role
  - [ ] Include basic permissions like dashboard and profile access
- [ ] Ensure proper connection and resource cleanup:
  - [ ] Release the database connection back to the pool
  - [ ] Close the pool when done
- [ ] Handle errors properly and return appropriate responses with CORS headers

### 2. Update the Frontend Hook (`useAvailableRoles.ts`)

- [ ] Verify that the `createRole` mutation properly handles the response from the Edge Function
- [ ] Ensure it correctly processes both success and error scenarios
- [ ] Update error handling to display appropriate feedback to users
- [ ] Make sure the query invalidation is working to refresh the role list after creation

### 3. Testing and Verification

- [ ] Test role creation with various inputs including:
  - [ ] Standard role names (e.g., "operator")
  - [ ] Role names with spaces (e.g., "content manager")
  - [ ] Role names with special characters
  - [ ] Empty or invalid inputs (should be rejected)
- [ ] Verify roles appear correctly in both `user_roles` and `role_permissions` tables
- [ ] Test role assignment to users through the UI
- [ ] Verify users with new roles receive appropriate permissions

### 4. Documentation and Code Review

- [ ] Document the approach and why a direct database connection was necessary
- [ ] Add inline code comments explaining the key parts of the implementation
- [ ] Review for potential security issues or edge cases
- [ ] Ensure all environment variables are properly configured in the Supabase dashboard

### 5. Deployment and Monitoring

- [ ] Deploy the updated Edge Function
- [ ] Monitor for any errors in the function logs
- [ ] Verify that role creation works in the production environment
- [ ] Set up additional logging to identify any other potential issues

## Security Considerations

- Although we're bypassing RLS, we still need to implement authorization in the Edge Function code
- We should validate that the user making the request has appropriate permissions
- We must carefully handle database credentials and connections to prevent leaks
- Proper input validation is crucial to prevent SQL injection or other attacks

## Long-term Improvements

- Consider refactoring the RLS policies to avoid the recursive dependency
- Create a dedicated database function for role management operations
- Add more comprehensive unit and integration tests for the role management system
- Implement more detailed logging for troubleshooting future issues
