
import { Permission } from '@/types/roleTypes';

/**
 * Agrupa los permisos por tipo para una mejor organización
 */
export const groupPermissionsByType = (permissions: Permission[] = []): Record<string, Permission[]> => {
  const grouped: Record<string, Permission[]> = {};
  
  permissions.forEach(permission => {
    const type = permission.permission_type;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(permission);
  });
  
  return grouped;
};

/**
 * Devuelve un nombre legible para un ID de permiso
 */
export const getFriendlyPermissionName = (permissionId: string): string => {
  // Normaliza el ID
  const normalized = permissionId.replace(/_/g, ' ').toLowerCase();
  
  // Mapeo de permisos comunes
  const permissionMap: Record<string, string> = {
    'dashboard': 'Dashboard Principal',
    'users': 'Gestión de Usuarios',
    'roles': 'Gestión de Roles',
    'permissions': 'Gestión de Permisos',
    'create user': 'Crear Usuario',
    'edit user': 'Editar Usuario',
    'delete user': 'Eliminar Usuario',
    'view users': 'Ver Usuarios',
    'leads': 'Gestión de Leads',
    'monitoring': 'Monitoreo',
    'supply chain': 'Cadena de Suministro',
    'settings': 'Configuración',
    'reports': 'Reportes',
    'profile': 'Perfil',
    'api': 'API',
    'api keys': 'Claves API',
    'api credentials': 'Credenciales API',
    'general': 'General',
    'view report': 'Ver Reporte',
    'export report': 'Exportar Reporte',
    'admin panel': 'Panel Administrativo',
    'analytics': 'Analíticas',
    'view analytics': 'Ver Analíticas'
    // Agregar más mapeos según sea necesario
  };
  
  return permissionMap[normalized] || 
    normalized.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

/**
 * Devuelve una descripción para un tipo de permiso y ID específicos
 */
export const getPermissionDescription = (permissionType: string, permissionId: string): string => {
  // Crear una clave compuesta para el mapeo
  const key = `${permissionType}_${permissionId}`.toLowerCase();
  
  // Mapeo de descripciones de permisos
  const descriptionMap: Record<string, string> = {
    'page_dashboard': 'Acceso a la página principal del dashboard',
    'page_users': 'Acceso a la página de administración de usuarios',
    'page_roles': 'Acceso a la página de administración de roles',
    'page_permissions': 'Acceso a la página de administración de permisos',
    'page_monitoring': 'Acceso a la página de monitoreo en tiempo real',
    'page_supply_chain': 'Acceso a la página de cadena de suministro',
    'page_settings': 'Acceso a la página de configuración del sistema',
    'page_reports': 'Acceso a la página de reportes',
    'page_profile': 'Acceso a la página de perfil personal',
    'action_create_user': 'Permite crear nuevos usuarios en el sistema',
    'action_edit_user': 'Permite editar información de usuarios existentes',
    'action_delete_user': 'Permite eliminar usuarios del sistema',
    'action_export_report': 'Permite exportar reportes en diferentes formatos',
    'action_import_data': 'Permite importar datos masivos al sistema',
    'module_analytics': 'Acceso al módulo de analíticas y estadísticas',
    'module_api': 'Acceso al módulo de configuración de API',
    'admin_panel': 'Acceso completo al panel administrativo',
    'admin_settings': 'Acceso a configuraciones administrativas',
    'feature_export': 'Habilita la funcionalidad de exportación de datos',
    'feature_import': 'Habilita la funcionalidad de importación de datos',
    // Más descripciones pueden ser agregadas aquí
  };
  
  return descriptionMap[key] || '';
};

/**
 * Devuelve el nombre del icono adecuado para un tipo de permiso
 */
export const getPermissionTypeIcon = (type: string): string => {
  const typeToIconMap: Record<string, string> = {
    'page': 'layoutTemplate',
    'pages': 'layoutTemplate',
    'action': 'play',
    'actions': 'play',
    'module': 'boxes',
    'modules': 'boxes',
    'admin': 'shield',
    'administration': 'shield',
    'feature': 'star',
    'features': 'star',
    'report': 'fileBarChart',
    'reports': 'fileBarChart',
  };
  
  return typeToIconMap[type.toLowerCase()] || 'shield';
};

/**
 * Verifica si un permiso ya existe para un rol, tipo y ID específicos
 */
export const permissionExists = (
  permissions: Permission[] = [], 
  role: string, 
  permissionType: string, 
  permissionId: string
): Permission | undefined => {
  return permissions.find(
    p => p.role === role && 
         p.permission_type === permissionType && 
         p.permission_id === permissionId
  );
};
