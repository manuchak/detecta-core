
import React from 'react';
import { Button } from '@/components/ui/button';
import { Role, Permission } from '@/types/roleTypes';
import { PlusCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PermissionTypeGroup } from './PermissionTypeGroup';
import { groupPermissionsByType } from '@/utils/permissionUtils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

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
  const groupedPermissions = groupPermissionsByType(filteredPermissions || []);
  
  const permissionGroups = Object.entries(groupedPermissions).map(([type, perms]) => ({
    type,
    permissions: perms
  }));

  // Check if there are permissions but none match the filter
  const hasPermissionsButNoneMatch = 
    permissions && permissions.length > 0 && 
    filteredPermissions && filteredPermissions.length === 0 && 
    typeFilter !== 'all';

  // Show message when filter returns no results but there are permissions
  if (hasPermissionsButNoneMatch) {
    return (
      <div className="space-y-4">
        <Alert variant="default" className="bg-muted/40">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <AlertTitle className="ml-2">No se encontraron permisos</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            No hay permisos de tipo "{typeFilter}" para este rol. 
            <Button 
              variant="link" 
              className="px-1 h-auto font-medium text-primary"
              onClick={() => onAddPermission(role)}
            >
              Añadir permiso
            </Button>
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={() => onAddPermission(role)}
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1" />
            Añadir Permiso
          </Button>
        </div>
      </div>
    );
  }

  // Show empty state if no permissions for this role
  if (!permissions || permissions.length === 0) {
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
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Permisos del rol: <span className="font-bold text-primary">{role}</span></h3>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => onAddPermission(role)}
              className="flex items-center gap-2 shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Añadir Permiso
            </Button>
          </div>
          
          <div className="space-y-6">
            {permissionGroups.length > 0 ? (
              permissionGroups.map(group => (
                <PermissionTypeGroup
                  key={group.type}
                  type={group.type}
                  permissions={group.permissions}
                  onPermissionChange={onPermissionChange}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron permisos para los filtros seleccionados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
