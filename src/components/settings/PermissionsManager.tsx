
import React, { useState, useMemo } from 'react';
import { useRoles } from '@/hooks/useRoles';
import { Role } from '@/types/roleTypes';
import { Card, CardContent } from '@/components/ui/card';
import { RoleSelector } from './permissions/RoleSelector';
import { PermissionsPanel } from './permissions/PermissionsPanel';
import { ImprovedAddPermissionDialog } from './permissions/ImprovedAddPermissionDialog';
import { 
  Loader2, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const PermissionsManager = () => {
  const { roles, permissions, isLoading, error, updatePermission, addPermission } = useRoles();
  const { toast } = useToast();
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);
  
  // Get permission count for a role
  const getPermissionCount = (role: Role) => {
    return permissions?.[role]?.length || 0;
  };

  // Get permissions for selected role
  const selectedRolePermissions = useMemo(() => {
    if (!selectedRole || !permissions) return [];
    return permissions[selectedRole] || [];
  }, [selectedRole, permissions]);

  // Handle permission toggle with better error handling
  const handlePermissionToggle = async (id: string, allowed: boolean) => {
    if (!updatePermission) {
      toast({
        title: "Error",
        description: "No se puede actualizar el permiso en este momento",
        variant: "destructive",
      });
      return;
    }

    try {
      await updatePermission.mutateAsync({ id, allowed });
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error al actualizar permiso",
        description: "Intente nuevamente o contacte al administrador",
        variant: "destructive",
      });
    }
  };

  // Handle add permission with better error handling
  const handleAddPermission = async (permissionData: {
    role: Role;
    permissionType: string;
    permissionId: string;
    allowed: boolean;
  }) => {
    if (!addPermission) {
      toast({
        title: "Error",
        description: "No se puede añadir el permiso en este momento",
        variant: "destructive",
      });
      return;
    }

    try {
      await addPermission.mutateAsync(permissionData);
      setIsAddPermissionOpen(false);
    } catch (error) {
      console.error('Error adding permission:', error);
      toast({
        title: "Error al añadir permiso",
        description: "Verifique que no exista un permiso duplicado",
        variant: "destructive",
      });
    }
  };

  // Handle open add permission dialog
  const handleOpenAddPermission = () => {
    if (selectedRole) {
      setIsAddPermissionOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-sm text-muted-foreground">
            Cargando permisos...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Sistema de Permisos</h2>
            <p className="text-sm text-muted-foreground">
              Gestión de accesos y roles del sistema
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error al cargar los permisos</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error instanceof Error ? error.message : 'Error desconocido'}</p>
            <div className="pt-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!roles || roles.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar el panel de permisos</AlertTitle>
        <AlertDescription>
          No se pudieron cargar correctamente los roles. Por favor, recargue la página.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header simplificado */}
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold">Sistema de Permisos</h2>
            <p className="text-sm text-gray-600">
              Gestiona los permisos de acceso para cada rol
            </p>
          </div>
        </div>
        
        {/* Role Selector - más limpio */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <RoleSelector
              roles={roles}
              selectedRole={selectedRole}
              onRoleSelect={setSelectedRole}
              getPermissionCount={getPermissionCount}
            />
          </CardContent>
        </Card>

        {/* Permissions Panel - diseño más lean */}
        {selectedRole && (
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <PermissionsPanel
                selectedRole={selectedRole}
                permissions={selectedRolePermissions}
                onPermissionToggle={handlePermissionToggle}
                onAddPermission={handleOpenAddPermission}
              />
            </CardContent>
          </Card>
        )}

        {/* Add Permission Dialog */}
        {selectedRole && (
          <ImprovedAddPermissionDialog
            isOpen={isAddPermissionOpen}
            onOpenChange={setIsAddPermissionOpen}
            selectedRole={selectedRole}
            onAddPermission={handleAddPermission}
            availableRoles={roles}
            existingPermissions={selectedRolePermissions}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default PermissionsManager;
