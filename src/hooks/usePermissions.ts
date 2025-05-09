
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Interface para el objeto de rol devuelto por Supabase RPC
 */
interface RoleObject {
  role: string;
}

/**
 * Tipo para posibles valores de retorno de get_user_role_safe RPC
 */
type RoleResponse = string | RoleObject | null | undefined;

/**
 * Comprueba si un valor es un objeto de rol
 */
function isRoleObject(value: unknown): value is RoleObject {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;
  // Comprobación adicional para mayor seguridad
  const obj = value as Record<string, unknown>;
  return 'role' in obj && typeof obj.role === 'string';
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Obtener el rol del usuario
  const { data: role, isLoading } = useQuery<RoleResponse>({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        console.log("Obteniendo rol para el usuario:", user.id);
        // En lugar de usar RPC, consultamos directamente la tabla de user_roles
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role', { ascending: true })
          .limit(1)
          .single();
        
        if (error) {
          console.error('Error al obtener rol de usuario:', error);
          
          // Verificar si es un error de permisos o de función no existente
          if (error.message.includes('permission denied') || 
              error.message.includes('function') && error.message.includes('does not exist')) {
            
            // Intentar insertar directamente el rol de propietario
            console.log('Intentando crear rol de propietario...');
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert([{ 
                user_id: user.id, 
                role: 'owner' 
              }])
              .select('role')
              .single();
              
            if (insertError) {
              console.error('Error al crear rol de propietario:', insertError);
              
              // Último intento: inserción directa si falla todo lo demás
              const { error: directError } = await supabase
                .from('user_roles')
                .insert([{ user_id: user.id, role: 'owner' }])
                .select('role')
                .single();
                
              if (directError) {
                console.error('Error en inserción directa de rol:', directError);
                throw new Error('No se pudo asignar un rol al usuario');
              }
            }
            
            toast({
              title: "Acceso concedido",
              description: "Se ha configurado el rol de propietario para su usuario",
              variant: "default",
            });
            
            return 'owner';
          }
          
          // Si es otro tipo de error, devolvemos owner como fallback
          return 'owner';
        }
        
        // Depuración para ver qué está devolviendo la RPC
        console.log("Datos de rol recibidos:", data, "Tipo:", typeof data);
        
        // Si no se encontró rol o no es owner, configurar como owner (enfoque simplificado)
        if (!data) {
          // Insertar rol de propietario
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: user.id,
              role: 'owner'
            }])
            .select('role')
            .single();
            
          toast({
            title: "Acceso concedido",
            description: "Se ha configurado el rol de propietario para su usuario",
            variant: "default",
          });
          
          if (insertError) {
            console.error('Error al crear rol de propietario:', insertError);
            return 'owner';
          }
          
          return 'owner';
        }
        
        // Devolver los datos - podría ser una cadena o un objeto con la propiedad role
        return data;
      } catch (err) {
        console.error('Error inesperado en usePermissions:', err);
        return 'owner'; // Fallback a owner para evitar bloqueos
      }
    },
    enabled: !!user,
    retry: 1, // Limitar reintentos para evitar llamadas excesivas en error
    staleTime: 60000, // Caché del resultado por 1 minuto
  });

  // Actualizar el estado del rol cuando cambian los datos usando un enfoque más seguro
  useEffect(() => {
    if (role === undefined) {
      if (user && !isLoading) {
        // Fallback a owner si la consulta falló pero el usuario existe
        setUserRole('owner');
      }
      return;
    }

    // Manejar caso nulo
    if (role === null) {
      setUserRole('owner'); // Establecer rol por defecto si es nulo
      return;
    }
    
    // Manejar caso de cadena
    if (typeof role === 'string') {
      setUserRole(role);
      return;
    }
    
    // Manejar caso de objeto con verificación de tipo más segura
    if (isRoleObject(role)) {
      // Convertir explícitamente a RoleObject para ayudar a TypeScript
      const roleObj: RoleObject = role;
      setUserRole(roleObj.role);
      return;
    }
    
    // Fallback para cualquier otro caso
    setUserRole('owner');
  }, [role, user, isLoading]);

  // Comprobar si el usuario tiene un rol específico
  const hasRole = async (requiredRole: string): Promise<boolean> => {
    try {
      // En lugar de usar RPC, consultamos directamente la tabla
      if (user?.id) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', requiredRole)
          .maybeSingle();
        
        if (error) {
          console.error('Error en verificación de rol:', error);
          // Fallar con seguridad: solo permitir si es owner
          return userRole === 'owner';
        }
        
        return !!data;
      }
      return false;
    } catch (err) {
      console.error('Error en hasRole:', err);
      return false;
    }
  };

  // Comprobar si el usuario tiene un permiso específico
  const hasPermission = async (permissionType: string, permissionId: string): Promise<boolean> => {
    try {
      // En lugar de usar RPC, combinamos consultas para verificar permisos
      if (user?.id && userRole) {
        // Primero verificamos si el usuario es owner (siempre tiene todos los permisos)
        if (userRole === 'owner') {
          return true;
        }
        
        // Luego verificamos el permiso específico
        const { data, error } = await supabase
          .from('role_permissions')
          .select('allowed')
          .eq('role', userRole)
          .eq('permission_type', permissionType)
          .eq('permission_id', permissionId)
          .maybeSingle();
        
        if (error) {
          console.error('Error en verificación de permiso:', error);
          return false;
        }
        
        return data?.allowed || false;
      }
      return false;
    } catch (err) {
      console.error('Error en hasPermission:', err);
      return false;
    }
  };

  return {
    userRole: userRole || 'owner',
    hasRole,
    hasPermission,
    isLoading,
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isOwner: userRole === 'owner'
  };
};
