
import React from 'react';
import { Role, Permission } from '@/types/roleTypes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  PlusCircle, 
  Layout,
  Play,
  Box,
  Shield,
  Star,
  FileBarChart,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

interface PermissionsPanelProps {
  selectedRole: Role;
  permissions: Permission[];
  onPermissionToggle: (id: string, allowed: boolean) => void;
  onAddPermission: () => void;
}

export const PermissionsPanel = ({ 
  selectedRole, 
  permissions, 
  onPermissionToggle, 
  onAddPermission 
}: PermissionsPanelProps) => {
  const getTypeIcon = (type: string) => {
    const icons = {
      'page': Layout,
      'action': Play,
      'module': Box,
      'admin': Shield,
      'feature': Star,
      'report': FileBarChart,
    };
    return icons[type as keyof typeof icons] || HelpCircle;
  };

  const getFriendlyName = (permissionId: string): string => {
    const names: Record<string, string> = {
      'dashboard': 'Panel Principal',
      'users': 'Usuarios',
      'services': 'Servicios',
      'leads': 'Leads',
      'monitoring': 'Monitoreo',
      'supply': 'Suministros',
      'settings': 'Configuración',
      'reports': 'Reportes',
      'profile': 'Perfil',
      'instalaciones': 'Instalaciones',
      'installers_portal': 'Portal Instaladores',
      'create_service': 'Crear Servicios',
      'edit_service': 'Editar Servicios',
      'manage_leads': 'Gestionar Leads',
      'view_installations': 'Ver Instalaciones',
      'register_installation': 'Registrar Instalación',
      'update_installation_status': 'Actualizar Estado',
      'upload_evidence': 'Subir Evidencia',
    };
    return names[permissionId] || permissionId.replace(/_/g, ' ');
  };

  const getPermissionDescription = (permissionId: string): string => {
    const descriptions: Record<string, string> = {
      'dashboard': 'Acceso al panel principal del sistema',
      'users': 'Gestión de usuarios del sistema',
      'services': 'Crear y gestionar servicios',
      'leads': 'Gestión de leads y prospectos',
      'monitoring': 'Monitoreo en tiempo real',
      'supply': 'Cadena de suministros',
      'settings': 'Configuración del sistema',
      'reports': 'Reportes y análisis',
      'instalaciones': 'Gestión de instalaciones',
      'installers_portal': 'Portal para instaladores',
      'create_service': 'Permite crear nuevos servicios',
      'manage_leads': 'Gestionar leads asignados',
      'view_installations': 'Ver instalaciones programadas',
    };
    return descriptions[permissionId] || 'Permiso del sistema';
  };

  const isCriticalPermission = (permissionId: string): boolean => {
    const critical = ['users', 'settings', 'dashboard'];
    return critical.includes(permissionId);
  };

  // Agrupar permisos por tipo
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const type = permission.permission_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getTypeLabel = (type: string) => {
    const labels = {
      'page': 'Páginas',
      'action': 'Acciones',
      'module': 'Módulos',
      'admin': 'Admin',
      'feature': 'Funciones',
      'report': 'Reportes',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Permisos para {selectedRole}
          </h3>
          <p className="text-sm text-gray-600">
            {permissions.length} permisos configurados
          </p>
        </div>
        <Button onClick={onAddPermission} size="sm" className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Añadir
        </Button>
      </div>

      {/* Permisos */}
      {Object.keys(groupedPermissions).length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
          <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">No hay permisos configurados</p>
          <Button onClick={onAddPermission} variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Añadir Primer Permiso
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedPermissions).map(([type, typePermissions]) => {
            const TypeIcon = getTypeIcon(type);
            
            return (
              <div key={type} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TypeIcon className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    {getTypeLabel(type)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {typePermissions.length}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {typePermissions.map((permission) => {
                    const friendlyName = getFriendlyName(permission.permission_id);
                    const description = getPermissionDescription(permission.permission_id);
                    const isCritical = isCriticalPermission(permission.permission_id);
                    
                    return (
                      <div 
                        key={permission.id} 
                        className={`flex items-center justify-between p-3 rounded-md border ${
                          permission.allowed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {friendlyName}
                            </span>
                            {isCritical && (
                              <Badge variant="destructive" className="text-xs">
                                Crítico
                              </Badge>
                            )}
                          </div>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-gray-400 hover:text-gray-600">
                                <HelpCircle className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">{friendlyName}</p>
                                <p className="text-sm">{description}</p>
                                {isCritical && (
                                  <div className="flex items-center gap-1 text-amber-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span className="text-xs">Permiso crítico del sistema</span>
                                  </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  ID: {permission.permission_id}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <Switch
                          checked={permission.allowed}
                          onCheckedChange={(checked) => onPermissionToggle(permission.id, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
