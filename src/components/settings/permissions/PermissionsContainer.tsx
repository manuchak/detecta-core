
import React from 'react';
import { Permission } from '@/types/roleTypes';
import { TabsContent } from '@/components/ui/tabs';
import { PermissionsList } from './PermissionsList';

interface PermissionsContainerProps {
  role: string;
  permissions: Permission[] | undefined;
  onPermissionChange: (id: number, allowed: boolean) => void;
}

export const PermissionsContainer = ({ 
  role, 
  permissions, 
  onPermissionChange 
}: PermissionsContainerProps) => {

  const groupPermissionsByType = (rolePermissions: Permission[] = []) => {
    const grouped: Record<string, Permission[]> = {};
    
    rolePermissions.forEach(permission => {
      const type = permission.permission_type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(permission);
    });
    
    return grouped;
  };

  return (
    <TabsContent key={role} value={role}>
      {permissions && permissions.length > 0 ? (
        Object.entries(groupPermissionsByType(permissions)).map(([type, typePermissions]) => (
          <PermissionsList
            key={type}
            type={type}
            typePermissions={typePermissions}
            onPermissionChange={onPermissionChange}
          />
        ))
      ) : (
        <div className="text-center p-4 border rounded-md">
          No hay permisos configurados para este rol.
        </div>
      )}
    </TabsContent>
  );
};
