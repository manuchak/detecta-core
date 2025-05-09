
import React, { useState } from 'react';
import { useRoles } from '@/hooks/useRoles';
import { Role, Permission } from '@/types/roleTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PermissionsContainer } from './permissions/PermissionsContainer';
import { RoleTabsList } from './permissions/RoleTabsList';
import { AddPermissionDialog } from './permissions/AddPermissionDialog';
import { PlusCircle, Loader2 } from 'lucide-react';

export const PermissionsManager = () => {
  const { roles, permissions, isLoading, updatePermission, addPermission } = useRoles();
  const [activeTab, setActiveTab] = useState<string>('admin');
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);
  const [newPermission, setNewPermission] = useState<{
    role: Role;
    permissionType: string;
    permissionId: string;
    allowed: boolean;
  }>({
    role: 'admin',
    permissionType: '',
    permissionId: '',
    allowed: true,
  });

  // Safely handle permission changes
  const handlePermissionChange = (id: number, allowed: boolean) => {
    if (updatePermission) {
      updatePermission.mutate({ id, allowed });
    }
  };

  // Handle changes to the new permission form
  const handleNewPermissionChange = (field: string, value: string | boolean | Role) => {
    setNewPermission(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Safely handle new permission addition
  const handleAddPermission = () => {
    if (addPermission) {
      addPermission.mutate({
        role: newPermission.role,
        permissionType: newPermission.permissionType,
        permissionId: newPermission.permissionId,
        allowed: newPermission.allowed
      });
    }
    setIsAddPermissionOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Permisos del Sistema</h2>
          <p className="text-muted-foreground mt-1">Administre los permisos para cada rol en el sistema</p>
        </div>
        <Button 
          onClick={() => setIsAddPermissionOpen(true)} 
          className="flex items-center gap-2 shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          Añadir Permiso
        </Button>
      </div>
      
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Matriz de Permisos</CardTitle>
          <CardDescription>Configure los permisos para cada rol definido en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-sm text-muted-foreground">
                  Cargando permisos...
                </div>
              </div>
            </div>
          ) : !permissions || Object.keys(permissions).length === 0 ? (
            <div className="bg-muted/50 rounded-lg py-12 px-6 text-center">
              <h3 className="text-lg font-medium mb-2">No hay permisos configurados</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Añada un nuevo permiso para comenzar a configurar el acceso para los usuarios del sistema.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setIsAddPermissionOpen(true)}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Añadir Primer Permiso
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4">
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
            </div>
          )}
        </CardContent>
      </Card>
      
      <AddPermissionDialog
        isOpen={isAddPermissionOpen}
        onOpenChange={setIsAddPermissionOpen}
        newPermission={newPermission}
        onNewPermissionChange={handleNewPermissionChange}
        onAddPermission={handleAddPermission}
        availableRoles={roles}
      />
    </div>
  );
};

export default PermissionsManager;
