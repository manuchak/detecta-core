
export type Role = 'admin' | 'supply' | 'supply_admin' | 'soporte' | 'bi' | 'monitoring' | 'monitoring_supervisor' | 'owner' | 'pending' | 'unverified';

export type UserWithRole = {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  created_at: string;
  last_login: string;
};

export type Permission = {
  id: number;
  role: Role;
  permission_type: string;
  permission_id: string;
  allowed: boolean;
};

export type PermissionsByRole = Record<string, Permission[]>;

export type RolePermissionInput = {
  role: Role;
  permissionType: string;
  permissionId: string;
  allowed: boolean;
};

export type NewPermission = {
  role: Role;
  permissionType: string;
  permissionId: string;
  allowed: boolean;
};
