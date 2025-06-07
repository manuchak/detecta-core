
import React from 'react';
import { Button } from '@/components/ui/button';
import { Role, Permission } from '@/types/roleTypes';
import { PlusCircle, AlertTriangle, ShieldCheck, Users, Crown, Lock } from 'lucide-react';
import { PermissionTypeGroup } from './PermissionTypeGroup';
import { groupPermissionsByType } from '@/utils/permissionUtils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

interface RolePermissionsContentProps {
  role: Role;
  permissions: Permission[] | undefined;
  filteredPermissions: Permission[] | undefined;
  typeFilter: string;
  onPermissionChange: (id: string, allowed: boolean) => void;
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

  // Get role icon and description
  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'owner':
        return Crown;
      case 'admin':
        return ShieldCheck;
      case 'supply_admin':
      case 'monitoring_supervisor':
        return Lock;
      default:
        return Users;
    }
  };

  const getRoleDescription = (role: Role) => {
    switch (role) {
      case 'owner':
        return 'El rol de Propietario tiene acceso completo a todas las funcionalidades del sistema por defecto.';
      case 'admin':
        return 'El rol de Administrador requiere permisos específicos para acceder a diferentes áreas del sistema.';
      case 'supply_admin':
        return 'Administrador de suministros con permisos para gestionar la cadena de abastecimiento.';
      case 'bi':
        return 'Analista de Business Intelligence con acceso a reportes y análisis de datos.';
      case 'monitoring_supervisor':
        return 'Supervisor de monitoreo con permisos para supervisar operaciones.';
      case 'monitoring':
        return 'Operador de monitoreo con permisos básicos de visualización.';
      case 'supply':
        return 'Operador de suministros con permisos básicos para gestión de inventario.';
      case 'soporte':
        return 'Personal de soporte técnico con permisos para asistencia al usuario.';
      case 'pending':
        return 'Usuario pendiente de asignación de rol definitivo.';
      case 'unverified':
        return 'Usuario sin verificar, acceso limitado hasta completar verificación.';
      default:
        return 'Rol personalizado del sistema con permisos configurables.';
    }
  };

  const RoleIcon = getRoleIcon(role);

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

  // Show enhanced empty state if no permissions for this role
  if (!permissions || permissions.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-8">
            <div className="text-center max-w-md mx-auto">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <RoleIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              
              <h3 className="text-lg font-semibold mb-2">
                Sin permisos configurados para {role}
              </h3>
              
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                {getRoleDescription(role)}
              </p>

              {/* Special message for owner role */}
              {role === 'owner' && (
                <Alert className="mb-6 bg-purple-50 border-purple-200">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <AlertTitle className="text-purple-800">Rol de Propietario</AlertTitle>
                  <AlertDescription className="text-purple-700">
                    Este rol tiene privilegios especiales y acceso completo por defecto, 
                    pero puede configurar permisos específicos si es necesario.
                  </AlertDescription>
                </Alert>
              )}

              {/* Special message for pending/unverified roles */}
              {(role === 'pending' || role === 'unverified') && (
                <Alert className="mb-6 bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Rol Temporal</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Este es un rol temporal. Los usuarios con este rol deben ser 
                    reasignados a roles definitivos para un funcionamiento óptimo.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => onAddPermission(role)}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Configurar Primer Permiso
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <RoleIcon className="h-4 w-4 text-primary" />
              <h3 className="font-medium">
                Permisos activos para <span className="font-bold text-primary">{role}</span>
              </h3>
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
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No se encontraron permisos para los filtros seleccionados</p>
                <Button 
                  variant="link" 
                  onClick={() => onAddPermission(role)}
                  className="mt-2"
                >
                  Añadir nuevo permiso
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
