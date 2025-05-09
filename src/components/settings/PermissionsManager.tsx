import React, { useState } from 'react';
import { useRoles } from '@/hooks/useRoles';
import { Role, Permission } from '@/types/roleTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PermissionsContainer } from './permissions/PermissionsContainer';
import { RoleTabsList } from './permissions/RoleTabsList';
import { AddPermissionDialog } from './permissions/AddPermissionDialog';
import { Switch } from '@/components/ui/switch';
import { 
  PlusCircle, 
  Loader2, 
  ShieldCheck, 
  Lock, 
  FileText,
  MonitorIcon,
  Settings2Icon,
  FileCog,
  InfoIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Group permissions by type for better organization
const groupPermissionsByType = (permissions: Permission[] = []) => {
  const groups: Record<string, Permission[]> = {};
  
  permissions?.forEach(permission => {
    const type = permission.permission_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(permission);
  });
  
  return groups;
};

// Get icon for permission type
const getPermissionTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'page':
      return <MonitorIcon className="h-4 w-4" />;
    case 'action':
      return <FileCog className="h-4 w-4" />;
    case 'feature':
      return <Settings2Icon className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

// Get friendly name for permission
const getFriendlyPermissionName = (id: string) => {
  const prettyNames: Record<string, string> = {
    'dashboard': 'Panel Principal',
    'settings': 'Configuración',
    'users': 'Usuarios',
    'monitoring': 'Monitoreo',
    'leads': 'Leads',
    'tickets': 'Tickets',
    'create_user': 'Crear Usuario',
    'edit_user': 'Editar Usuario',
    'delete_user': 'Eliminar Usuario',
    'approve_lead': 'Aprobar Lead',
    'reporting': 'Reportes',
    'notifications': 'Notificaciones',
    'installer_management': 'Gestión de Instaladores'
  };
  
  return prettyNames[id] || id.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Get description for permission
const getPermissionDescription = (type: string, id: string) => {
  const descriptions: Record<string, Record<string, string>> = {
    page: {
      'dashboard': 'Acceso a la pantalla principal del sistema',
      'settings': 'Acceso a la configuración del sistema',
      'users': 'Acceso a la gestión de usuarios',
      'monitoring': 'Acceso al monitoreo de dispositivos',
      'leads': 'Acceso a la gestión de leads',
      'tickets': 'Acceso a la gestión de tickets'
    },
    action: {
      'create_user': 'Permite crear nuevos usuarios en el sistema',
      'edit_user': 'Permite editar usuarios existentes',
      'delete_user': 'Permite eliminar usuarios del sistema',
      'approve_lead': 'Permite aprobar nuevos leads'
    },
    feature: {
      'reporting': 'Acceso al módulo de reportes y estadísticas',
      'notifications': 'Acceso al sistema de notificaciones',
      'installer_management': 'Acceso a la gestión de instaladores'
    }
  };
  
  return descriptions[type]?.[id] || `Permiso para ${id}`;
};

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
  
  // Filter for permission types
  const [typeFilter, setTypeFilter] = useState<string>('all');

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

  // Get all unique permission types
  const allPermissionTypes = React.useMemo(() => {
    const types = new Set<string>();
    
    if (permissions) {
      Object.values(permissions).forEach(rolePermissions => {
        rolePermissions.forEach(permission => {
          types.add(permission.permission_type);
        });
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

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Permisos del Sistema</h2>
            </div>
            <p className="text-muted-foreground">
              Configure los permisos y accesos para cada rol del sistema
            </p>
          </div>
          <Button 
            onClick={() => {
              // Reset form and open dialog
              setNewPermission({
                role: activeTab as Role,
                permissionType: '',
                permissionId: '',
                allowed: true
              });
              setIsAddPermissionOpen(true);
            }}
            className="flex items-center gap-2 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Añadir Permiso
          </Button>
        </div>
        
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Matriz de Permisos</CardTitle>
              </div>
              
              {!isLoading && allPermissionTypes.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Filtrar por:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-1 text-sm">
                        {typeFilter === 'all' ? (
                          'Todos los tipos'
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {getPermissionTypeIcon(typeFilter)}
                            <span>
                              {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}s
                            </span>
                          </div>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => setTypeFilter('all')}
                      >
                        <FileText className="h-4 w-4" />
                        <span>Todos los tipos</span>
                      </DropdownMenuItem>
                      
                      {allPermissionTypes.map(type => (
                        <DropdownMenuItem
                          key={type}
                          className="flex items-center gap-2"
                          onClick={() => setTypeFilter(type)}
                        >
                          {getPermissionTypeIcon(type)}
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}s</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            <CardDescription>
              Defina los permisos específicos para cada rol en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
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
                >
                  {roles?.map((role) => {
                    const rolePermissions = permissions?.[role] as Permission[];
                    const filteredPermissions = getFilteredPermissions(rolePermissions);
                    
                    // Group permissions by type for easier understanding
                    const groupedPermissions = groupPermissionsByType(filteredPermissions);
                    
                    const permissionGroups = Object.entries(groupedPermissions).map(([type, perms]) => ({
                      type,
                      icon: getPermissionTypeIcon(type),
                      permissions: perms
                    }));
                    
                    return (
                      <div key={role} className="space-y-6">
                        {/* Show helper text if no permissions after filtering */}
                        {filteredPermissions.length === 0 && typeFilter !== 'all' && (
                          <div className="bg-muted/20 rounded-lg py-8 px-6 text-center">
                            <div className="text-muted-foreground">
                              No hay permisos de tipo "{typeFilter}" para este rol.
                            </div>
                          </div>
                        )}
                        
                        {permissionGroups.map(group => (
                          <div key={group.type} className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                                {group.icon}
                              </div>
                              <h3 className="text-md font-semibold">
                                {group.type.charAt(0).toUpperCase() + group.type.slice(1)}s
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help ml-2 inline-block" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      {group.type === 'page' && 'Permisos para acceder a páginas del sistema'}
                                      {group.type === 'action' && 'Permisos para realizar acciones específicas'}
                                      {group.type === 'feature' && 'Permisos para usar funcionalidades del sistema'}
                                      {!['page', 'action', 'feature'].includes(group.type) && `Permisos de tipo ${group.type}`}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </h3>
                            </div>
                            
                            <div className="bg-card/50 rounded-md border border-border/40 overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-muted/30 border-b border-border/30">
                                  <tr>
                                    <th className="text-sm font-medium text-left p-4">Recurso</th>
                                    <th className="text-sm font-medium text-left p-4">Descripción</th>
                                    <th className="text-sm font-medium text-right p-4">Acceso</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                  {group.permissions.map((permission) => (
                                    <tr key={permission.id} className="hover:bg-muted/20">
                                      <td className="p-4 text-sm font-medium">
                                        {getFriendlyPermissionName(permission.permission_id)}
                                      </td>
                                      <td className="p-4 text-sm text-muted-foreground">
                                        {getPermissionDescription(permission.permission_type, permission.permission_id)}
                                      </td>
                                      <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <span className={permission.allowed ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
                                            {permission.allowed ? "Permitido" : "Denegado"}
                                          </span>
                                          <Switch
                                            checked={permission.allowed}
                                            onCheckedChange={(checked) => handlePermissionChange(permission.id, checked)}
                                            className="data-[state=checked]:bg-green-600"
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                        
                        {/* Show empty state if no permissions for this role */}
                        {rolePermissions?.length === 0 && (
                          <div className="bg-muted/20 rounded-lg py-12 px-6 text-center">
                            <h3 className="text-md font-medium mb-2">No hay permisos para este rol</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                              Añada permisos para definir lo que los usuarios con el rol de "{role}" pueden hacer.
                            </p>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setNewPermission({
                                  role: role as Role,
                                  permissionType: '',
                                  permissionId: '',
                                  allowed: true
                                });
                                setIsAddPermissionOpen(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <PlusCircle className="h-4 w-4" />
                              Añadir Permiso
                            </Button>
                          </div>
                        )}
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
        />
      </div>
    </TooltipProvider>
  );
};

export default PermissionsManager;
