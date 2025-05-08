
import React, { useState } from 'react';
import { useRoles } from '@/hooks/useRoles';
import { Role, NewPermission } from '@/types/roleTypes';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { RoleTabsList } from './permissions/RoleTabsList';
import { AddPermissionDialog } from './permissions/AddPermissionDialog';
import { PermissionsContainer } from './permissions/PermissionsContainer';

export const PermissionsManager = () => {
  const { roles, permissions, isLoading, updatePermission, addPermission } = useRoles();
  const [activeTab, setActiveTab] = useState<string>('admin');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState<NewPermission>({
    role: 'admin' as Role,
    permissionType: '',
    permissionId: '',
    allowed: true
  });

  const handlePermissionChange = (id: number, allowed: boolean) => {
    updatePermission.mutate({ id, allowed });
  };

  const handleAddPermission = () => {
    addPermission.mutate({
      role: newPermission.role,
      permissionType: newPermission.permissionType,
      permissionId: newPermission.permissionId,
      allowed: newPermission.allowed
    });
    setIsDialogOpen(false);
    setNewPermission({
      role: 'admin' as Role,
      permissionType: '',
      permissionId: '',
      allowed: true
    });
  };

  const handleNewPermissionChange = (field: string, value: string | boolean | Role) => {
    setNewPermission({ ...newPermission, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestión de Permisos</CardTitle>
          <CardDescription>
            Configure los permisos para cada rol en el sistema
          </CardDescription>
        </div>
        <AddPermissionDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          newPermission={newPermission}
          onNewPermissionChange={handleNewPermissionChange}
          onAddPermission={handleAddPermission}
          availableRoles={roles}
        />
      </CardHeader>
      <CardContent>
        <RoleTabsList 
          roles={roles} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        >
          {Array.isArray(roles) && roles.map((role) => (
            <PermissionsContainer
              key={role}
              role={role}
              permissions={permissions ? permissions[role] : []}
              onPermissionChange={handlePermissionChange}
            />
          ))}
        </RoleTabsList>
      </CardContent>
    </Card>
  );
};
