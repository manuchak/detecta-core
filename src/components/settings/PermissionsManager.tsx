import React, { useState, useMemo, useEffect } from 'react';
import { useRoles } from '@/hooks/useRoles';
import { Role, Permission } from '@/types/roleTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleTabsList } from './permissions/RoleTabsList';
import { AddPermissionDialog } from './permissions/AddPermissionDialog';
import { PermissionTypeFilter } from './permissions/PermissionTypeFilter';
import { RolePermissionsContent } from './permissions/RolePermissionsContent';
import { 
  PlusCircle, 
  Loader2, 
  ShieldCheck, 
  Lock,
  X,
  AlertTriangle,
  RefreshCw,
  Users,
  Crown,
  UserCheck
} from 'lucide-react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';

export const PermissionsManager = () => {
  // Get roles, permissions and related functions
  const { roles, permissions, isLoading, error, updatePermission, addPermission } = useRoles();
  
  // State for active tab and permissions filter
  const [activeTab, setActiveTab] = useState<string>('admin');
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [retryCount, setRetryCount] = useState(0);
  
  // State for the new permission being added
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
  
  // Estados para mostrar información sobre duplicados
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Detect permission loading errors and set error message
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al cargar permisos';
      
      if (errorMessage.includes('infinite recursion')) {
        setLoadError('Se detectó un error de recursión infinita en las políticas de seguridad. Esto puede deberse a políticas RLS mal configuradas.');
      } else {
        setLoadError(errorMessage);
      }
    } else {
      setLoadError(null);
    }
  }, [error]);

  // Set active tab to first available role when roles are loaded
  useEffect(() => {
    if (roles && roles.length > 0 && !activeTab) {
      setActiveTab(roles[0]);
    }
  }, [roles, activeTab]);

  // All permissions for validation
  const allPermissions = useMemo(() => {
    const result: Permission[] = [];
    if (permissions) {
      Object.values(permissions).forEach(rolePermissions => {
        if (rolePermissions) {
          rolePermissions.forEach(permission => {
            result.push(permission);
          });
        }
      });
    }
    return result;
  }, [permissions]);

  // Get role description and icon
  const getRoleInfo = (role: Role) => {
    switch (role) {
      case 'owner':
        return { 
          label: 'Propietario', 
          icon: Crown, 
          description: 'Acceso total al sistema',
          color: 'bg-purple-100 text-purple-800'
        };
      case 'admin':
        return { 
          label: 'Administrador', 
          icon: ShieldCheck, 
          description: 'Gestión completa de usuarios y configuración',
          color: 'bg-red-100 text-red-800'
        };
      case 'supply_admin':
        return { 
          label: 'Admin Suministros', 
          icon: UserCheck, 
          description: 'Gestión de cadena de suministros',
          color: 'bg-amber-100 text-amber-800'
        };
      case 'coordinador_operaciones':
        return { 
          label: 'Coordinador Operaciones', 
          icon: UserCheck, 
          description: 'Coordinación de operaciones y servicios',
          color: 'bg-orange-100 text-orange-800'
        };
      case 'jefe_seguridad':
        return { 
          label: 'Jefe de Seguridad', 
          icon: ShieldCheck, 
          description: 'Supervisión completa de seguridad',
          color: 'bg-red-100 text-red-800'
        };
      case 'analista_seguridad':
        return { 
          label: 'Analista de Seguridad', 
          icon: UserCheck, 
          description: 'Análisis y aprobaciones de seguridad',
          color: 'bg-yellow-100 text-yellow-800'
        };
      case 'supply_lead':
        return { 
          label: 'Lead de Supply', 
          icon: UserCheck, 
          description: 'Gestión de leads y suministros',
          color: 'bg-green-100 text-green-800'
        };
      case 'instalador':
        return { 
          label: 'Instalador', 
          icon: Users, 
          description: 'Control y registro de instalaciones',
          color: 'bg-cyan-100 text-cyan-800'
        };
      case 'bi':
        return { 
          label: 'Business Intelligence', 
          icon: Users, 
          description: 'Acceso a reportes y análisis',
          color: 'bg-blue-100 text-blue-800'
        };
      case 'monitoring_supervisor':
        return { 
          label: 'Supervisor Monitoreo', 
          icon: UserCheck, 
          description: 'Supervisión de operaciones de monitoreo',
          color: 'bg-amber-100 text-amber-800'
        };
      case 'monitoring':
        return { 
          label: 'Monitoreo', 
          icon: Users, 
          description: 'Operaciones de monitoreo básico',
          color: 'bg-blue-100 text-blue-800'
        };
      case 'supply':
        return { 
          label: 'Suministros', 
          icon: Users, 
          description: 'Gestión básica de suministros',
          color: 'bg-blue-100 text-blue-800'
        };
      case 'soporte':
        return { 
          label: 'Soporte', 
          icon: Users, 
          description: 'Asistencia técnica y atención al cliente',
          color: 'bg-blue-100 text-blue-800'
        };
      case 'pending':
        return { 
          label: 'Pendiente', 
          icon: Users, 
          description: 'Usuario pendiente de asignación de rol',
          color: 'bg-yellow-100 text-yellow-800'
        };
      case 'unverified':
        return { 
          label: 'No Verificado', 
          icon: Users, 
          description: 'Usuario sin verificar',
          color: 'bg-gray-100 text-gray-800'
        };
      default:
        return { 
          label: role, 
          icon: Users, 
          description: 'Rol del sistema',
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  // Safely handle permission changes
  const handlePermissionChange = (id: string, allowed: boolean) => {
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

  // Safely handle new permission addition with duplicate check
  const handleAddPermission = () => {
    // Check for duplicates
    const existingPermission = allPermissions.find(
      p => p.role === newPermission.role && 
           p.permission_type === newPermission.permissionType && 
           p.permission_id === newPermission.permissionId
    );

    if (existingPermission) {
      setDuplicateAlert(`Este permiso ya existe para el rol ${newPermission.role}. No es necesario añadirlo de nuevo.`);
      return;
    }

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

  // Handle opening the add permission dialog with a specific role
  const handleOpenAddPermission = (role: Role = activeTab as Role) => {
    setNewPermission({
      role: role,
      permissionType: '',
      permissionId: '',
      allowed: true
    });
    setIsAddPermissionOpen(true);
  };

  // Get all unique permission types
  const allPermissionTypes = useMemo(() => {
    const types = new Set<string>();
    
    if (permissions) {
      Object.values(permissions).forEach(rolePermissions => {
        if (rolePermissions) {
          rolePermissions.forEach(permission => {
            types.add(permission.permission_type);
          });
        }
      });
    }
    
    return Array.from(types);
  }, [permissions]);

  // Filter permissions by type if filter is active
  const getFilteredPermissions = (rolePermissions: Permission[] = []) => {
    if (typeFilter === 'all') {
      return rolePermissions;
    }
    
    return rolePermissions.filter(permission => 
      permission.permission_type === typeFilter
    );
  };

  // Get count of permissions by role
  const getPermissionCount = (role: Role) => {
    return permissions?.[role]?.length || 0;
  };

  // Handle retry when there's an error loading
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Create a fallback permissions structure when there's an error
  const fallbackPermissions = useMemo(() => {
    if (!error || !roles || roles.length === 0) return null;
    
    // Create empty structure with all required roles including new ones
    const fallback: Record<Role, Permission[]> = {
      owner: [],
      admin: [],
      supply_admin: [],
      coordinador_operaciones: [],
      jefe_seguridad: [],
      analista_seguridad: [],
      supply_lead: [],
      instalador: [],
      bi: [],
      monitoring_supervisor: [],
      monitoring: [],
      supply: [],
      soporte: [],
      pending: [],
      unverified: []
    };
    
    // Add each role with an empty array
    (roles as Role[]).forEach(role => {
      fallback[role] = [];
    });
    
    return fallback;
  }, [error, roles]);

  // Use real or fallback permissions
  const displayPermissions = useMemo(() => {
    return permissions || fallbackPermissions;
  }, [permissions, fallbackPermissions]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-sm text-muted-foreground">
            Cargando permisos del sistema...
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
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
          </div>
          <Button 
            onClick={() => handleOpenAddPermission()}
            className="flex items-center gap-2 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Añadir Permiso
          </Button>
        </div>

        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error al cargar los permisos</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{loadError}</p>
            <div className="pt-2">
              <Button 
                variant="outline" 
                onClick={handleRetry}
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

  // Si los roles o permisos no están cargados correctamente, mostrar mensaje
  if (!roles || roles.length === 0 || !displayPermissions) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTitle>Error al cargar el panel de permisos</AlertTitle>
        <AlertDescription>
          No se pudieron cargar correctamente los roles o permisos. Por favor, recargue la página o contacte al soporte.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Sistema de Permisos</h2>
                <p className="text-sm text-muted-foreground">
                  Configure los permisos y accesos para cada rol del sistema
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => handleOpenAddPermission()}
            className="flex items-center gap-2 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Añadir Permiso
          </Button>
        </div>
        
        {duplicateAlert && (
          <Alert variant="default" className="bg-yellow-50 border-yellow-200 mb-4">
            <AlertTitle className="text-yellow-800">Información</AlertTitle>
            <AlertDescription className="text-yellow-700">{duplicateAlert}</AlertDescription>
            <Button 
              variant="link" 
              className="text-yellow-800 p-0 h-auto absolute top-3 right-3"
              onClick={() => setDuplicateAlert(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}
        
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/30 bg-gradient-to-r from-muted/30 to-muted/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Matriz de Permisos por Rol</CardTitle>
                  <CardDescription>
                    Defina los permisos específicos para cada rol en el sistema
                  </CardDescription>
                </div>
              </div>
              
              {!isLoading && allPermissionTypes.length > 0 && (
                <PermissionTypeFilter
                  typeFilter={typeFilter}
                  allPermissionTypes={allPermissionTypes}
                  onTypeFilterChange={setTypeFilter}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!displayPermissions || Object.keys(displayPermissions).length === 0 ? (
              <div className="bg-muted/20 rounded-lg py-16 px-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                </div>
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
              <div>
                <RoleTabsList
                  roles={roles}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  getPermissionCount={getPermissionCount}
                  getRoleInfo={getRoleInfo}
                >
                  {roles?.map((role) => {
                    const rolePermissions = displayPermissions?.[role] || [];
                    const filteredPermissions = getFilteredPermissions(rolePermissions);
                    const roleInfo = getRoleInfo(role);
                    
                    return (
                      <div key={role} className="space-y-6">
                        {/* Role Information Header */}
                        <div className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg p-4 border border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-background border border-border/20 flex items-center justify-center">
                              <roleInfo.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{roleInfo.label}</h3>
                                <Badge variant="outline" className={`${roleInfo.color} font-medium`}>
                                  {role}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {rolePermissions.length} permiso{rolePermissions.length !== 1 ? 's' : ''}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {filteredPermissions.length} visible{filteredPermissions.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </div>

                        <RolePermissionsContent
                          role={role as Role}
                          permissions={rolePermissions}
                          filteredPermissions={filteredPermissions}
                          typeFilter={typeFilter}
                          onPermissionChange={handlePermissionChange}
                          onAddPermission={handleOpenAddPermission}
                        />
                      </div>
                    );
                  })}
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
          existingPermissions={allPermissions}
        />
      </div>
    </TooltipProvider>
  );
};

export default PermissionsManager;
