
import React, { useState } from 'react';
import { useRoles } from '@/hooks/useRoles';
import { Role, Permission } from '@/types/roleTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PermissionsContainer } from './permissions/PermissionsContainer';
import { RoleTabsList } from './permissions/RoleTabsList';
import { AddPermissionDialog } from './permissions/AddPermissionDialog';

export const PermissionsManager = () => {
  const { roles, permissions, isLoading, updatePermission, addPermission } = useRoles();
  const [activeTab, setActiveTab] = useState<string>('admin');
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);

  // Safely handle permission changes
  const handlePermissionChange = (id: number, allowed: boolean) => {
    if (updatePermission) {
      updatePermission.mutate({ id, allowed });
    }
  };

  // Safely handle new permission addition
  const handleAddPermission = (
    role: Role,
    permissionType: string,
    permissionId: string,
    allowed: boolean
  ) => {
    if (addPermission) {
      addPermission.mutate({ role, permissionType, permissionId, allowed });
    }
    setIsAddPermissionOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Permisos del Sistema</h2>
        <Button onClick={() => setIsAddPermissionOpen(true)}>
          Añadir Permiso
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Cargando permisos...</div>
          ) : !permissions || Object.keys(permissions).length === 0 ? (
            <div className="text-center py-8">
              No hay permisos configurados. Añada un nuevo permiso para comenzar.
            </div>
          ) : (
            <RoleTabsList
              roles={roles}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            >
              {roles?.map((role) => (
                <PermissionsContainer
                  key={role}
                  role={role}
                  permissions={permissions?.[role] as Permission[]}
                  onPermissionChange={handlePermissionChange}
                />
              ))}
            </RoleTabsList>
          )}
        </CardContent>
      </Card>
      
      <AddPermissionDialog
        open={isAddPermissionOpen}
        onClose={() => setIsAddPermissionOpen(false)}
        onAddPermission={handleAddPermission}
        roles={roles || []}
      />
    </div>
  );
};

export default PermissionsManager;
