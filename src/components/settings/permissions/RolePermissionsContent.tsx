
import React from 'react';
import { Button } from '@/components/ui/button';
import { Role, Permission } from '@/types/roleTypes';
import { PlusCircle } from 'lucide-react';
import { PermissionTypeGroup } from './PermissionTypeGroup';
import { groupPermissionsByType } from '@/utils/permissionUtils';

interface RolePermissionsContentProps {
  role: Role;
  permissions: Permission[] | undefined;
  filteredPermissions: Permission[] | undefined;
  typeFilter: string;
  onPermissionChange: (id: number, allowed: boolean) => void;
  onAddPermission: (role: Role) => void;
}

export const RolePermissionsContent = ({ 
  role, 
  permissions, 
  filteredPermissions, 
  typeFilter, 
  onPermissionChange, 
  onAddPermission 
}: RolePermissionsContentProps) => {
  // Group permissions by type for easier understanding
  const groupedPermissions = groupPermissionsByType(filteredPermissions);
  
  const permissionGroups = Object.entries(groupedPermissions).map(([type, perms]) => ({
    type,
    permissions: perms
  }));

  if (filteredPermissions && filteredPermissions.length === 0 && typeFilter !== 'all') {
    return (
      <div className="bg-muted/20 rounded-lg py-8 px-6 text-center">
        <div className="text-muted-foreground">
          No hay permisos de tipo "{typeFilter}" para este rol.
        </div>
      </div>
    );
  }

  // Show empty state if no permissions for this role
  if (permissions?.length === 0) {
    return (
      <div className="bg-muted/20 rounded-lg py-12 px-6 text-center">
        <h3 className="text-md font-medium mb-2">No hay permisos para este rol</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Añada permisos para definir lo que los usuarios con el rol de "{role}" pueden hacer.
        </p>
        <Button 
          variant="outline" 
          onClick={() => onAddPermission(role)}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Añadir Permiso
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {permissionGroups.map(group => (
        <PermissionTypeGroup
          key={group.type}
          type={group.type}
          permissions={group.permissions}
          onPermissionChange={onPermissionChange}
        />
      ))}
    </div>
  );
};
