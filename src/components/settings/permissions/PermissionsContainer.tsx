
import React from 'react';
import { Permission } from '@/types/roleTypes';
import { TabsContent } from '@/components/ui/tabs';
import { PermissionsList } from './PermissionsList';
import { AlertCircle } from 'lucide-react';

interface PermissionsContainerProps {
  role: string;
  permissions: Permission[] | undefined;
  onPermissionChange: (id: string, allowed: boolean) => void; // Fixed: changed from number to string
}

export const PermissionsContainer = ({ 
  role, 
  permissions, 
  onPermissionChange 
}: PermissionsContainerProps) => {

  const groupPermissionsByType = (rolePermissions: Permission[] = []) => {
    const grouped: Record<string, Permission[]> = {};
    
    // Definir el orden de los tipos de permisos para la presentación
    const typeOrder = ['page', 'pages', 'module', 'modules', 'action', 'actions', 'admin', 'administration'];
    
    // Agrupar los permisos por tipo
    rolePermissions.forEach(permission => {
      const type = permission.permission_type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(permission);
    });
    
    // Ordenar los permisos dentro de cada tipo
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => a.permission_id.localeCompare(b.permission_id));
    });
    
    // Ordenar los tipos según el orden definido
    const sortedTypes = Object.keys(grouped).sort((a, b) => {
      const aIndex = typeOrder.findIndex(t => a.toLowerCase().includes(t));
      const bIndex = typeOrder.findIndex(t => b.toLowerCase().includes(t));
      
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    
    // Crear un nuevo objeto con los tipos ordenados
    const sortedGrouped: Record<string, Permission[]> = {};
    sortedTypes.forEach(type => {
      sortedGrouped[type] = grouped[type];
    });
    
    return sortedGrouped;
  };

  const groupedPermissions = groupPermissionsByType(permissions);

  return (
    <TabsContent key={role} value={role}>
      {permissions && permissions.length > 0 ? (
        Object.entries(groupedPermissions).map(([type, typePermissions]) => (
          <PermissionsList
            key={type}
            type={type}
            typePermissions={typePermissions}
            onPermissionChange={onPermissionChange}
          />
        ))
      ) : (
        <div className="bg-muted/10 rounded-xl p-8 text-center flex flex-col items-center">
          <div className="bg-muted/50 rounded-full h-12 w-12 flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium mb-2">No hay permisos configurados</h4>
          <p className="text-muted-foreground max-w-md">
            No hay permisos configurados para este rol. Añada nuevos permisos utilizando el botón "Añadir Permiso".
          </p>
        </div>
      )}
    </TabsContent>
  );
};
