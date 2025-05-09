
import { Permission } from '@/types/roleTypes';

// Group permissions by type for better organization
export const groupPermissionsByType = (permissions: Permission[] = []) => {
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
export const getPermissionTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'page':
      return 'monitor';
    case 'action':
      return 'file-cog';
    case 'feature':
      return 'settings-2';
    default:
      return 'file-text';
  }
};

// Get friendly name for permission
export const getFriendlyPermissionName = (id: string) => {
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
export const getPermissionDescription = (type: string, id: string) => {
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
