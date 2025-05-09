
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Permission, PermissionsByRole, RolePermissionInput, Role } from '@/types/roleTypes';

export const useRolePermissions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener todos los permisos por rol
  const { data: permissions, isLoading, error, refetch } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      try {
        // Direct query to avoid RLS recursion issues
        const { data, error } = await supabase
          .from('role_permissions')
          .select('id, role, permission_type, permission_id, allowed');

        if (error) {
          console.error('Error al obtener permisos:', error);
          throw new Error(`Error fetching permissions: ${error.message}`);
        }

        // Initialize roles that we know should exist
        const defaultRoles: Role[] = ['admin', 'owner', 'pending', 'unverified'];
        
        // Attempt to get all roles if available
        let allRoles: Role[] = defaultRoles;
        try {
          const { data: userRoles, error: rolesError } = await supabase
            .rpc('get_user_roles_safe');
          
          if (!rolesError && userRoles) {
            // Extract just the role names and combine with defaultRoles to ensure we have them all
            const fetchedRoles = userRoles.map((r: any) => r.role as Role);
            allRoles = [...new Set([...defaultRoles, ...fetchedRoles])];
          }
        } catch (err) {
          console.error('Error fetching roles, using defaults:', err);
        }
        
        // Agrupar permisos por rol
        const permissionsByRole = {} as PermissionsByRole;
        
        // Initialize with empty arrays for all roles
        allRoles.forEach(role => {
          permissionsByRole[role] = [];
        });
        
        // Populate with fetched permissions
        if (data && Array.isArray(data)) {
          data.forEach(permission => {
            // Add the role to our list if it doesn't exist yet
            const typedRole = permission.role as Role;
            
            if (!permissionsByRole[typedRole]) {
              permissionsByRole[typedRole] = [];
            }
            
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
        throw err;
      }
    },
    staleTime: 60000, // Caché por 1 minuto para mejorar rendimiento
    retry: 1, // Solo un reintento para evitar problemas de recursión
  });

  // Mutación para actualizar un permiso existente
  const updatePermission = useMutation({
    mutationFn: async ({ id, allowed }: { id: number, allowed: boolean }) => {
      try {
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

  // Mutación para añadir un nuevo permiso usando la función de seguridad
  const addPermission = useMutation({
    mutationFn: async ({ role, permissionType, permissionId, allowed }: RolePermissionInput) => {
      try {
        console.log(`Añadiendo permiso: ${role}.${permissionType}.${permissionId}=${allowed}`);
        
        const { data, error } = await supabase.rpc('add_permission_safe', {
          p_role: role,
          p_permission_type: permissionType,
          p_permission_id: permissionId,
          p_allowed: allowed
        });
        
        if (error) {
          console.error('Error en add_permission_safe:', error);
          throw new Error(`Error al añadir el permiso: ${error.message}`);
        }
        
        // Verificar errores de aplicación en la respuesta
        if (typeof data === 'object' && data !== null && 'error' in data) {
          console.error('Error retornado por add_permission_safe:', data.error);
          throw new Error(`Error al añadir el permiso: ${String(data.error)}`);
        }
        
        console.log('Respuesta de add_permission_safe:', data);
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
    refetch,
    updatePermission,
    addPermission
  };
};
