/**
 * Access Control Constants
 * 
 * Centralized role definitions to prevent drift between routes and menus.
 * Always import from here instead of hardcoding roles in components.
 */

// Build identifier for debugging cache issues
export const APP_BUILD_ID = `build-${Date.now()}`;

/**
 * Field operator roles - these have dedicated portals and should NOT access admin modules
 * Used by RoleBlockedRoute to redirect unauthorized access attempts
 */
export const FIELD_OPERATOR_ROLES = [
  'custodio',
  'instalador'
] as const;

/**
 * Portal redirect map for field operators
 * When a blocked role tries to access admin routes, redirect here
 */
export const PORTAL_REDIRECTS: Record<string, string> = {
  'custodio': '/custodian',
  'instalador': '/installers/portal'
} as const;

export type FieldOperatorRole = typeof FIELD_OPERATOR_ROLES[number];
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

/**
 * Roles with access to data correction actions (type conversion, etc.)
 */
export const DATA_CORRECTION_ROLES = [
  'admin',
  'owner',
  'coordinador_operaciones'
] as const;

/**
 * Roles de Facturación y Finanzas
 */
export const FACTURACION_ROLES = [
  'facturacion_admin',
  'facturacion',
  'finanzas_admin',
  'finanzas'
] as const;

/**
 * Roles con acceso completo a Facturación (todas las vistas)
 */
export const FACTURACION_FULL_ACCESS_ROLES = [
  'admin',
  'owner',
  'bi',
  'facturacion_admin',
  'finanzas_admin'
] as const;

/**
 * Roles con acceso limitado a Facturación (solo consulta)
 */
export const FACTURACION_LIMITED_ROLES = [
  'facturacion',
  'finanzas'
] as const;

/**
 * Todos los roles que pueden acceder al módulo Facturación
 */
export const FACTURACION_ALLOWED_ROLES = [
  ...FACTURACION_FULL_ACCESS_ROLES,
  ...FACTURACION_LIMITED_ROLES
] as const;

/**
 * Roles autorizados para editar el nombre comercial de clientes
 * IMPORTANTE: Este cambio puede afectar vinculaciones con rutas/servicios históricos
 */
export const NOMBRE_COMERCIAL_EDIT_ROLES = [
  'admin',
  'owner',
  'coordinador_operaciones'
] as const;

// Type exports for type-safe role checking
export type SIERCPRole = typeof SIERCP_ALLOWED_ROLES[number];
export type AdminRole = typeof ADMIN_ROLES[number];
export type SupplyRole = typeof SUPPLY_ROLES[number];
export type SecurityRole = typeof SECURITY_ROLES[number];
export type ReportesFullAccessRole = typeof REPORTES_FULL_ACCESS_ROLES[number];
export type ReportesLimitedAccessRole = typeof REPORTES_LIMITED_ACCESS_ROLES[number];
export type DataCorrectionRole = typeof DATA_CORRECTION_ROLES[number];
export type FacturacionRole = typeof FACTURACION_ROLES[number];
export type FacturacionFullAccessRole = typeof FACTURACION_FULL_ACCESS_ROLES[number];
export type NombreComercialEditRole = typeof NOMBRE_COMERCIAL_EDIT_ROLES[number];
