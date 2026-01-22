/**
 * Access Control Constants
 * 
 * Centralized role definitions to prevent drift between routes and menus.
 * Always import from here instead of hardcoding roles in components.
 */

// Build identifier for debugging cache issues
export const APP_BUILD_ID = `build-${Date.now()}`;

/**
 * Roles with access to SIERCP evaluation module
 * Used in: App.tsx routes, Sidebar.tsx menu
 */
export const SIERCP_ALLOWED_ROLES = [
  'admin',
  'owner', 
  'jefe_seguridad',
  'analista_seguridad',
  'supply_admin',
  'supply_lead',
  'supply'
] as const;

/**
 * Administrative roles with full system access
 */
export const ADMIN_ROLES = [
  'admin',
  'owner'
] as const;

/**
 * Supply chain roles
 */
export const SUPPLY_ROLES = [
  'supply_admin',
  'supply_lead',
  'supply',
  'ejecutivo_ventas'
] as const;

/**
 * Security analysis roles
 */
export const SECURITY_ROLES = [
  'jefe_seguridad',
  'analista_seguridad'
] as const;

/**
 * Roles with FULL access to Reports Hub (all tabs)
 */
export const REPORTES_FULL_ACCESS_ROLES = [
  'admin',
  'owner',
  'coordinador_operaciones'
] as const;

/**
 * Roles with LIMITED access to Reports Hub (operational tabs only)
 */
export const REPORTES_LIMITED_ACCESS_ROLES = [
  'planificador'
] as const;

/**
 * All roles that can access the Reports module
 */
export const REPORTES_ALLOWED_ROLES = [
  ...REPORTES_FULL_ACCESS_ROLES,
  ...REPORTES_LIMITED_ACCESS_ROLES
] as const;

// Type exports for type-safe role checking
export type SIERCPRole = typeof SIERCP_ALLOWED_ROLES[number];
export type AdminRole = typeof ADMIN_ROLES[number];
export type SupplyRole = typeof SUPPLY_ROLES[number];
export type SecurityRole = typeof SECURITY_ROLES[number];
export type ReportesFullAccessRole = typeof REPORTES_FULL_ACCESS_ROLES[number];
export type ReportesLimitedAccessRole = typeof REPORTES_LIMITED_ACCESS_ROLES[number];
