
import React from 'react';
import { Permission } from '@/types/roleTypes';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  HelpCircle,
  Layout,
  Play,
  Box,
  Shield,
  Star,
  FileBarChart,
  AlertTriangle
} from 'lucide-react';

interface PermissionToggleProps {
  permission: Permission;
  onToggle: (id: string, allowed: boolean) => void;
}

export const PermissionToggle = ({ permission, onToggle }: PermissionToggleProps) => {
  const getPermissionInfo = (permissionType: string, permissionId: string) => {
    const typeIcons = {
      'page': Layout,
      'action': Play,
      'module': Box,
      'admin': Shield,
      'feature': Star,
      'report': FileBarChart,
    };

    const friendlyNames: Record<string, string> = {
      'dashboard': 'Panel Principal',
      'users': 'Gestión de Usuarios',
      'services': 'Servicios',
      'leads': 'Gestión de Leads',
      'monitoring': 'Monitoreo',
      'supply': 'Suministros',
      'settings': 'Configuración',
      'reports': 'Reportes',
      'profile': 'Perfil',
      'create_service': 'Crear Servicios',
      'edit_service': 'Editar Servicios',
      'view_services': 'Ver Servicios',
      'manage_leads': 'Gestionar Leads',
      'convert_lead_to_service': 'Convertir Lead a Servicio',
      'schedule_services': 'Programar Servicios',
      'complete_evaluations': 'Completar Evaluaciones',
      'upload_documents': 'Subir Documentos',
      'update_personal_info': 'Actualizar Información Personal',
      'view_assignments': 'Ver Asignaciones',
      'submit_reports': 'Enviar Reportes',
      'custodio_portal': 'Portal de Custodio',
      'evaluations': 'Evaluaciones',
    };

    const descriptions: Record<string, string> = {
      'dashboard': 'Acceso al panel principal del sistema',
      'users': 'Permite gestionar usuarios del sistema',
      'services': 'Acceso a la gestión de servicios',
      'leads': 'Gestión de leads y prospectos',
      'monitoring': 'Acceso al sistema de monitoreo',
      'supply': 'Gestión de cadena de suministros',
      'settings': 'Configuración del sistema',
      'reports': 'Acceso a reportes y análisis',
      'profile': 'Gestión del perfil personal',
      'create_service': 'Capacidad de crear nuevos servicios',
      'edit_service': 'Modificar servicios existentes',
      'view_services': 'Visualizar servicios del sistema',
      'manage_leads': 'Gestionar leads y asignaciones',
      'convert_lead_to_service': 'Convertir leads en servicios activos',
      'schedule_services': 'Programar y agendar servicios',
      'complete_evaluations': 'Completar evaluaciones asignadas',
      'upload_documents': 'Subir documentos al sistema',
      'update_personal_info': 'Actualizar información personal',
      'view_assignments': 'Ver asignaciones y tareas',
      'submit_reports': 'Enviar reportes del sistema',
      'custodio_portal': 'Acceso al portal especializado de custodios',
      'evaluations': 'Sistema de evaluaciones y calificaciones',
    };

    const warnings: Record<string, string> = {
      'dashboard': 'Sin acceso al dashboard, el usuario no podrá ver información principal',
      'users': 'CRÍTICO: Permite gestionar todos los usuarios del sistema',
      'create_service': 'Permite crear nuevos servicios que pueden afectar operaciones',
      'manage_leads': 'Acceso a información sensible de clientes potenciales',
      'settings': 'CRÍTICO: Acceso a configuraciones que pueden afectar todo el sistema',
    };

    const IconComponent = typeIcons[permissionType] || HelpCircle;
    const friendlyName = friendlyNames[permissionId] || permissionId.replace(/_/g, ' ');
    const description = descriptions[permissionId] || `Permiso relacionado con ${permissionId}`;
    const warning = warnings[permissionId];

    return {
      icon: IconComponent,
      friendlyName,
      description,
      warning,
      isCritical: warning?.includes('CRÍTICO')
    };
  };

  const info = getPermissionInfo(permission.permission_type, permission.permission_id);
  const IconComponent = info.icon;

  const getTypeLabel = (type: string) => {
    const labels = {
      'page': 'Página',
      'action': 'Acción',
      'module': 'Módulo',
      'admin': 'Admin',
      'feature': 'Función',
      'report': 'Reporte',
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      'page': 'bg-blue-100 text-blue-800',
      'action': 'bg-green-100 text-green-800',
      'module': 'bg-purple-100 text-purple-800',
      'admin': 'bg-red-100 text-red-800',
      'feature': 'bg-orange-100 text-orange-800',
      'report': 'bg-cyan-100 text-cyan-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
      permission.allowed 
        ? 'bg-green-50 border-green-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-3 flex-1">
        <div className={`h-8 w-8 rounded-md flex items-center justify-center ${
          permission.allowed ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          <IconComponent className={`h-4 w-4 ${
            permission.allowed ? 'text-green-600' : 'text-gray-500'
          }`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{info.friendlyName}</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${getTypeBadgeColor(permission.permission_type)}`}
            >
              {getTypeLabel(permission.permission_type)}
            </Badge>
            {info.isCritical && (
              <Badge variant="destructive" className="text-xs">
                Crítico
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{info.description}</p>
          {info.warning && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span className="text-xs text-amber-600">{info.warning}</span>
            </div>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1 hover:bg-gray-100 rounded">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-2">
              <div>
                <strong>Permiso:</strong> {info.friendlyName}
              </div>
              <div>
                <strong>Tipo:</strong> {getTypeLabel(permission.permission_type)}
              </div>
              <div>
                <strong>Descripción:</strong> {info.description}
              </div>
              {info.warning && (
                <div className="text-amber-600">
                  <strong>Advertencia:</strong> {info.warning}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                ID técnico: {permission.permission_id}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      <Switch
        checked={permission.allowed}
        onCheckedChange={(checked) => onToggle(permission.id, checked)}
        className="ml-3"
      />
    </div>
  );
};
