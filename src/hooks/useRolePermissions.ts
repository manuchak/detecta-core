
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Permission, PermissionsByRole, RolePermissionInput, Role } from '@/types/roleTypes';

export const useRolePermissions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consulta para obtener todos los permisos por rol
  const { data: permissions, isLoading, error } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      try {
        // Utilizamos la función segura para evitar problemas de recursión RLS
        // Cambiamos de rpc a from('role_permissions') y select()
        const { data, error } = await supabase
          .from('role_permissions')
          .select('id, role, permission_type, permission_id, allowed');

        if (error) {
          console.error('Error al obtener permisos:', error);
          throw new Error(`Error fetching permissions: ${error.message}`);
        }

        // Agrupar permisos por rol
        const permissionsByRole = {} as PermissionsByRole;
        
        // Inicializar el objeto permissionsByRole con arrays vacíos para todos los roles
        // Usar from('user_roles') en lugar de rpc
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .is('user_id', null)
          .or('user_id.eq.00000000-0000-0000-0000-000000000000');
        
        const allRoles: Role[] = roles ? 
          roles.map((r: any) => r.role as Role) : 
          ['admin', 'supply', 'supply_admin', 'soporte', 'bi', 
           'monitoring', 'monitoring_supervisor', 'owner', 'pending', 'unverified'];
        
        allRoles.forEach(role => {
          permissionsByRole[role] = [];
        });
        
        // Poblar con los permisos recibidos
        if (data && Array.isArray(data)) {
          data.forEach(permission => {
            // Convertir el rol de la base de datos a nuestro tipo Role
            const typedRole = permission.role as Role;
            
            // Convertir el permiso a nuestro tipo Permission
            permissionsByRole[typedRole] = permissionsByRole[typedRole] || [];
            permissionsByRole[typedRole].push({
              id: permission.id,
              role: typedRole,
              permission_type: permission.permission_type,
              permission_id: permission.permission_id,
              allowed: permission.allowed
            });
          });
        }
        
        return permissionsByRole;
      } catch (err) {
        console.error('Error inesperado en useRolePermissions:', err);
        // Devolvemos un objeto vacío en caso de error para evitar bloqueos en la UI
        return {} as PermissionsByRole;
      }
    },
    staleTime: 60000, // Caché por 1 minuto para mejorar rendimiento
    retry: 2 // Intentos limitados para evitar ciclos infinitos
  });

  // Mutación para actualizar un permiso existente
  const updatePermission = useMutation({
    mutationFn: async ({ id, allowed }: { id: number, allowed: boolean }) => {
      try {
        // En lugar de usar RPC, actualizamos directamente la tabla
        const { data, error } = await supabase
          .from('role_permissions')
          .update({ allowed })
          .eq('id', id)
          .select('id, allowed')
          .single();
        
        if (error) {
          throw new Error(`Error updating permission: ${error.message}`);
        }
        
        return { id, allowed };
      } catch (error) {
        console.error('Error en updatePermission:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Permiso actualizado",
        description: "El permiso ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el permiso",
        variant: "destructive",
      });
    }
  });

  // Mutación para añadir un nuevo permiso
  const addPermission = useMutation({
    mutationFn: async ({ role, permissionType, permissionId, allowed }: RolePermissionInput) => {
      try {
        // Formatear el cuerpo de la solicitud
        const requestBody = { 
          role, 
          permissionType, 
          permissionId, 
          allowed 
        };
        
        // Registro detallado para depuración
        console.log('Enviando solicitud de permiso:', requestBody);
        
        // Invocar la función edge con manejo de errores
        const { data, error } = await supabase.functions.invoke('add-permission', {
          body: requestBody
        });
        
        // Manejar errores de la función edge
        if (error) {
          console.error('Error en la función edge:', error);
          throw new Error(`Error añadiendo permiso: ${error.message || String(error)}`);
        }
        
        // Verificar errores de aplicación en la respuesta
        if (data && data.error) {
          console.error('Error de aplicación desde la función edge:', data.error);
          throw new Error(`Error añadiendo permiso: ${data.error}`);
        }
        
        // Registro de éxito
        console.log('Permiso añadido exitosamente:', data);
        return data;
      } catch (err) {
        console.error('Excepción en mutación addPermission:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log('Éxito en mutación de permiso añadido:', data);
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Permiso añadido",
        description: "El nuevo permiso ha sido añadido correctamente",
      });
    },
    onError: (error) => {
      console.error('Error en mutación de permiso añadido:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al añadir el permiso",
        variant: "destructive",
      });
    }
  });

  return {
    permissions,
    isLoading,
    error,
    updatePermission,
    addPermission
  };
};
