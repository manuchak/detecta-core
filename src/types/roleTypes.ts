
export type Role = 
  | 'owner'
  | 'admin'
  | 'supply_admin'
  | 'coordinador_operaciones'
  | 'jefe_seguridad'
  | 'analista_seguridad'
  | 'supply_lead'
  | 'bi'
  | 'monitoring_supervisor'
  | 'monitoring'
  | 'supply'
  | 'instalador'
  | 'soporte'
  | 'pending'
  | 'unverified';

export interface Permission {
  id: string; // Changed from number to string for Supabase UUID compatibility
  role: Role;
  permission_type: string;
  permission_id: string;
  allowed: boolean;
}

export interface UserWithRole {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  created_at: string;
  last_login?: string;
}

export interface RolePermissionInput {
  role: Role;
  permissionType: string;
  permissionId: string;
  allowed: boolean;
}

export interface CreateRoleInput {
  role: Role;
}

export interface UpdateRoleInput {
  oldRole: Role;
  newRole: Role;
}

export interface DeleteRoleInput {
  role: Role;
}

export type PermissionsByRole = Record<Role, Permission[]>;
